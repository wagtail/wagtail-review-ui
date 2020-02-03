import * as actions from '../actions/moderation';

type Partial<T> = {
    [P in keyof T]?: T[P];
};

export type ModerationTaskAction = 'approve' | 'reject' | null;
export type ModerationErrorCode =
    | 'action-required'
    | 'comment-required'
    | 'comment-too-long'
    | null;
export type ModerationSubmitStage =
    | 'not-submitted'
    | 'submitting'
    | 'errored'
    | 'submitted';

export interface ModerationState {
    actionBoxOpen: boolean;
    taskAction: ModerationTaskAction;
    comment: string;
    errors: Set<ModerationErrorCode>;
    submitStage: ModerationSubmitStage;
}

export type ModerationStateUpdate = Partial<ModerationState>;

function initialState(): ModerationState {
    return {
        actionBoxOpen: false,
        taskAction: null,
        comment: '',
        errors: new Set(),
        submitStage: 'not-submitted'
    };
}

function update<T>(base: T, update: Partial<T>): T {
    return Object.assign({}, base, update);
}

export function reducer(
    state: ModerationState | undefined,
    action: actions.Action
) {
    if (typeof state === 'undefined') {
        state = initialState();
    }

    switch (action.type) {
        case actions.UPDATE_MODERATION_STATE:
            state = update(state, action.update);
            break;

        case actions.SET_ERRORS:
            state = update(state, { errors: action.errors });
            break;

        case actions.CLEAR_ERROR:
            if (this.props.errors.has(action.error)) {
                const errors = new Set(state.errors);
                errors.delete(action.error);
                state = update(state, { errors });
            }
            break;
    }

    return state;
}
