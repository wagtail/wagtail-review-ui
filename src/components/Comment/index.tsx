import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as dateFormat from 'dateformat';

import { Store } from '../../state';
import {
    Author,
    Comment,
    authorFromApi,
    newCommentReply
} from '../../state/comments';
import {
    updateComment,
    deleteComment,
    setFocusedComment,
    addReply,
    setPinnedComment
} from '../../actions/comments';
import APIClient from '../../api';
import { LayoutController } from '../../utils/layout';
import { getNextReplyId } from '../../utils/sequences';
import CommentReplyComponent, { saveCommentReply } from '../CommentReply';
import Checkbox from '../widgets/Checkbox';

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
                author: authorFromApi(commentData.author),
                date: Date.parse(commentData.created_at)
            })
        );
    } catch (err) {
        console.error(err);
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

        if (comment.annotation) {
            comment.annotation.onDelete();
        }
    } catch (err) {
        console.error(err);
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
    renderAuthorDate(): React.ReactFragment {
        let { comment } = this.props;

        let author = comment.author ? comment.author.name + ' - ' : '';

        return (
            <p className="comment__author-date">
                {author}
                {dateFormat(comment.date, 'h:MM mmmm d')}
            </p>
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
            let reply = newCommentReply(replyId, null, Date.now(), {
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
        let replyBeingEdited = false;
        for (const reply of comment.replies.values()) {
            if (reply.mode == 'saving' || reply.mode == 'editing') {
                replyBeingEdited = true;
            }

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

        // Hide new reply if a reply is being edited
        if (!hideNewReply && replyBeingEdited) {
            hideNewReply = true;
        }

        let replyActions = <></>;
        if (!hideNewReply && comment.isFocused && comment.newReply.length > 0) {
            replyActions = (
                <div className="comment__reply-actions">
                    <button
                        onClick={onClickSendReply}
                        className="comment__button comment__button--primary"
                    >
                        Reply
                    </button>
                    <button
                        onClick={onClickCancelReply}
                        className="comment__button"
                    >
                        Cancel
                    </button>
                </div>
            );
        }

        let replyTextarea = <></>;
        if (!hideNewReply && (comment.isFocused || comment.newReply)) {
            replyTextarea = (
                <textarea
                    className="comment__reply-input"
                    placeholder="Enter your reply..."
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

            if (comment.annotation) {
                comment.annotation.onDelete();
            }
        };

        return (
            <>
                <textarea
                    className="comment__input"
                    value={comment.text}
                    onChange={onChangeText}
                    style={{ resize: 'none' }}
                    placeholder="Enter your comments..."
                />
                <div className="comment__actions">
                    <button
                        onClick={onSave}
                        className="comment__button comment__button--primary"
                    >
                        Save
                    </button>
                    <button onClick={onCancel} className="comment__button">
                        Cancel
                    </button>
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
                <textarea
                    className="comment__input"
                    value={comment.text}
                    onChange={onChangeText}
                    style={{ resize: 'none' }}
                />
                <div className="comment__actions">
                    <button
                        onClick={onSave}
                        className="comment__button comment__button--primary"
                    >
                        Save
                    </button>
                    <button onClick={onCancel} className="comment__button">
                        Cancel
                    </button>
                    <div className="comment__resolved">
                        <Checkbox
                            id={`comment-${comment.localId}-resolved`}
                            label="Resolved"
                            checked={comment.resolvedAt !== null}
                            disabled={true}
                        />
                    </div>
                </div>
                {this.renderReplies({ hideNewReply: true })}
            </>
        );
    }

    renderSaving(): React.ReactFragment {
        let { comment } = this.props;

        return (
            <>
                <p className="comment__text">{comment.text}</p>
                {this.renderAuthorDate()}
                <div className="comment__progress">Saving...</div>
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
                <p className="comment__text">{comment.text}</p>
                {this.renderAuthorDate()}
                {this.renderReplies({ hideNewReply: true })}
                <div className="comment__error">
                    Save error
                    <button className="comment__button" onClick={onClickRetry}>
                        Retry
                    </button>
                </div>
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
                <p className="comment__text">{comment.text}</p>
                {this.renderAuthorDate()}
                <div className="comment__confirm-delete">
                    Are you sure?
                    <button
                        className="comment__button comment__button--red"
                        onClick={onClickDelete}
                    >
                        Delete
                    </button>
                    <button className="comment__button" onClick={onClickCancel}>
                        Cancel
                    </button>
                </div>
                {this.renderReplies({ hideNewReply: true })}
            </>
        );
    }

    renderDeleting(): React.ReactFragment {
        let { comment } = this.props;

        return (
            <>
                <p className="comment__text">{comment.text}</p>
                {this.renderAuthorDate()}
                <div className="comment__progress">Deleting...</div>
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

        let onClickCancel = async (e: React.MouseEvent) => {
            e.preventDefault();

            store.dispatch(
                updateComment(comment.localId, {
                    mode: 'default'
                })
            );
        };

        return (
            <>
                <p className="comment__text">{comment.text}</p>
                {this.renderAuthorDate()}
                {this.renderReplies({ hideNewReply: true })}
                <div className="comment__error">
                    Delete error
                    <button className="comment__button" onClick={onClickCancel}>
                        Cancel
                    </button>
                    <button className="comment__button" onClick={onClickRetry}>
                        Retry
                    </button>
                </div>
            </>
        );
    }

    renderDefault(): React.ReactFragment {
        let { comment, store, api } = this.props;

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

        let changeResolved = async (checked: boolean) => {
            let resolvedAt = checked ? comment.resolvedAt || Date.now() : null;

            store.dispatch(
                updateComment(comment.localId, {
                    resolvedAt,
                    updatingResolvedStatus: true,
                    resolvedThisSession: true
                })
            );

            await api.saveCommentResolvedStatus(comment, resolvedAt !== null);

            store.dispatch(
                updateComment(comment.localId, {
                    updatingResolvedStatus: false
                })
            );
        };

        let actions = <></>;
        if (
            comment.author == null ||
            this.props.user.id === comment.author.id
        ) {
            actions = (
                <>
                    <button
                        className="comment__button comment__button--primary"
                        onClick={onClickEdit}
                    >
                        Edit
                    </button>
                    <button className="comment__button" onClick={onClickDelete}>
                        Delete
                    </button>
                </>
            );
        }

        return (
            <>
                <p className="comment__text">{comment.text}</p>
                {this.renderAuthorDate()}
                <div className="comment__actions">
                    {actions}
                    <div className="comment__resolved">
                        <Checkbox
                            id={`comment-${comment.localId}-resolved`}
                            label="Resolved"
                            checked={comment.resolvedAt !== null}
                            onChange={changeResolved}
                        />
                    </div>
                </div>
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

        let onDoubleClick = () => {
            this.props.store.dispatch(
                setPinnedComment(this.props.comment.localId)
            );
        };

        let top = this.props.layout.getCommentPosition(
            this.props.comment.localId
        );
        let right = this.props.comment.isFocused ? 50 : 0;
        return (
            <li
                key={this.props.comment.localId}
                className={`comment comment--mode-${this.props.comment.mode}`}
                style={{
                    position: 'absolute',
                    top: `${top}px`,
                    right: `${right}px`
                }}
                data-comment-id={this.props.comment.localId}
                onClick={onClick}
                onDoubleClick={onDoubleClick}
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
                let textAreaElement = element.querySelector('textarea');

                if (textAreaElement instanceof HTMLTextAreaElement) {
                    textAreaElement.focus();
                }
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

        if (this.props.comment.annotation) {
            this.props.comment.annotation.show();
        }
    }

    componentWillUnmount() {
        this.props.layout.setCommentElement(this.props.comment.localId, null);

        if (this.props.comment.annotation) {
            this.props.comment.annotation.hide();
        }
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
