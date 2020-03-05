import * as React from 'react';

import { Store } from '../../state';
import { ModerationState, ModerationErrorCode } from '../../state/moderation';
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

        const onChangeApprovalStatus = (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {
            e.preventDefault();

            let taskAction: null | 'approve' | 'reject' = null;
            if (e.target.value == 'approve') {
                taskAction = 'approve';
            } else if (e.target.value == 'reject') {
                taskAction = 'reject';
            }

            this.props.store.dispatch(updateModerationState({ taskAction }));

            if (taskAction !== null && 'action-required' in this.props.errors) {
                this.props.store.dispatch(clearError('action-required'));
            }
        };

        return (
            <div className="moderation-bar__modal">
                <div
                    className="action"
                    data-error={this.props.errors.has('action-required')}
                >
                    <h3>Your Review</h3>
                    <input
                        type="radio"
                        id="approve"
                        value="approve"
                        checked={this.props.taskAction === 'approve'}
                        onChange={onChangeApprovalStatus}
                    />
                    <label htmlFor="approve">Approved</label>
                    <input
                        type="radio"
                        id="reject"
                        value="reject"
                        checked={this.props.taskAction === 'reject'}
                        onChange={onChangeApprovalStatus}
                    />
                    <label htmlFor="reject">Needs changes</label>

                    {actionErrors}
                </div>

                <div
                    className="reason"
                    data-error={this.props.errors.has('action-required')}
                >
                    <p>Please give a reason for this status</p>

                    <textarea
                        name="comment"
                        value={this.props.comment}
                        onChange={onChangeComment}
                        placeholder="Enter your comments..."
                    ></textarea>
                    <small>200 character limit.</small>

                    {reasonErrors}
                </div>

                <button
                    className="moderation-bar__modal-button moderation-bar__modal-button--primary"
                    onClick={onSubmit}
                >
                    Submit Review
                </button>

                <div className="moderation-bar__arrow"></div>
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

        return (
            <div className="moderation-bar">
                {this.renderModal()}

                <button
                    className="moderation-bar__button"
                    onClick={toggleActionBox}
                >
                    Submit your review
                </button>
            </div>
        );
    }
}
