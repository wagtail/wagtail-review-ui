import * as React from 'react';
import * as FocusTrap from 'focus-trap-react';

import { Store } from '../../state';
import { ModerationState, ModerationErrorCode } from '../../state/moderation';
import APIClient from '../../api';
import Radio from '../widgets/Radio';

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
            actionErrors = <div className="moderation-bar__error">This field is required.</div>;
        }

        let reasonErrors = <></>;
        if (this.props.errors.has('comment-required')) {
            reasonErrors = <div className="moderation-bar__error">This field is required.</div>;
        } else if (this.props.errors.has('comment-too-long')) {
            reasonErrors = (
                <div className="moderation-bar__error">
                    This field is too long (200 characters maximum).
                </div>
            );
        }

        const onChangeApprovalStatus = (value: string) => {
            let taskAction: null | 'approve' | 'reject' = null;
            if (value == 'approve') {
                taskAction = 'approve';
            } else if (value == 'reject') {
                taskAction = 'reject';
            }

            this.props.store.dispatch(updateModerationState({ taskAction }));

            if (taskAction !== null && 'action-required' in this.props.errors) {
                this.props.store.dispatch(clearError('action-required'));
            }
        };

        return (
            <div
                className="moderation-bar__modal"
                aria-modal="true"
            >
                <div
                    className="action"
                    data-error={this.props.errors.has('action-required')}
                >

                    <h3>Your Review</h3>
                    <Radio
                        id="approve"
                        name="review-action"
                        value="approve"
                        label="Approved"
                        checked={this.props.taskAction === 'approve'}
                        onChange={onChangeApprovalStatus}
                    />

                    <Radio
                        id="reject"
                        name="review-action"
                        value="reject"
                        label="Needs changes"
                        checked={this.props.taskAction === 'reject'}
                        onChange={onChangeApprovalStatus}
                    />
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

        const closeActionBox = () => {
            this.props.store.dispatch(
                updateModerationState({
                    actionBoxOpen: false
                })
            );
        };

        return (
            <FocusTrap active={this.props.actionBoxOpen} focusTrapOptions={{onDeactivate: closeActionBox}}>
                <div className="moderation-bar">
                    {this.renderModal()}

                    <button
                        className="moderation-bar__button"
                        onClick={toggleActionBox}
                    >
                        Submit your review
                    </button>
                </div>
            </FocusTrap>
        );
    }
}
