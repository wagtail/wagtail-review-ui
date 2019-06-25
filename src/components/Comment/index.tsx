import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as dateFormat from 'dateformat';

import { Author, Comment, CommentReply, Store } from '../../state';
import {
    updateComment,
    deleteComment,
    setFocusedComment,
    addReply
} from '../../actions';
import APIClient from '../../api';
import { LayoutController } from '../../utils/layout';
import { getNextReplyId } from '../../utils/sequences';
import CommentReplyComponent, { saveCommentReply } from '../CommentReply';

import './style.scss';

async function saveComment(comment: Comment, store: Store, api: APIClient) {
    store.dispatch(
        updateComment(comment.localId, {
            mode: 'saving'
        })
    );

    try {
        let commentData = await api.saveComment(comment);

        store.dispatch(
            updateComment(comment.localId, {
                mode: 'default',
                remoteId: commentData.id,
                author: Author.fromApi(commentData.author),
                date: Date.parse(commentData.created_at)
            })
        );
    } catch (err) {
        store.dispatch(
            updateComment(comment.localId, {
                mode: 'save_error'
            })
        );
    }
}

async function doDeleteComment(comment: Comment, store: Store, api: APIClient) {
    store.dispatch(
        updateComment(comment.localId, {
            mode: 'deleting'
        })
    );

    try {
        await api.deleteComment(comment);

        store.dispatch(deleteComment(comment.localId));
        comment.annotation.onDelete();
    } catch (err) {
        store.dispatch(
            updateComment(comment.localId, {
                mode: 'delete_error'
            })
        );
    }
}

export interface CommentProps {
    store: Store;
    comment: Comment;
    api: APIClient;
    layout: LayoutController;
    user: Author;
}

export default class CommentComponent extends React.Component<CommentProps> {
    renderHeader(): React.ReactFragment {
        let { comment, store, api } = this.props;
        let title, date, resolved;

        if (comment.mode == 'creating') {
            title = 'New comment';
            date = '';
            resolved = <></>;
        } else {
            title = comment.author.name;
            date = dateFormat(comment.date, 'h:MM mmmm d');

            let toggleResolved = async (e: React.MouseEvent) => {
                e.preventDefault();

                let isResolved = !comment.isResolved;

                store.dispatch(
                    updateComment(comment.localId, {
                        isResolved,
                        updatingResolvedStatus: true,
                        resolvedThisSession: true
                    })
                );

                await api.saveCommentResolvedStatus(comment, isResolved);

                store.dispatch(
                    updateComment(comment.localId, {
                        updatingResolvedStatus: false
                    })
                );
            };

            resolved = (
                <div className="comment__header-resolved">
                    <label htmlFor="resolved">Resolved</label>
                    <input
                        name="resolved"
                        type="checkbox"
                        onClick={toggleResolved}
                        checked={comment.isResolved}
                    />
                </div>
            );
        }

        return (
            <div className="comment__header">
                <div className="comment__header-info">
                    <h2>{title}</h2>
                    <p className="comment__date">{date}</p>
                </div>
                {resolved}
            </div>
        );
    }

    renderReplies({ hideNewReply = false } = {}): React.ReactFragment {
        let { comment, store, api, user } = this.props;

        if (!comment.remoteId) {
            // Hide replies UI if the comment itself isn't saved yet
            return <></>;
        }

        let onChangeNewReply = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            e.preventDefault();

            store.dispatch(
                updateComment(comment.localId, {
                    newReply: e.target.value
                })
            );
        };

        let onClickSendReply = async (e: React.MouseEvent) => {
            e.preventDefault();

            let replyId = getNextReplyId();
            let reply = new CommentReply(replyId, user, Date.now(), {
                text: comment.newReply,
                mode: 'saving'
            });
            store.dispatch(addReply(comment.localId, reply));

            store.dispatch(
                updateComment(comment.localId, {
                    newReply: ''
                })
            );

            await saveCommentReply(comment, reply, store, api);
        };

        let onClickCancelReply = (e: React.MouseEvent) => {
            e.preventDefault();

            store.dispatch(
                updateComment(comment.localId, {
                    newReply: ''
                })
            );
        };

