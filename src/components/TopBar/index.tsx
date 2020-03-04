import * as React from 'react';

import { Store } from '../../state';
import { updateGlobalSettings } from '../../actions/settings';

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
                <ul className="comments-topbar__settings">
                    <li>
                        <input
                            id="show-comments"
                            type="checkbox"
                            onChange={onChangeCommentsEnabled}
                            checked={commentsEnabled}
                        />
                        <label htmlFor="show-comments">Show Comments</label>
                    </li>
                    <li>
                        <input
                            id="show-resolved-comments"
                            type="checkbox"
                            onChange={onChangeShowResolvedComments}
                            checked={showResolvedComments}
                        />
                        <label htmlFor="show-resolved-comments">
                            Show resolved Comments
                        </label>
                    </li>
                </ul>
            </div>
        );
    }
}
