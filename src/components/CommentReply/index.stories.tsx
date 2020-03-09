import * as React from 'react';
import { createStore } from 'redux';

import { Store, reducer, Context } from '../../state';
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

    return (
        <Context.Provider value={{store, storeState: store.getState()}}>
            <RenderCommentsForStorybook/>
        </Context.Provider>
    );
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

    return (
        <Context.Provider value={{store, storeState: store.getState()}}>
            <RenderCommentsForStorybook/>
        </Context.Provider>
    );
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

    return (
        <Context.Provider value={{store, storeState: store.getState()}}>
            <RenderCommentsForStorybook/>
        </Context.Provider>
    );
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

    return (
        <Context.Provider value={{store, storeState: store.getState()}}>
            <RenderCommentsForStorybook/>
        </Context.Provider>
    );
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
    return (
        <Context.Provider value={{store, storeState: store.getState()}}>
            <RenderCommentsForStorybook/>
        </Context.Provider>
    );
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

    return (
        <Context.Provider value={{store, storeState: store.getState()}}>
            <RenderCommentsForStorybook/>
        </Context.Provider>
    );
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

    return (
        <Context.Provider value={{store, storeState: store.getState()}}>
            <RenderCommentsForStorybook/>
        </Context.Provider>
    );
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

    return (
        <Context.Provider value={{store, storeState: store.getState()}}>
            <RenderCommentsForStorybook/>
        </Context.Provider>
    );
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

    return (
        <Context.Provider value={{store, storeState: store.getState()}}>
            <RenderCommentsForStorybook/>
        </Context.Provider>
    );
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

    return (
        <Context.Provider value={{store, storeState: store.getState()}}>
            <RenderCommentsForStorybook/>
        </Context.Provider>
    );
}
