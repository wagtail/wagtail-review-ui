import * as React from 'react';
import { createStore } from 'redux';

import { Store, reducer } from '../../state';
import { authorFromApi } from '../../state/comments';

import {
    RenderCommentsForStorybook,
    addTestComment
} from '../../utils/storybook';

export default { title: 'Comment' };

export function addNewComment() {
    let store: Store = createStore(reducer);

    addTestComment(store, {
        mode: 'creating',
        focused: true
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function comment() {
    let store: Store = createStore(reducer);

    addTestComment(store, {
        mode: 'default',
        text: 'An example comment'
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function commentFromSomeoneElse() {
    let store: Store = createStore(reducer);

    addTestComment(store, {
        mode: 'default',
        text: 'An example comment',
        author: authorFromApi({
            id: 2,
            name: 'Someone else'
        })
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function focused() {
    let store: Store = createStore(reducer);

    addTestComment(store, {
        mode: 'default',
        text: 'An example comment',
        focused: true
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function resolved() {
    let store: Store = createStore(reducer);

    addTestComment(store, {
        mode: 'default',
        text: 'An example comment',
        resolvedAt: Date.now()
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function saving() {
    let store: Store = createStore(reducer);

    addTestComment(store, {
        mode: 'saving',
        text: 'An example comment'
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function saveError() {
    let store: Store = createStore(reducer);

    addTestComment(store, {
        mode: 'save_error',
        text: 'An example comment'
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function deleteConfirm() {
    let store: Store = createStore(reducer);

    addTestComment(store, {
        mode: 'delete_confirm',
        text: 'An example comment'
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function deleting() {
    let store: Store = createStore(reducer);

    addTestComment(store, {
        mode: 'deleting',
        text: 'An example comment'
    });

    return <RenderCommentsForStorybook store={store} />;
}

export function deleteError() {
    let store: Store = createStore(reducer);
    addTestComment(store, {
        mode: 'delete_error',
        text: 'An example comment'
    });

    return <RenderCommentsForStorybook store={store} />;
}
