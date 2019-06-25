import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createStore } from 'redux';

import APIClient from './api';
import { Annotation, AnnotatableSection } from './utils/annotation';
import { LayoutController } from './utils/layout';
import { getNextCommentId, getNextReplyId } from './utils/sequences';
import {
    Comment,
    CommentReply,
    reducer,
    Author,
    Store,
    ModerationState
} from './state';
import { addComment, addReply, setFocusedComment } from './actions';
import CommentComponent from './components/Comment';
import TopBarComponent from './components/TopBar';
import ModerationBarComponent from './components/ModerationBar';

import './main.scss';

function renderCommentsUi(
    store: Store,
    api: APIClient,
    layout: LayoutController,
    user: Author,
    comments: Comment[],
    moderationEnabled: boolean,
    moderationState: ModerationState
): React.ReactElement {
    let { commentsEnabled, showResolvedComments } = store.getState().settings;
    let commentsToRender = comments;

    if (!commentsEnabled) {
        commentsToRender = [];
    } else if (!showResolvedComments) {
        // Hide all resolved comments unless they were resolved this session
        commentsToRender = commentsToRender.filter(comment => {
            return !(comment.isResolved && !comment.resolvedThisSession);
        });
    }
    let commentsRendered = commentsToRender.map(comment => (
        <CommentComponent
            key={comment.localId}
            store={store}
            api={api}
            layout={layout}
            user={user}
            comment={comment}
        />
    ));

    let moderationBar = <></>;

    if (moderationEnabled) {
        moderationBar = (
            <ModerationBarComponent
                store={store}
                api={api}
                {...moderationState}
            />
        );
    }

    return (
        <div>
            <TopBarComponent store={store} />
            <ol className="comments-list">{commentsRendered}</ol>
            {moderationBar}
        </div>
    );
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function moderationLockCoroutine(api: APIClient) {
    // A coroutine that pings the "ExtendModerationLock" endpoint every minute
    // while the browser window is open

    while (true) {
        await api.extendModerationLock();
        await sleep(1000 * 60);
    }
}

export function initCommentsApp(
    element: HTMLElement,
    api: APIClient,
    authorId: number,
    authorName: string,
    addAnnotatableSections: (
        addAnnotatableSection: (
            contentPath: string,
            element: HTMLElement
        ) => void
    ) => void,
    moderationEnabled: boolean
) {
    let annotatableSections: { [contentPath: string]: AnnotatableSection } = {};
    let focusedComment: number | null = null;

    let store = createStore(reducer);
    let layout = new LayoutController();

    let user = new Author(authorId, authorName);

    if (moderationEnabled) {
        // Launch moderation lock coroutine
        moderationLockCoroutine(api);
    }

    let render = () => {
        let state = store.getState();
        let commentList: Comment[] = [];

        for (let commentId in state.comments) {
            commentList.push(state.comments[commentId]);
        }

        // Check if the focused comment has changed
        if (state.focusedComment != focusedComment) {
            // Tell layout controller about the focused comment
            // so it is moved alongside it's annotation
            layout.setFocusedComment(state.focusedComment);

            // Unfocus previously focused annotation
            if (focusedComment) {
                // Note: the comment may have just been deleted. In that case,
                // don't worry about unfocusing the annotation as that will be
                // deleted
                if (focusedComment in state.comments) {
                    state.comments[focusedComment].annotation.onUnfocus();
                }
            }

            // Focus the new focused annotation
            if (state.focusedComment) {
                state.comments[state.focusedComment].annotation.onFocus();
            }

            focusedComment = state.focusedComment;
        }

        ReactDOM.render(
            renderCommentsUi(
                store,
                api,
                layout,
                user,
                commentList,
                moderationEnabled,
                state.moderation
            ),
            element,
            () => {
                // Render again if layout has changed (eg, a comment was added, deleted or resized)
                // This will just update the "top" style attributes in the comments to get them to move
                if (layout.isDirty) {
                    layout.refresh();

                    ReactDOM.render(
                        renderCommentsUi(
                            store,
                            api,
                            layout,
                            user,
                            commentList,
                            moderationEnabled,
                            state.moderation
                        ),
                        element
                    );
                }
            }
        );
    };

    render();

    store.subscribe(render);

    let newComment = (annotation: Annotation) => {
        let commentId = getNextCommentId();

        // Focus comment when annotation is clicked
        annotation.setOnClickHandler(() => {
            store.dispatch(setFocusedComment(commentId));
        });

        // Let layout engine know the annotation so it would position the comment correctly
        layout.setCommentAnnotation(commentId, annotation);

        // Create the comment
        store.dispatch(
            addComment(Comment.makeNew(commentId, annotation, user))
        );

        // Focus the comment
        store.dispatch(setFocusedComment(commentId));
    };

    let selectionEnabled = () => {
        return store.getState().settings.commentsEnabled;
    };

    addAnnotatableSections((contentPath, element) => {
        annotatableSections[contentPath] = new AnnotatableSection(
            contentPath,
            element,
            newComment,
            selectionEnabled
        );
    });

    // Fetch existing comments
    api.fetchAllComments().then(comments => {
        for (let comment of comments) {
            let section = annotatableSections[comment.content_path];
            if (!section) {
                continue;
            }

            // Create annotation
            let annotation = section.addAnnotation({
                quote: comment.quote,
                ranges: [
                    {
                        start: comment.start_xpath,
                        startOffset: comment.start_offset,
                        end: comment.end_xpath,
                        endOffset: comment.end_offset
                    }
                ]
            });

            let commentId = getNextCommentId();

            // Focus comment when annotation is clicked
            annotation.setOnClickHandler(() => {
                store.dispatch(setFocusedComment(commentId));
            });

            // Let layout engine know the annotation so it would position the comment correctly
            layout.setCommentAnnotation(commentId, annotation);

            // Create comment
            store.dispatch(
                addComment(Comment.fromApi(commentId, annotation, comment))
            );

            // Create replies
            for (let reply of comment.replies) {
                store.dispatch(
                    addReply(
                        commentId,
                        CommentReply.fromApi(getNextReplyId(), reply)
                    )
                );
            }
        }
    });

    // Unfocus when document body is clicked
    document.body.addEventListener('click', e => {
        if (e.target instanceof HTMLElement) {
            // ignore if click target is a comment or a highlight
            if (
                !e.target.closest(
                    '#comments .comment, .annotator-hl, .annotator-adder'
                )
            ) {
                // Running store.dispatch directly here seems to prevent the event from being handled anywhere else
                setTimeout(() => {
                    store.dispatch(setFocusedComment(null));
                }, 1);
            }
        }
    });
}

export { default as APIClient } from './api';
