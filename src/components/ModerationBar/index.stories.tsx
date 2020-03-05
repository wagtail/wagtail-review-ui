import * as React from 'react';
import { createStore } from 'redux';

import { Store, reducer } from '../../state';
import { Styling } from '../../utils/storybook';
import APIClient from '../../api';

import ModerationBar from './index';

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
