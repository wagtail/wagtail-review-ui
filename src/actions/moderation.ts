import {
    ModerationStateUpdate, ModerationErrorCode
} from '../state/moderation';

export const UPDATE_MODERATION_STATE = 'update-moderation-state';
export const SET_ERRORS = 'set-errors';
export const CLEAR_ERROR = 'clear-error';

export interface UpdateModerationStateAction {
    type: typeof UPDATE_MODERATION_STATE;
    update: ModerationStateUpdate;
}

export interface SetErrorsAction {
    type: typeof SET_ERRORS;
    errors: Set<ModerationErrorCode>;
}

export interface ClearErrorAction {
    type: typeof CLEAR_ERROR;
    error: ModerationErrorCode;
}

export type Action = UpdateModerationStateAction | SetErrorsAction | ClearErrorAction;

export function updateModerationState(
    update: ModerationStateUpdate
): UpdateModerationStateAction {
    return {
        type: UPDATE_MODERATION_STATE,
        update
    };
}

export function setErrors(
    errors: Set<ModerationErrorCode>,
): SetErrorsAction {
    return {
        type: SET_ERRORS,
        errors,
    }
}

export function clearError(
    error: ModerationErrorCode,
): ClearErrorAction {
    return {
        type: CLEAR_ERROR,
        error,
    }
}
