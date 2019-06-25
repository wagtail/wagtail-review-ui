import {
    Comment,
    CommentUpdate,
    CommentReply,
    CommentReplyUpdate,
    GlobalSettingsUpdate,
    ModerationStateUpdate
} from './state';

export const ADD_COMMENT = 'add-comment';
export const UPDATE_COMMENT = 'update-comment';
export const DELETE_COMMENT = 'delete-comment';
export const SET_FOCUSED_COMMENT = 'set-focused-comment';

export const ADD_REPLY = 'add-reply';
export const UPDATE_REPLY = 'update-reply';
export const DELETE_REPLY = 'delete-reply';

export const UPDATE_MODERATION_STATE = 'update-moderation-state';
export const UPDATE_GLOBAL_SETTINGS = 'update-global-settings';

export interface AddCommentAction {
    type: 'add-comment';
    comment: Comment;
}

export interface UpdateCommentAction {
    type: 'update-comment';
    commentId: number;
    update: CommentUpdate;
}

export interface DeleteCommentAction {
    type: 'delete-comment';
    commentId: number;
}

export interface SetFocusedCommentAction {
    type: 'set-focused-comment';
    commentId: number;
}

export interface AddReplyAction {
    type: 'add-reply';
    commentId: number;
    reply: CommentReply;
}

export interface UpdateReplyAction {
    type: 'update-reply';
    commentId: number;
    replyId: number;
    update: CommentReplyUpdate;
}

export interface DeleteReplyAction {
    type: 'delete-reply';
    commentId: number;
    replyId: number;
}

export interface UpdateModerationStateAction {
    type: 'update-moderation-state';
    update: ModerationStateUpdate;
}

export interface UpdateGlobalSettingsAction {
    type: 'update-global-settings';
    update: GlobalSettingsUpdate;
}

export type Action =
    | AddCommentAction
    | UpdateCommentAction
    | DeleteCommentAction
    | SetFocusedCommentAction
    | AddReplyAction
    | UpdateReplyAction
    | DeleteReplyAction
    | UpdateModerationStateAction
    | UpdateGlobalSettingsAction;

export function addComment(comment: Comment): AddCommentAction {
    return {
        type: ADD_COMMENT,
        comment
    };
}

export function updateComment(
    commentId: number,
    update: CommentUpdate
): UpdateCommentAction {
    return {
        type: UPDATE_COMMENT,
        commentId,
        update
    };
}

export function deleteComment(commentId: number): DeleteCommentAction {
    return {
        type: DELETE_COMMENT,
        commentId
    };
}

export function setFocusedComment(commentId: number): SetFocusedCommentAction {
    return {
        type: SET_FOCUSED_COMMENT,
        commentId
    };
}

export function addReply(
    commentId: number,
    reply: CommentReply
): AddReplyAction {
    return {
        type: ADD_REPLY,
        commentId,
        reply
    };
}

export function updateReply(
    commentId: number,
    replyId: number,
    update: CommentReplyUpdate
): UpdateReplyAction {
    return {
        type: UPDATE_REPLY,
        commentId,
        replyId,
        update
    };
}

export function deleteReply(
    commentId: number,
    replyId: number
): DeleteReplyAction {
    return {
        type: DELETE_REPLY,
        commentId,
        replyId
    };
}

export function updateModerationState(
    update: ModerationStateUpdate
): UpdateModerationStateAction {
    return {
        type: UPDATE_MODERATION_STATE,
        update
    };
}

export function updateGlobalSettings(
    update: GlobalSettingsUpdate
): UpdateGlobalSettingsAction {
    return {
        type: UPDATE_GLOBAL_SETTINGS,
        update
    };
}
