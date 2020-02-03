import * as React from 'react';

import { Store } from '../../state';
import {
    ModerationState,
    ModerationTaskAction,
    ModerationErrorCode
} from '../../state/moderation';
import APIClient from '../../api';

import {
    updateModerationState,
    setErrors,
    clearError
} from '../../actions/moderation';

interface ModerationBarProps extends ModerationState {
    store: Store;
    api: APIClient;
}

export default class ModerationBar extends React.Component<ModerationBarProps> {
    renderModal() {
        if (!this.props.actionBoxOpen) {
            return <></>;
        }

        let validate = (): boolean => {
            let errors: Set<ModerationErrorCode> = new Set();

            if (this.props.taskAction === null) {
                errors.add('action-required');
            }

            if (this.props.comment.length == 0) {
                errors.add('comment-required');
            }

            if (this.props.comment.length > 200) {
                errors.add('comment-too-long');
            }

            this.props.store.dispatch(setErrors(errors));

            return errors.size == 0;
        };

        let setTaskActionOnChange = (taskAction: ModerationTaskAction) => {
            return (e: React.ChangeEvent<HTMLInputElement>) => {
                e.preventDefault();
                this.props.store.dispatch(updateModerationState({ taskAction }));

                if (taskAction !== null && 'action-required' in this.props.errors) {
                    this.props.store.dispatch(clearError('action-required'));
                }
            };
        };

        let onChangeComment = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            e.preventDefault();
            this.props.store.dispatch(
                updateModerationState({ comment: e.target.value })
            );

            if (
                e.target.value.length > 0 &&
                'comment-required' in this.props.errors
            ) {
                this.props.store.dispatch(clearError('comment-required'));
            }

            if (
                e.target.value.length <= 200 &&
                'comment-too-long' in this.props.errors
            ) {
                this.props.store.dispatch(clearError('comment-too-long'));
            }
        };

        let onSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();

            if (!validate()) {
                return;
            }

            this.props.store.dispatch(
                updateModerationState({
                    actionBoxOpen: false,
                    submitStage: 'submitting'
                })
            );

            await this.props.api.submitModerationResponse(
                this.props.taskAction,
                this.props.comment
            );

            // TODO handle error
            this.props.store.dispatch(
                updateModerationState({ submitStage: 'submitted' })
            );
        };

        let actionErrors = <></>;
        if (this.props.errors.has('action-required')) {
            actionErrors = <div className="error">This field is required.</div>;
        }

        let reasonErrors = <></>;
        if (this.props.errors.has('comment-required')) {
            reasonErrors = <div className="error">This field is required.</div>;
        } else if (this.props.errors.has('comment-too-long')) {
            reasonErrors = (
                <div className="error">
                    This field is too long (200 characters maximum).
                </div>
            );
        }

        return (
            <div className="moderation-bar__modal">
                <div
                    className="action"
                    data-error={this.props.errors.has('action-required')}
                >
                    <p>Please select an action</p>
                    <input
                        type="radio"
                        id="approve"
                        checked={this.props.taskAction === 'approve'}
                        onChange={setTaskActionOnChange('approve')}
                    />
                    <label htmlFor="approved">Approve</label>
                    <input
                        type="radio"
                        id="reject"
                        checked={this.props.taskAction === 'reject'}
                        onChange={setTaskActionOnChange('reject')}
                    />
                    <label htmlFor="reject">Reject</label>

                    {actionErrors}
                </div>

                <div
                    className="reason"
                    data-error={this.props.errors.has('action-required')}
                >
                    <p>Please give a reason for this action</p>

                    <textarea
                        name="comment"
                        value={this.props.comment}
                        onChange={onChangeComment}
                    ></textarea>
                    <small>200 character limit.</small>

                    {reasonErrors}
                </div>

                <button className="btn" onClick={onSubmit}>
                    Submit Review
                </button>
            </div>
        );
    }

    render() {
        let toggleActionBox = (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();

            this.props.store.dispatch(
                updateModerationState({
                    actionBoxOpen: !this.props.actionBoxOpen
                })
            );
        };

        let reviewButton = <></>;

        if (this.props.submitStage == 'not-submitted') {
            reviewButton = (
                <>
                    <span>Review</span>
                    <button className="btn" onClick={toggleActionBox}>
                        +
                    </button>
                </>
            );
        } else if (this.props.submitStage == 'submitting') {
            reviewButton = (
                <>
                    <span>Submitting...</span>
                </>
            );
        } else if (this.props.submitStage == 'submitted') {
            reviewButton = (
                <>
                    <span>Submitted!</span>
                </>
            );
        } else if (this.props.submitStage == 'errored') {
            // TODO
            reviewButton = (
                <>
                    <span>Error</span>
                    <a href="#">Retry</a>
                </>
            );
        }

        return (
            <div className="moderation-bar">
                {this.renderModal()}

                <div className="moderation-bar__status">{reviewButton}</div>
            </div>
        );
    }
}
