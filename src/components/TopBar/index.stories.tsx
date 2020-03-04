import * as React from 'react';
import { createStore } from 'redux';

import { Store, reducer } from '../../state';
import { Styling } from '../../utils/storybook';

import TopBarComponent from './index';

export default { title: 'TopBar' };

export function topbar() {
    let store: Store = createStore(reducer);

    return (
        <>
            <Styling />
            <TopBarComponent store={store} />
        </>
    );
}
