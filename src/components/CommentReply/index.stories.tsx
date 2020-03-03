import * as React from 'react';
import { createStore } from 'redux';

import { Store, reducer } from '../../state';
import { authorFromApi } from '../../state/comments';

import {
    RenderCommentsForStorybook,
    addTestComment,
    addTestReply
} from '../../utils/storybook';

export default { title: 'CommentReply' };

export function reply() {
    let store: Store = createStore(reducer);

    const commentId = addTestComment(store, {
        mode: 'default',
        text: 'An example comment'
    });

    addTestReply(store, commentId, {
        mode: 'default',
        text: 'An example reply'
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function replyFromSomeoneElse() {
    let store: Store = createStore(reducer);

    const commentId = addTestComment(store, {
        mode: 'default',
        text: 'An example comment'
    });

    addTestReply(store, commentId, {
        mode: 'default',
        text: 'An example reply',
        author: authorFromApi({
            id: 2,
            name: 'Someone else'
        })
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function focused() {
    let store: Store = createStore(reducer);

    const commentId = addTestComment(store, {
        mode: 'default',
        text: 'An example comment',
        focused: true
    });

    addTestReply(store, commentId, {
        mode: 'default',
        text: 'An example reply'
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function editing() {
    let store: Store = createStore(reducer);

    const commentId = addTestComment(store, {
        mode: 'default',
        text: 'An example comment',
        focused: true
    });

    addTestReply(store, commentId, {
        mode: 'editing',
        text: 'An example reply'
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function saving() {
    let store: Store = createStore(reducer);

    const commentId = addTestComment(store, {
        mode: 'default',
        text: 'An example comment',
        focused: true
    });

    addTestReply(store, commentId, {
        mode: 'saving',
        text: 'An example reply'
    });
    return <RenderCommentsForStorybook store={store} />;
}

export function saveError() {
    let store: Store = createStore(reducer);

    const commentId = addTestComment(store, {
        mode: 'default',
        text: 'An example comment',
        focused: true
    });

    addTestReply(store, commentId, {
        mode: 'save_error',
        text: 'An example reply'
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function deleteConfirm() {
    let store: Store = createStore(reducer);

    const commentId = addTestComment(store, {
        mode: 'default',
        text: 'An example comment',
        focused: true
    });

    addTestReply(store, commentId, {
        mode: 'delete_confirm',
        text: 'An example reply'
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function deleting() {
    let store: Store = createStore(reducer);

    const commentId = addTestComment(store, {
        mode: 'default',
        text: 'An example comment',
        focused: true
    });

    addTestReply(store, commentId, {
        mode: 'deleting',
        text: 'An example reply'
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function deleteError() {
    let store: Store = createStore(reducer);

    const commentId = addTestComment(store, {
        mode: 'default',
        text: 'An example comment',
        focused: true
    });

    addTestReply(store, commentId, {
        mode: 'delete_error',
        text: 'An example reply'
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function deleted() {
    let store: Store = createStore(reducer);

    const commentId = addTestComment(store, {
        mode: 'default',
        text: 'An example comment',
        focused: true
    });

    addTestReply(store, commentId, {
        mode: 'deleted',
        text: 'An example reply'
    });

    return <RenderCommentsForStorybook store={store} />;
}
