import * as React from 'react';

import APIClient from '../api';

import { Store } from '../state';
import {
    addComment,
    setFocusedComment,
    setPinnedComment,
    addReply
} from '../actions/comments';
import {
    Author,
    Comment,
    authorFromApi,
    NewCommentOptions,
    newComment,
    newCommentReply,
    NewReplyOptions
} from '../state/comments';
import { LayoutController } from '../utils/layout';
import { getNextCommentId } from './sequences';

import * as styles from '!css-to-string-loader!css-loader!sass-loader!./../main.scss';
import CommentComponent from '../components/Comment/index';

export function RenderCommentsForStorybook({
    store,
    author
}: {
    store: Store;
    author?: Author;
}) {
    let [state, setState] = React.useState(store.getState());
    store.subscribe(() => {
        setState(store.getState());
    });

    let layout = new LayoutController();
    const api = new APIClient('http://wagtail.io', 'dummy-review-token');

    if (!author) {
        author = authorFromApi({
            id: 1,
            name: 'Admin'
        });
    }

    let commentsToRender: Comment[] = Array.from(
        state.comments.comments.values()
    );

    let commentsRendered = commentsToRender.map(comment => (
        <CommentComponent
            key={comment.localId}
            store={store}
            api={api}
            layout={layout}
            user={author}
            comment={comment}
        />
    ));

    store.subscribe(() => {
        setState(store.getState());
    });

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css?family=Open+Sans&amp;display=swap"
                rel="stylesheet"
            />
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <ol className="comments-list">{commentsRendered}</ol>
        </>
    );
}

interface AddTestCommentOptions extends NewCommentOptions {
    focused?: boolean;
    author?: Author;
}

export function addTestComment(
    store: Store,
    options: AddTestCommentOptions
): number {
    let commentId = getNextCommentId();

    let author =
        options.author ||
        authorFromApi({
            id: 1,
            name: 'Admin'
        });

    // We must have a remoteId unless the comment is being created
    if (options.mode != 'creating' && options.remoteId == undefined) {
        options.remoteId = commentId;
    }

    // Comment must be focused if the mode is anything other than default
    if (options.mode != 'default' && options.focused === undefined) {
        options.focused = true;
    }

    store.dispatch(
        addComment(newComment(commentId, null, author, Date.now(), options))
    );

    if (options.focused) {
        store.dispatch(setFocusedComment(commentId));
        store.dispatch(setPinnedComment(commentId));
    }

    return commentId;
}

interface AddTestReplyOptions extends NewReplyOptions {
    focused?: boolean;
    author?: Author;
}

export function addTestReply(
    store: Store,
    commentId: number,
    options: AddTestReplyOptions
) {
    let author =
        options.author ||
        authorFromApi({
            id: 1,
            name: 'Admin'
        });

    if (!options.remoteId) {
        options.remoteId = 1;
    }

    store.dispatch(
        addReply(commentId, newCommentReply(1, author, Date.now(), options))
    );
}
