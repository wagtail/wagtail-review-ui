import * as React from 'react';
import { createStore } from 'redux';

import { Store, reducer, Context } from '../../state';
import { Styling } from '../../utils/storybook';
import APIClient from '../../api';

import ModerationBar from './index';

export default { title: 'ModerationBar' };

function RenderModerationBarForStorybok() {
    let {store, storeState} = React.useContext(Context);

    const api = new APIClient('http://wagtail.io', 'dummy-review-token');

    return (
        <>
            <Styling />
            <ModerationBar store={store} api={api} {...storeState.moderation} />
        </>
    );
}

export function moderationBar() {
    let store: Store = createStore(reducer);

    return (
        <Context.Provider value={{store, storeState: store.getState()}}>
            <RenderModerationBarForStorybok/>
        </Context.Provider>
    );
}
