import * as React from 'react';
import { createStore } from 'redux';

import { Store, reducer } from '../../state';
import { Styling } from '../../utils/storybook';
import APIClient from '../../api';
import { setErrors, updateModerationState } from '../../actions/moderation';

import ModerationBar from './index';
import { ModerationErrorCode } from '../../state/moderation';

export default { title: 'ModerationBar' };

function RenderModerationBarForStorybok({ store }: { store: Store }) {
    let [state, setState] = React.useState(store.getState());
    store.subscribe(() => {
        setState(store.getState());
    });

    const api = new APIClient('http://wagtail.io', 'dummy-review-token');

    return (
        <>
            <Styling />
            <ModerationBar store={store} api={api} {...state.moderation} />
        </>
    );
}

export function moderationBar() {
    let store: Store = createStore(reducer);

    return <RenderModerationBarForStorybok store={store} />;
}

export function missingValueErrors() {
    let store: Store = createStore(reducer);

    store.dispatch(
        updateModerationState({
            actionBoxOpen: true
        })
    );

    const errors: Set<ModerationErrorCode> = new Set();
    errors.add('action-required');
    errors.add('comment-required');
    store.dispatch(
        setErrors(errors)
    );

    return <RenderModerationBarForStorybok store={store} />;
}

export function tooLongCommentError() {
    let store: Store = createStore(reducer);

    store.dispatch(
        updateModerationState({
            actionBoxOpen: true
        })
    );

    const errors: Set<ModerationErrorCode> = new Set();
    errors.add('comment-too-long');
    store.dispatch(
        setErrors(errors)
    );

    return <RenderModerationBarForStorybok store={store} />;
}

export function reviewSubmitting() {
    let store: Store = createStore(reducer);

    store.dispatch(
        updateModerationState({
            actionBoxOpen: true,
            submitStage: "submitting"
        })
    );

    return <RenderModerationBarForStorybok store={store} />;
}

export function reviewSubmitError() {
    let store: Store = createStore(reducer);

    store.dispatch(
        updateModerationState({
            actionBoxOpen: true,
            submitStage: "errored"
        })
    );

    return <RenderModerationBarForStorybok store={store} />;
}

export function reviewSubmitted() {
    let store: Store = createStore(reducer);

    store.dispatch(
        updateModerationState({
            actionBoxOpen: true,
            submitStage: "submitted"
        })
    );

    return <RenderModerationBarForStorybok store={store} />;
}
