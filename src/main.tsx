import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createStore } from 'redux';
import root from 'react-shadow';

import APIClient from './api';
import { Annotation, AnnotatableSection } from './utils/annotation';
import { LayoutController } from './utils/layout';
import { getNextCommentId, getNextReplyId } from './utils/sequences';
import { Store, reducer } from './state';
import {
    Comment,
    authorFromApi,
    newCommentReply,
    newComment
} from './state/comments';
import { ModerationState } from './state/moderation';
import {
    addComment,
    addReply,
    setFocusedComment,
    updateComment,
    setPinnedComment
} from './actions/comments';
import CommentComponent from './components/Comment';
import TopBarComponent from './components/TopBar';
import ModerationBarComponent from './components/ModerationBar';

import * as styles from '!css-to-string-loader!css-loader!sass-loader!./main.scss';
import { updateGlobalSettings } from './actions/settings';

function renderCommentsUi(
    store: Store,
    api: APIClient,
    layout: LayoutController,
    comments: Comment[],
    moderationEnabled: boolean,
    moderationState: ModerationState
): React.ReactElement {
    let {
        commentsEnabled,
        showResolvedComments,
        user
    } = store.getState().settings;
    let commentsToRender = comments;

    if (!commentsEnabled || !user) {
        commentsToRender = [];
    } else if (!showResolvedComments) {
        // Hide all resolved comments unless they were resolved this session
        commentsToRender = commentsToRender.filter(comment => {
            return !(
                comment.resolvedAt !== null && !comment.resolvedThisSession
            );
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
        <root.div>
            <link
                href="https://fonts.googleapis.com/css?family=Open+Sans&amp;display=swap"
                rel="stylesheet"
            />
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <TopBarComponent store={store} />
            <ol className="comments-list">{commentsRendered}</ol>
            {moderationBar}
        </root.div>
    );
}

export function initCommentsApp(
    element: HTMLElement,
    api: APIClient,
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
    let pinnedComment: number | null = null;

    let store: Store = createStore(reducer);
    let layout = new LayoutController();

    api.fetchBase().then(data => {
        store.dispatch(
            updateGlobalSettings({
                user: authorFromApi(data.you)
            })
        );
    });

    // Check if there is "comment" query parameter.
    // If this is set, the user has clicked on a "View on frontend" link of an
    // individual comment. We should focus this comment and scroll to it
    let urlParams = new URLSearchParams(window.location.search);
    let initialFocusedCommentId: number | null = null;
    if (urlParams.has('comment')) {
        initialFocusedCommentId = parseInt(urlParams.get('comment'));
    }

    let render = () => {
        let state = store.getState();
        let commentList: Comment[] = Array.from(
            state.comments.comments.values()
        );

        // Check if the focused comment has changed
        if (state.comments.focusedComment != focusedComment) {
            // Unfocus previously focused annotation
            if (focusedComment) {
                // Note: the comment may have just been deleted. In that case,
                // don't worry about unfocusing the annotation as that will be
                // deleted
                if (state.comments.comments.has(focusedComment)) {
                    state.comments.comments
                        .get(focusedComment)
                        .annotation.onUnfocus();
                }
            }

            // Focus the new focused annotation
            if (state.comments.focusedComment) {
                state.comments.comments
                    .get(state.comments.focusedComment)
                    .annotation.onFocus();
            }

            focusedComment = state.comments.focusedComment;
        }

        // Check if the pinned comment has changed
        if (state.comments.pinnedComment != pinnedComment) {
            // Tell layout controller about the pinned comment
            // so it is moved alongside it's annotation
            layout.setPinnedComment(state.comments.pinnedComment);

            pinnedComment = state.comments.pinnedComment;
        }

        ReactDOM.render(
            renderCommentsUi(
                store,
                api,
                layout,
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

    let makeNewComment = (annotation: Annotation) => {
        let commentId = getNextCommentId();

        // Focus and pin comment when annotation is clicked
        annotation.setOnClickHandler(() => {
            store.dispatch(setFocusedComment(commentId));
            store.dispatch(setPinnedComment(commentId));
        });

        // Let layout engine know the annotation so it would position the comment correctly
        layout.setCommentAnnotation(commentId, annotation);

        // Create the comment
        store.dispatch(
            addComment(
                newComment(commentId, annotation, null, Date.now(), {
                    mode: 'creating'
                })
            )
        );

        // Focus and pin the comment
        store.dispatch(setFocusedComment(commentId));
        store.dispatch(setPinnedComment(commentId));
    };

    let selectionEnabled = () => {
        return store.getState().settings.commentsEnabled;
    };

    addAnnotatableSections((contentPath, element) => {
        annotatableSections[contentPath] = new AnnotatableSection(
            contentPath,
            element,
            makeNewComment,
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

            // Focus and pin comment when annotation is clicked
            annotation.setOnClickHandler(() => {
                store.dispatch(setFocusedComment(commentId));
                store.dispatch(setPinnedComment(commentId));
            });

            // Let layout engine know the annotation so it would position the comment correctly
            layout.setCommentAnnotation(commentId, annotation);

            // Create comment
            store.dispatch(
                addComment(
                    newComment(
                        commentId,
                        annotation,
                        authorFromApi(comment.author),
                        Date.parse(comment.created_at),
                        {
                            remoteId: comment.id,
                            resolvedAt: comment.resolved_at
                                ? Date.parse(comment.resolved_at)
                                : null,
                            text: comment.text
                        }
                    )
                )
            );

            // Create replies
            for (let reply of comment.replies) {
                store.dispatch(
                    addReply(
                        commentId,
                        newCommentReply(
                            getNextReplyId(),
                            authorFromApi(reply.author),
                            Date.parse(reply.created_at),
                            { remoteId: reply.id, text: reply.text }
                        )
                    )
                );
            }

            // If this is the initial focused comment. Focus and pin it
            // TODO: Scroll to this comment
            if (
                initialFocusedCommentId &&
                comment.id == initialFocusedCommentId
            ) {
                store.dispatch(setFocusedComment(commentId));
                store.dispatch(setPinnedComment(commentId));

                // HACK: If the comment is resolved. Set that comments "resolvedInThisSession" field so it displays
                if (comment.resolved_at !== null) {
                    store.dispatch(
                        updateComment(commentId, { resolvedThisSession: true })
                    );
                }
            }
        }
    });

    // Unfocus when document body is clicked
    document.body.addEventListener('click', e => {
        if (e.target instanceof HTMLElement) {
            // ignore if click target is a comment or a highlight
            if (
                !e.target.closest('#comments, .annotator-hl, .annotator-adder')
            ) {
                // Running store.dispatch directly here seems to prevent the event from being handled anywhere else
                setTimeout(() => {
                    store.dispatch(setFocusedComment(null));
                    store.dispatch(setPinnedComment(null));
                }, 1);
            }
        }
    });
}

export { default as APIClient } from './api';
