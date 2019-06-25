import { Comment, CommentReply, ModerationStatus } from './state';

export interface ReviewerApi {
    id: number;
    name: string;
}

export interface CommentReplyApi {
    id: number;
    author: ReviewerApi;
    text: string;
    created_at: string;
    updated_at: string;
}

export interface CommentApi {
    id: number;
    author: ReviewerApi;
    quote: string;
    text: string;
    created_at: string;
    updated_at: string;
    is_resolved: boolean;
    replies: CommentReplyApi[];
    content_path: string;
    start_xpath: string;
    start_offset: number;
    end_xpath: string;
    end_offset: number;
}

export interface ModerationRespondApi {
    status: ModerationStatus;
    comment: string;
}

export default class APIClient {
    baseUrl: string;
    reviewToken: string;

    constructor(baseUrl: string, reviewToken: string) {
        this.baseUrl = baseUrl;
        this.reviewToken = reviewToken;
    }

    async fetchAllComments(): Promise<CommentApi[]> {
        let response = await fetch(`${this.baseUrl}/comments/`, {
            headers: {
                'X-Review-Token': this.reviewToken
            }
        });

        return await response.json().then((comments: CommentApi[]) => {
            for (let comment of comments) {
                // Remove the '.' we add when serialising blank xpaths saveComment
                // This seems to confuse annotator.js and causes the annotations
                // to be slightly off
                if (comment.start_xpath == '.') {
                    comment.start_xpath = '';
                }
                if (comment.end_xpath == '.') {
                    comment.end_xpath = '';
                }
            }

            return comments;
        });
    }

    async saveComment(comment: Comment): Promise<CommentApi> {
        let url = `${this.baseUrl}/comments/`;
        let method = 'POST';

        if (comment.remoteId) {
            url = `${this.baseUrl}/comments/${comment.remoteId}/`;
            method = 'PUT';
        }

        // TODO: Maybe should PATCH text instead?

        let response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Review-Token': this.reviewToken
            },
            body: JSON.stringify(<CommentApi>{
                quote: comment.annotation.annotation.quote,
                text: comment.text,
                is_resolved: comment.isResolved, // FIXME: Might blat resolution done by someone else
                content_path: comment.annotation.contentPath,
                start_xpath:
                    comment.annotation.annotation.ranges[0].start || '.',
                start_offset:
                    comment.annotation.annotation.ranges[0].startOffset,
                end_xpath: comment.annotation.annotation.ranges[0].end || '.',
                end_offset: comment.annotation.annotation.ranges[0].endOffset
            })
        });

        return await response.json();
    }

    async deleteComment(comment: Comment) {
        if (comment.remoteId) {
            let response = await fetch(`${this.baseUrl}/comments/${comment.remoteId}/`, {
                method: 'DELETE',
                headers: {
                    'X-Review-Token': this.reviewToken
                }
            });

            if (response.status != 204 && response.status != 404) {
                throw new Error(`Unexpected status code returned when deleting comment: ${response.status}`);
            }
        }
    }

    async saveCommentResolvedStatus(comment: Comment, isResolved: boolean) {
        // Separate endpoint as anyone can mark a comment as resolved
        let method = isResolved ? 'PUT' : 'DELETE';

        await fetch(`${this.baseUrl}/comments/${comment.remoteId}/resolved/`, {
            method,
            headers: {
                'X-Review-Token': this.reviewToken
            }
        });
    }

    async saveCommentReply(
        comment: Comment,
        reply: CommentReply
    ): Promise<CommentReplyApi> {
        let url = `${this.baseUrl}/comments/${comment.remoteId}/replies/`;
        let method = 'POST';

        if (reply.remoteId) {
            url = `${this.baseUrl}/comments/${comment.remoteId}/replies/${reply.remoteId}/`;
            method = 'PUT';
        }

        let response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Review-Token': this.reviewToken
            },
            body: JSON.stringify(<CommentReplyApi>{
                text: reply.text
            })
        });

        return await response.json();
    }

    async deleteCommentReply(comment: Comment, reply: CommentReply) {
        if (reply.remoteId) {
            let response = await fetch(
                `${this.baseUrl}/comments/${comment.remoteId}/replies/${reply.remoteId}/`,
                {
                    method: 'DELETE',
                    headers: {
                        'X-Review-Token': this.reviewToken
                    }
                }
            );

            if (response.status != 204 && response.status != 404) {
                throw new Error(`Unexpected status code returned when deleting comment reply: ${response.status}`);
            }
        }
    }

    async extendModerationLock() {
        await fetch(`${this.baseUrl}/moderation/lock/`, {
            method: 'PUT',
            headers: {
                'X-Review-Token': this.reviewToken
            }
        });
    }

    async submitModerationResponse(status: ModerationStatus, comment: string) {
        await fetch(`${this.baseUrl}/moderation/respond/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Review-Token': this.reviewToken
            },
            body: JSON.stringify(<ModerationRespondApi>{
                status,
                comment
            })
        });
    }
}
