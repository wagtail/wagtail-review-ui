import { Action as CommentsAction } from './comments';
import { Action as ModerationAction } from './moderation';
import { Action as SettingsActon } from './settings';

export type Action = CommentsAction | ModerationAction | SettingsActon;