        let replies = [];
        for (const replyId in comment.replies) {
            const reply = comment.replies[replyId];
            replies.push(
                <CommentReplyComponent
                    key={reply.localId}
                    store={store}
                    api={api}
                    user={user}
                    comment={comment}
                    reply={reply}
                />
            );
        }

        let replyActions = <></>;
        if (!hideNewReply && comment.isFocused && comment.newReply.length > 0) {
            replyActions = (
                <div className="comment__reply-actions">
                    <button onClick={onClickSendReply}>Send Reply</button>
                    <button onClick={onClickCancelReply}>Cancel</button>
                </div>
            );
        }

        let replyTextarea = <></>;
        if (!hideNewReply && (comment.isFocused || comment.newReply)) {
            replyTextarea = (
                <textarea
                    className="comment__reply-input"
                    placeholder="Write a comment back"
                    value={comment.newReply}
                    onChange={onChangeNewReply}
                    style={{ resize: 'none' }}
                />
            );
        }

        return (
            <>
                <ul className="comment__replies">{replies}</ul>
                {replyTextarea}
                {replyActions}
            </>
        );
    }

    renderCreating(): React.ReactFragment {
        let { comment, store, api } = this.props;

        let onChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            e.preventDefault();

            store.dispatch(
                updateComment(comment.localId, {
                    text: e.target.value
                })
            );
        };

        let onSave = async (e: React.MouseEvent) => {
            e.preventDefault();
            await saveComment(comment, store, api);
        };

        let onCancel = (e: React.MouseEvent) => {
            e.preventDefault();

            store.dispatch(deleteComment(comment.localId));
            comment.annotation.onDelete();
        };

        return (
            <>
                {this.renderHeader()}
                <textarea
                    className="comment__input"
                    value={comment.text}
                    onChange={onChangeText}
                    style={{ resize: 'none' }}
                />
                <div className="comment__edit-actions">
                    <button onClick={onSave}>Add Comment</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            </>
        );
    }

    renderEditing(): React.ReactFragment {
        let { comment, store, api } = this.props;

        let onChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            e.preventDefault();

            store.dispatch(
                updateComment(comment.localId, {
                    text: e.target.value
                })
            );
        };

        let onSave = async (e: React.MouseEvent) => {
            e.preventDefault();

            await saveComment(comment, store, api);
        };

        let onCancel = (e: React.MouseEvent) => {
            e.preventDefault();

            store.dispatch(
                updateComment(comment.localId, {
                    mode: 'default',
                    text: comment.editPreviousText
                })
            );
        };

        return (
            <>
                {this.renderHeader()}
                <textarea
                    className="comment__input"
                    value={comment.text}
                    onChange={onChangeText}
                    style={{ resize: 'none' }}
                />
                <div className="comment__edit-actions">
                    <button onClick={onSave}>Save</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
                {this.renderReplies({ hideNewReply: true })}
            </>
        );
    }

    renderSaving(): React.ReactFragment {
        let { comment } = this.props;

        return (
            <>
                {this.renderHeader()}
                <p className="comment__text">{comment.text}</p>
                <div className="comment__actions">Saving...</div>
                {this.renderReplies({ hideNewReply: true })}
            </>
        );
    }

    renderSaveError(): React.ReactFragment {
        let { comment, store, api } = this.props;

        let onClickRetry = async (e: React.MouseEvent) => {
            e.preventDefault();

            await saveComment(comment, store, api);
        };

        return (
            <>
                {this.renderHeader()}
                <p className="comment__text">{comment.text}</p>
                <div className="comment__actions">
                    <span className="comment-reply__error">
                        Save error{' '}
                        <a href="#" onClick={onClickRetry}>
                            Retry
                        </a>
                    </span>
                </div>
                {this.renderReplies({ hideNewReply: true })}
            </>
        );
    }

    renderDeleteConfirm(): React.ReactFragment {
        let { comment, store, api } = this.props;

        let onClickDelete = async (e: React.MouseEvent) => {
            e.preventDefault();

            await doDeleteComment(comment, store, api);
        };

        let onClickCancel = (e: React.MouseEvent) => {
            e.preventDefault();

            store.dispatch(
                updateComment(comment.localId, {
                    mode: 'default'
                })
            );
        };

        return (
            <>
                {this.renderHeader()}
                <p className="comment__text">{comment.text}</p>
                <div className="comment__actions">
                    <span className="comment__confirm-delete">
                        Are you sure?
                    </span>
                    <a href="#" onClick={onClickDelete}>
                        Delete
                    </a>
                    <a href="#" onClick={onClickCancel}>
                        Cancel
                    </a>
                </div>
                {this.renderReplies({ hideNewReply: true })}
            </>
        );
    }

    renderDeleting(): React.ReactFragment {
        let { comment } = this.props;

        return (
            <>
                {this.renderHeader()}
                <p className="comment__text">{comment.text}</p>
                <div className="comment__actions">Deleting...</div>
                {this.renderReplies({ hideNewReply: true })}
            </>
        );
    }

    renderDeleteError(): React.ReactFragment {
        let { comment, store, api } = this.props;

        let onClickRetry = async (e: React.MouseEvent) => {
            e.preventDefault();

            await doDeleteComment(comment, store, api);
        };

        return (
            <>
                {this.renderHeader()}
                <p className="comment__text">{comment.text}</p>
                <div className="comment__actions">
                    <span className="comment-reply__error">
                        Delete error{' '}
                        <a href="#" onClick={onClickRetry}>
                            Retry
                        </a>
                    </span>
                </div>
                {this.renderReplies({ hideNewReply: true })}
            </>
        );
    }

    renderDefault(): React.ReactFragment {
        let { comment, store } = this.props;

        let onClickEdit = async (e: React.MouseEvent) => {
            e.preventDefault();

            store.dispatch(
                updateComment(comment.localId, {
                    mode: 'editing',
                    editPreviousText: comment.text
                })
            );
        };

        let onClickDelete = async (e: React.MouseEvent) => {
            e.preventDefault();

            store.dispatch(
                updateComment(comment.localId, {
                    mode: 'delete_confirm'
                })
            );
        };

        let actions = <></>;
        if (this.props.user.isSameAs(comment.author)) {
            actions = (
                <div className="comment__actions">
                    <a href="#" onClick={onClickEdit}>
                        Edit
                    </a>
                    <a href="#" onClick={onClickDelete}>
                        Delete
                    </a>
                </div>
            );
        }

        return (
            <>
                {this.renderHeader()}
                <p className="comment__text">{comment.text}</p>
                {actions}
                {this.renderReplies()}
            </>
        );
    }

    render() {
        let inner: React.ReactFragment;

        switch (this.props.comment.mode) {
            case 'creating':
                inner = this.renderCreating();
                break;

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

        let onClick = () => {
            this.props.store.dispatch(
                setFocusedComment(this.props.comment.localId)
            );
        };

        let top = this.props.layout.getCommentPosition(
            this.props.comment.localId
        );
        let right = this.props.comment.isFocused ? 50 : 0;
        return (
            <li
                key={this.props.comment.localId}
                className="comment"
                style={{
                    position: 'absolute',
                    top: `${top}px`,
                    right: `${right}px`
                }}
                data-comment-id={this.props.comment.localId}
                onClick={onClick}
            >
                {inner}
            </li>
        );
    }

    componentDidMount() {
        let element = ReactDOM.findDOMNode(this);

        if (element instanceof HTMLElement) {
            // If this is a new comment, focus in the edit box
            if (this.props.comment.mode == 'creating') {
                element.querySelector('textarea').focus();
            }

            this.props.layout.setCommentElement(
                this.props.comment.localId,
                element
            );
            this.props.layout.setCommentHeight(
                this.props.comment.localId,
                element.offsetHeight
            );
        }

        this.props.comment.annotation.show();
    }

    componentWillUnmount() {
        this.props.layout.setCommentElement(this.props.comment.localId, null);

        this.props.comment.annotation.hide();
    }

    componentDidUpdate() {
        let element = ReactDOM.findDOMNode(this);

        // Keep height up to date so that other comments will be moved out of the way
        if (element instanceof HTMLElement) {
            this.props.layout.setCommentHeight(
                this.props.comment.localId,
                element.offsetHeight
            );
        }
    }
}
