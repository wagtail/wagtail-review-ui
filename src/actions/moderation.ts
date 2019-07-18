import {
    ModerationStateUpdate
} from '../state/moderation';

export const UPDATE_MODERATION_STATE = 'update-moderation-state';

export interface UpdateModerationStateAction {
    type: typeof UPDATE_MODERATION_STATE;
    update: ModerationStateUpdate;
}

export type Action = UpdateModerationStateAction;

export function updateModerationState(
    update: ModerationStateUpdate
): UpdateModerationStateAction {
    return {
        type: UPDATE_MODERATION_STATE,
        update
    };
}
