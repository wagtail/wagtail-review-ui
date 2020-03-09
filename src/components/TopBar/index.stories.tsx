import * as React from 'react';
import { createStore } from 'redux';

import { Store, reducer } from '../../state';
import { Styling } from '../../utils/storybook';

import TopBarComponent from './index';

export default { title: 'TopBar' };

function RenderTopBarForStorybok({ store }: { store: Store }) {
    let [state, setState] = React.useState(store.getState());
    store.subscribe(() => {
        setState(store.getState());
    });

    return (
        <>
            <Styling />
            <TopBarComponent store={store} {...state.settings} />
        </>
    );
}

export function topBar() {
    let store: Store = createStore(reducer);

    return <RenderTopBarForStorybok store={store} />;
}
