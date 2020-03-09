import * as React from 'react';
import * as dateFormat from 'dateformat';

import { Store } from '../../state';
import {
    Comment,
    CommentReply,
    Author,
    authorFromApi
} from '../../state/comments';
import APIClient from '../../api';
import { updateReply, deleteReply } from '../../actions/comments';

export async function saveCommentReply(
    comment: Comment,
    reply: CommentReply,
    store: Store,
    api: APIClient
) {
    store.dispatch(
        updateReply(comment.localId, reply.localId, {
            mode: 'saving'
        })
    );

    try {
        let replyData = await api.saveCommentReply(comment, reply);

        store.dispatch(
            updateReply(comment.localId, reply.localId, {
                mode: 'default',
                remoteId: replyData.id,
                author: authorFromApi(replyData.author),
                date: Date.parse(replyData.created_at)
            })
        );
    } catch (err) {
        console.error(err);
        store.dispatch(
            updateReply(comment.localId, reply.localId, {
                mode: 'save_error'
            })
        );
    }
}

async function deleteCommentReply(
    comment: Comment,
    reply: CommentReply,
    store: Store,
    api: APIClient
) {
    store.dispatch(
        updateReply(comment.localId, reply.localId, {
            mode: 'deleting'
        })
    );

    try {
        await api.deleteCommentReply(comment, reply);

        store.dispatch(deleteReply(comment.localId, reply.localId));
    } catch (err) {
        store.dispatch(
            updateReply(comment.localId, reply.localId, {
                mode: 'delete_error'
            })
        );
    }
}

export interface CommentReplyProps {
    comment: Comment;
    reply: CommentReply;
    store: Store;
    api: APIClient;
    user: Author;
}

export default class CommentReplyComponent extends React.Component<
    CommentReplyProps
