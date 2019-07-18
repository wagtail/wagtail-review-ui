import { combineReducers, Store } from "redux";

import {reducer as commentsReducer, CommentsState} from './comments';
import {reducer as moderationReducer, ModerationState} from './moderation';
import {reducer as settingsReducer, SettingsState} from './settings';
import { Action } from "../actions";

export interface State {
    comments: CommentsState,
    moderation: ModerationState,
    settings: SettingsState,
}

export let reducer = combineReducers({
    comments: commentsReducer,
    moderation: moderationReducer,
    settings: settingsReducer,
})

export type Store = Store<State, Action>;
