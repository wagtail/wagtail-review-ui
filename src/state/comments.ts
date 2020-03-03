import { Annotation } from '../utils/annotation';
import * as actions from '../actions/comments';
import { ReviewerApi as AuthorApi } from '../api';

type Partial<T> = {
    [P in keyof T]?: T[P];
};

export interface Author {
    id: number;
    name: string;
}

export function authorFromApi(data: AuthorApi): Author {
    return {
        id: data.id,
        name: data.name
    };
}

export type CommentReplyMode =
    | 'default'
    | 'editing'
    | 'saving'
    | 'delete_confirm'
    | 'deleting'
    | 'deleted'
    | 'save_error'
    | 'delete_error';

export interface CommentReply {
    localId: number;
    remoteId: number | null;
    mode: CommentReplyMode;
    author: Author | null;
    date: number;
    text: string;
    editPreviousText: string;
}

export interface NewReplyOptions {
    remoteId?: number | null;
    mode?: CommentReplyMode;
    text?: string;
}

export function newCommentReply(
    localId: number,
    author: Author | null,
    date: number,
    {
        remoteId = <number | null>null,
        mode = <CommentReplyMode>'default',
        text = ''
    }: NewReplyOptions
): CommentReply {
    return {
        localId,
        remoteId,
        mode,
        author,
        date,
        text,
        editPreviousText: ''
    };
}

export type CommentReplyUpdate = Partial<CommentReply>;

export type CommentMode =
    | 'default'
    | 'creating'
    | 'editing'
    | 'saving'
    | 'delete_confirm'
    | 'deleting'
    | 'deleted'
    | 'save_error'
    | 'delete_error';

export interface Comment {
    localId: number;
    annotation: Annotation | null;
    remoteId: number | null;
    mode: CommentMode;
    resolvedAt: number | null;
    author: Author | null;
    date: number;
    text: string;
    replies: Map<number, CommentReply>;
    newReply: string;
    editPreviousText: string;
    isFocused: boolean;
    updatingResolvedStatus: boolean;
    resolvedThisSession: boolean;
}

export interface NewCommentOptions {
    remoteId?: number | null;
    mode?: CommentMode;
    resolvedAt?: number | null;
    text?: string;
    replies?: Map<number, CommentReply>;
}

export function newComment(
    localId: number,
    annotation: Annotation | null,
    author: Author | null,
    date: number,
    {
        remoteId = <number | null>null,
        mode = <CommentMode>'default',
        resolvedAt = <number | null>null,
        text = '',
        replies = <Map<number, CommentReply>>new Map()
    }: NewCommentOptions
): Comment {
    return {
        localId,
        annotation,
        remoteId,
        mode,
        resolvedAt,
        author,
        date,
        text,
        replies,
        newReply: '',
        editPreviousText: '',
        isFocused: false,
        updatingResolvedStatus: false,
        resolvedThisSession: false
    };
}

export type CommentUpdate = Partial<Comment>;

export interface CommentsState {
    comments: Map<number, Comment>;
    focusedComment: number | null;
    pinnedComment: number | null;
}

function initialState(): CommentsState {
    return {
        comments: new Map(),
        focusedComment: null,
        pinnedComment: null
    };
}

function update<T>(base: T, update: Partial<T>): T {
    return Object.assign({}, base, update);
}

function cloneComments(state: CommentsState): CommentsState {
    // Returns a new state with the comments list cloned
    return update(state, { comments: new Map(state.comments.entries()) });
}

function cloneReplies(comment: Comment): Comment {
    // Returns a new comment with the replies list cloned
    return update(comment, { replies: new Map(comment.replies.entries()) });
}

export function reducer(
    state: CommentsState | undefined,
    action: actions.Action
) {
    if (typeof state === 'undefined') {
        state = initialState();
    }

    switch (action.type) {
        case actions.ADD_COMMENT:
            state = cloneComments(state);
            state.comments.set(action.comment.localId, action.comment);
            break;

        case actions.UPDATE_COMMENT:
            if (!state.comments.has(action.commentId)) {
                break;
            }
            state = cloneComments(state);
            state.comments.set(
                action.commentId,
                update(state.comments.get(action.commentId), action.update)
            );

            break;

        case actions.DELETE_COMMENT:
            if (!state.comments.has(action.commentId)) {
                break;
            }
            state = cloneComments(state);
            state.comments.delete(action.commentId);

            // Unset focusedComment if the focused comment is the one being deleted
            if (state.focusedComment == action.commentId) {
                state.focusedComment = null;
            }
            break;

        case actions.SET_FOCUSED_COMMENT:
            state = cloneComments(state);

            // Unset isFocused on previous focused comment
            if (state.focusedComment) {
                // Unset isFocused on previous focused comment
                state.comments.set(
                    state.focusedComment,
                    update(state.comments.get(state.focusedComment), {
                        isFocused: false
                    })
                );

                state.focusedComment = null;
            }

            // Set isFocused on focused comment
            if (action.commentId && state.comments.has(action.commentId)) {
                state.comments.set(
                    action.commentId,
                    update(state.comments.get(action.commentId), {
                        isFocused: true
                    })
                );

                state.focusedComment = action.commentId;
            }
            break;

        case actions.SET_PINNED_COMMENT:
            state = update(state, {
                pinnedComment: action.commentId
            });
            break;

        case actions.ADD_REPLY:
            if (!state.comments.has(action.commentId)) {
                break;
            }
            state = cloneComments(state);
            state.comments.set(
                action.commentId,
                cloneReplies(state.comments.get(action.commentId))
            );
            state.comments
                .get(action.commentId)
                .replies.set(action.reply.localId, action.reply);
            break;

        case actions.UPDATE_REPLY:
            if (!state.comments.has(action.commentId)) {
                break;
            }
            if (
                !state.comments
                    .get(action.commentId)
                    .replies.has(action.replyId)
            ) {
                break;
            }
            state = cloneComments(state);
            state.comments.set(
                action.commentId,
                cloneReplies(state.comments.get(action.commentId))
            );
            state.comments
                .get(action.commentId)
                .replies.set(
                    action.replyId,
                    update(
                        state.comments
                            .get(action.commentId)
                            .replies.get(action.replyId),
                        action.update
                    )
                );
            break;

        case actions.DELETE_REPLY:
            if (!state.comments.has(action.commentId)) {
                break;
            }
            if (
                !state.comments
                    .get(action.commentId)
                    .replies.has(action.replyId)
            ) {
                break;
            }
            state = cloneComments(state);
            state.comments.set(
                action.commentId,
                cloneReplies(state.comments.get(action.commentId))
            );
            state.comments.get(action.commentId).replies.delete(action.replyId);
            break;
    }

    return state;
}