> {
    renderAuthorDate(): React.ReactFragment {
        let { reply } = this.props;

        let author = reply.author ? reply.author.name + ' -' : '';

        return (
            <p className="comment-reply__author-date">
                {author} {dateFormat(reply.date, 'h:MM mmmm d')}
            </p>
        );
    }

    renderEditing(): React.ReactFragment {
        let { comment, reply, store, api } = this.props;

        let onChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            e.preventDefault();

            store.dispatch(
                updateReply(comment.localId, reply.localId, {
                    text: e.target.value
                })
            );
        };

        let onSave = async (e: React.MouseEvent) => {
            e.preventDefault();
            await saveCommentReply(comment, reply, store, api);
        };

        let onCancel = (e: React.MouseEvent) => {
            e.preventDefault();

            store.dispatch(
                updateReply(comment.localId, reply.localId, {
                    mode: 'default',
                    text: reply.editPreviousText
                })
            );
        };

        return (
            <>
                <textarea
                    className="comment-reply__input"
                    value={reply.text}
                    onChange={onChangeText}
                    style={{ resize: 'none' }}
                />
                <div className="comment-reply__actions">
                    <button
                        className="comment-reply__button comment-reply__button--primary"
                        onClick={onSave}
                    >
                        Save
                    </button>
                    <button
                        className="comment-reply__button"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </>
        );
    }

    renderSaving(): React.ReactFragment {
        let { reply } = this.props;

        return (
            <>
                <p className="comment-reply__text">{reply.text}</p>
                {this.renderAuthorDate()}
                <div className="comment-reply__progress">Saving...</div>
            </>
        );
    }

    renderSaveError(): React.ReactFragment {
        let { comment, reply, store, api } = this.props;

        let onClickRetry = async (e: React.MouseEvent) => {
            e.preventDefault();

            await saveCommentReply(comment, reply, store, api);
        };

        return (
            <>
                <p className="comment-reply__text">{reply.text}</p>
                {this.renderAuthorDate()}
                <div className="comment-reply__error">
                    Save error
                    <button
                        className="comment-reply__button"
                        onClick={onClickRetry}
                    >
                        Retry
                    </button>
                </div>
            </>
        );
    }

    renderDeleteConfirm(): React.ReactFragment {
        let { comment, reply, store, api } = this.props;

        let onClickDelete = async (e: React.MouseEvent) => {
            e.preventDefault();

            await deleteCommentReply(comment, reply, store, api);
        };

        let onClickCancel = (e: React.MouseEvent) => {
            e.preventDefault();

            store.dispatch(
                updateReply(comment.localId, reply.localId, {
                    mode: 'default'
                })
            );
        };

        return (
            <>
                <p className="comment-reply__text">{reply.text}</p>
                {this.renderAuthorDate()}
                <div className="comment-reply__confirm-delete">
                    Are you sure?
                    <button
                        className="comment-reply__button comment-reply__button--red"
                        onClick={onClickDelete}
                    >
                        Delete
                    </button>
                    <button
                        className="comment-reply__button"
                        onClick={onClickCancel}
                    >
                        Cancel
                    </button>
                </div>
            </>
        );
    }

    renderDeleting(): React.ReactFragment {
        let { reply } = this.props;

        return (
            <>
                <p className="comment-reply__text">{reply.text}</p>
                {this.renderAuthorDate()}
                <div className="comment-reply__progress">Deleting...</div>
            </>
        );
    }

    renderDeleteError(): React.ReactFragment {
        let { comment, reply, store, api } = this.props;

        let onClickRetry = async (e: React.MouseEvent) => {
            e.preventDefault();

            await deleteCommentReply(comment, reply, store, api);
        };

        let onClickCancel = async (e: React.MouseEvent) => {
            e.preventDefault();

            store.dispatch(
                updateReply(comment.localId, reply.localId, {
                    mode: 'default'
                })
            );
        };

        return (
            <>
                <p className="comment-reply__text">{reply.text}</p>
                {this.renderAuthorDate()}
                <div className="comment-reply__error">
                    Delete error
                    <button
                        className="comment-reply__button"
                        onClick={onClickCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="comment-reply__button"
                        onClick={onClickRetry}
                    >
                        Retry
                    </button>
                </div>
            </>
        );
    }

    renderDefault(): React.ReactFragment {
        let { comment, reply, store } = this.props;

        let onClickEdit = async (e: React.MouseEvent) => {
            e.preventDefault();

            store.dispatch(
                updateReply(comment.localId, reply.localId, {
                    mode: 'editing',
                    editPreviousText: reply.text
                })
            );
        };

        let onClickDelete = async (e: React.MouseEvent) => {
            e.preventDefault();

            store.dispatch(
                updateReply(comment.localId, reply.localId, {
                    mode: 'delete_confirm'
                })
            );
        };

        let actions = <></>;
        if (reply.author == null || this.props.user.id === reply.author.id) {
            actions = (
                <div className="comment-reply__actions">
                    <button
                        className="comment-reply__button comment-reply__button--primary"
                        onClick={onClickEdit}
                    >
                        Edit
                    </button>
                    <button
                        className="comment-reply__button"
                        onClick={onClickDelete}
                    >
                        Delete
                    </button>
                </div>
            );
        }

        return (
            <>
                <p className="comment-reply__text">{reply.text}</p>
                {this.renderAuthorDate()}
                {actions}
            </>
        );
    }

    render() {
        let inner: React.ReactFragment;

        switch (this.props.reply.mode) {
            case 'editing':
                inner = this.renderEditing();
                break;

            case 'saving':
                inner = this.renderSaving();
                break;

            case 'save_error':
                inner = this.renderSaveError();
                break;

            case 'delete_confirm':
                inner = this.renderDeleteConfirm();
                break;

            case 'deleting':
                inner = this.renderDeleting();
                break;

            case 'delete_error':
                inner = this.renderDeleteError();
                break;

            default:
                inner = this.renderDefault();
                break;
        }

        return (
            <li
                key={this.props.reply.localId}
                className={`comment-reply comment-reply--mode-${this.props.reply.mode}`}
                data-reply-id={this.props.reply.localId}
            >
                {inner}
            </li>
        );
    }
}
