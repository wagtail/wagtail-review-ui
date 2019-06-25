import * as React from 'react';

import { Store } from '../../state';
import { updateGlobalSettings } from '../../actions';

import './style.scss';

export interface TopBarProps {
    store: Store;
}

export default class TopBarComponent extends React.Component<TopBarProps> {
    render() {
        let { store } = this.props;

        let onChangeCommentsEnabled = (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {
            store.dispatch(
                updateGlobalSettings({
                    commentsEnabled: e.target.checked
                })
            );
        };

        let onChangeShowResolvedComments = (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {
            store.dispatch(
                updateGlobalSettings({
                    showResolvedComments: e.target.checked
                })
            );
        };

        let {
            commentsEnabled,
            showResolvedComments
        } = store.getState().settings;

        return (
            <div className="comments-topbar">
                Comments enabled{' '}
                <input
                    type="checkbox"
                    onChange={onChangeCommentsEnabled}
                    checked={commentsEnabled}
                />
                Show resolved comments{' '}
                <input
                    type="checkbox"
                    onChange={onChangeShowResolvedComments}
                    checked={showResolvedComments}
                />
            </div>
        );
    }
}
