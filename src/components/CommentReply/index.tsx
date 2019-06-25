import * as React from 'react';
import * as dateFormat from 'dateformat';

import { Comment, CommentReply, Store, Author } from '../../state';
import APIClient from '../../api';
import { updateReply, deleteReply } from '../../actions';

import './style.scss';

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
        await api.saveCommentReply(comment, reply);

        store.dispatch(
            updateReply(comment.localId, reply.localId, {
                mode: 'default'
            })
        );
    } catch (err) {
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

class CommentReplyHeader extends React.Component<CommentReplyProps> {
    render() {
        let { reply } = this.props;
        return (
            <div className="comment-reply__header">
                <hr />
                <div className="comment-reply__header-info">
                    <h2>{reply.author.name}</h2>
                    <p className="comment-reply__date">
                        {dateFormat(reply.date, 'h:MM mmmm d')}
                    </p>
                </div>
                <div className="comment-reply__header-actions">
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export default class CommentReplyComponent extends React.Component<
    CommentReplyProps
> {
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

            comment.annotation.onDelete();
            store.dispatch(
                updateReply(comment.localId, reply.localId, {
                    mode: 'default',
                    text: comment.editPreviousText
                })
            );
        };

        return (
            <>
                <CommentReplyHeader {...this.props}>
                    <button onClick={onSave}>Save</button>
                    <button onClick={onCancel}>Cancel</button>
                </CommentReplyHeader>
                <textarea
                    className="comment-reply__input"
                    value={reply.text}
                    onChange={onChangeText}
                    style={{ resize: 'none' }}
                />
            </>
        );
    }

    renderSaving(): React.ReactFragment {
        let { reply } = this.props;

        return (
            <>
                <CommentReplyHeader {...this.props}>
                    Saving...
                </CommentReplyHeader>
                <p className="comment-reply__text">{reply.text}</p>
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
                <CommentReplyHeader {...this.props}>
                    <span className="comment-reply__error">
                        Save error{' '}
                        <a href="#" onClick={onClickRetry}>
                            Retry
                        </a>
                    </span>
                </CommentReplyHeader>
                <p className="comment-reply__text">{reply.text}</p>
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
                <CommentReplyHeader {...this.props}>
                    <span className="comment-reply__confirm-delete">
                        Are you sure?
                    </span>
                    <a href="#" onClick={onClickDelete}>
                        Delete
                    </a>
                    <a href="#" onClick={onClickCancel}>
                        Cancel
                    </a>
                </CommentReplyHeader>
                <p className="comment-reply__text">{reply.text}</p>
            </>
        );
    }

    renderDeleting(): React.ReactFragment {
        let { reply } = this.props;

        return (
            <>
                <CommentReplyHeader {...this.props}>
                    Deleting...
                </CommentReplyHeader>
                <p className="comment-reply__text">{reply.text}</p>
            </>
        );
    }

    renderDeleteError(): React.ReactFragment {
        let { comment, reply, store, api } = this.props;

        let onClickRetry = async (e: React.MouseEvent) => {
            e.preventDefault();

            await deleteCommentReply(comment, reply, store, api);
        };

        return (
            <>
                <CommentReplyHeader {...this.props}>
                    <span className="comment-reply__error">
                        Delete error{' '}
                        <a href="#" onClick={onClickRetry}>
                            Retry
                        </a>
                    </span>
                </CommentReplyHeader>
                <p className="comment-reply__text">{reply.text}</p>
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
        if (this.props.user.isSameAs(reply.author)) {
            actions = (
                <>
                    <a href="#" onClick={onClickEdit}>
                        Edit
                    </a>
                    <a href="#" onClick={onClickDelete}>
                        Delete
                    </a>
                </>
            );
        }

        return (
            <>
                <CommentReplyHeader {...this.props}>
                    {actions}
                </CommentReplyHeader>
                <p className="comment-reply__text">{reply.text}</p>
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
                className="comment-reply"
                data-reply-id={this.props.reply.localId}
            >
                {inner}
            </li>
        );
    }
}
