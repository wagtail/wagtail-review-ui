import { Annotation } from '../utils/annotation';
import * as actions from '../actions/comments';
import { CommentApi, CommentReplyApi, ReviewerApi } from '../api';

type Partial<T> = {
    [P in keyof T]?: T[P];
};

export class Author {
    id: number;
    name: string;

    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }

    isSameAs(other: Author): boolean {
        return this.id == other.id;
    }

    static unknown(): Author {
        return new Author(0, 'Unknown');
    }

    static fromApi(data: ReviewerApi): Author {
        return new Author(data.id, data.name);
    }
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

export class CommentReply {
    localId: number;
    remoteId: number | null;
    mode: CommentReplyMode;
    author: Author | null;
    date: number;
    text: string;
    editPreviousText: string;

    constructor(
        localId: number,
        author: Author | null,
        date: number,
        {
            remoteId = <number | null>null,
            mode = <CommentReplyMode>'default',
            text = ''
        }
    ) {
        this.localId = localId;
        this.remoteId = remoteId;
        this.mode = mode;
        this.author = author;
        this.date = date;
        this.text = text;
        this.editPreviousText = '';
    }

    static fromApi(localId: number, data: CommentReplyApi): CommentReply {
        return new CommentReply(
            localId,
            Author.fromApi(data.author),
            Date.parse(data.created_at),
            { remoteId: data.id, text: data.text }
        );
    }
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

export class Comment {
    localId: number;
    annotation: Annotation;
    remoteId: number | null;
    mode: CommentMode;
    resolvedAt: number | null;
    author: Author | null;
    date: number;
    text: string;
    replies: { [replyId: number]: CommentReply };
    newReply: string;
    editPreviousText: string = '';
    isFocused: boolean = false;
    updatingResolvedStatus: boolean = false;
    resolvedThisSession: boolean = false;

    constructor(
        localId: number,
        annotation: Annotation,
        author: Author | null,
        date: number,
        {
            remoteId = <number | null>null,
            mode = <CommentMode>'default',
            resolvedAt = <number | null>null,
            text = '',
            replies = {},
            newReply = ''
        }
    ) {
        this.localId = localId;
        this.annotation = annotation;
        this.remoteId = remoteId;
        this.mode = mode;
        this.resolvedAt = resolvedAt;
        this.author = author;
        this.date = date;
        this.text = text;
        this.replies = replies;
        this.newReply = newReply;
    }

    static makeNew(
        localId: number,
        annotation: Annotation,
        author: Author | null
    ): Comment {
        return new Comment(localId, annotation, author, Date.now(), {
            mode: 'creating'
        });
    }

    static fromApi(
        localId: number,
        annotation: Annotation,
        data: CommentApi
    ): Comment {
        return new Comment(
            localId,
            annotation,
            Author.fromApi(data.author),
            Date.parse(data.created_at),
            {
                remoteId: data.id,
                resolvedAt: data.resolved_at
                    ? Date.parse(data.resolved_at)
                    : null,
                text: data.text
            }
        );
    }
}

export type CommentUpdate = Partial<Comment>;

export interface CommentsState {
    comments: { [commentId: number]: Comment };
    focusedComment: number | null;
    pinnedComment: number | null;
}

function initialState(): CommentsState {
    return {
        comments: {},
        focusedComment: null,
        pinnedComment: null,
    };
}

function update<T>(base: T, update: Partial<T>): T {
    return Object.assign({}, base, update);
}

function cloneComments(state: CommentsState): CommentsState {
    // Returns a new state with the comments list cloned
    return update(state, { comments: update(state.comments, {}) });
}

function cloneReplies(comment: Comment): Comment {
    // Returns a new comment with the replies list cloned
    return update(comment, { replies: update(comment.replies, {}) });
}

export function reducer(state: CommentsState | undefined, action: actions.Action) {
    if (typeof state === 'undefined') {
        state = initialState();
    }

    switch (action.type) {
        case actions.ADD_COMMENT:
            state = cloneComments(state);
            state.comments[action.comment.localId] = action.comment;
            break;

        case actions.UPDATE_COMMENT:
            if (!(action.commentId in state.comments)) {
                break;
            }
            state = cloneComments(state);
            state.comments[action.commentId] = update(
                state.comments[action.commentId],
                action.update
            );
            break;

        case actions.DELETE_COMMENT:
            if (!(action.commentId in state.comments)) {
                break;
            }
            state = cloneComments(state);
            delete state.comments[action.commentId];

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
                state.comments[state.focusedComment] = update(
                    state.comments[state.focusedComment],
                    {
                        isFocused: false
                    }
                );

                state.focusedComment = null;
            }

            // Set isFocused on focused comment
            if (action.commentId && action.commentId in state.comments) {
                state.comments[action.commentId] = update(
                    state.comments[action.commentId],
                    {
                        isFocused: true
                    }
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
            if (!(action.commentId in state.comments)) {
                break;
            }
            state = cloneComments(state);
            state.comments[action.commentId] = cloneReplies(
                state.comments[action.commentId]
            );
            state.comments[action.commentId].replies[action.reply.localId] =
                action.reply;
            break;

        case actions.UPDATE_REPLY:
            if (!(action.commentId in state.comments)) {
                break;
            }
            if (!(action.replyId in state.comments[action.commentId].replies)) {
                break;
            }
            state = cloneComments(state);
            state.comments[action.commentId] = cloneReplies(
                state.comments[action.commentId]
            );
            state.comments[action.commentId].replies[action.replyId] = update(
                state.comments[action.commentId].replies[action.replyId],
                action.update
            );
            break;

        case actions.DELETE_REPLY:
            if (!(action.commentId in state.comments)) {
                break;
            }
            if (!(action.replyId in state.comments[action.commentId].replies)) {
                break;
            }
            state = cloneComments(state);
            state.comments[action.commentId] = cloneReplies(
                state.comments[action.commentId]
            );
            delete state.comments[action.commentId].replies[action.replyId];
            break;

    }

    return state;
}
