import { Annotation } from './annotation';

const GAP = 20.0; // Gap between comments in pixels
const TOP_MARGIN = 100.0; // Spacing from the top to the first comment in pixels
const OFFSET = -50; // How many pixels from the annotation position should the comments be placed?

export class LayoutController {
    commentElements: { [commentId: number]: HTMLElement } = {};
    commentAnnotations: { [commentId: number]: Annotation } = {};
    commentDesiredPositions: { [commentId: number]: number } = {};
    commentHeights: { [commentId: number]: number } = {};
    pinnedComment: number | null = null;
    commentCalculatedPositions: { [commentId: number]: number } = {};
    isDirty: boolean = false;

    setCommentElement(commentId: number, element: HTMLElement | null) {
        if (element !== null) {
            this.commentElements[commentId] = element;
        } else {
            delete this.commentElements[commentId];
        }

        this.isDirty = true;
    }

    setCommentAnnotation(commentId: number, annotation: Annotation) {
        this.commentAnnotations[commentId] = annotation;
        this.updateDesiredPosition(commentId);
        this.isDirty = true;
    }

    setCommentHeight(commentId: number, height: number) {
        if (this.commentHeights[commentId] != height) {
            this.commentHeights[commentId] = height;
            this.isDirty = true;
        }
    }

    setPinnedComment(commentId: number | null) {
        this.pinnedComment = commentId;
        this.isDirty = true;
    }

    updateDesiredPosition(commentId: number) {
        let annotation = this.commentAnnotations[commentId];

        let sum = 0;
        let count = 0;
        for (let highlight of annotation.highlights) {
            sum += highlight.offsetTop;
            count++;
        }

        if (count == 0) {
            return;
        }

        this.commentDesiredPositions[commentId] = sum / count + OFFSET;
    }

    refresh() {
        if (!this.isDirty) {
            return;
        }

        interface Block {
            position: number;
            height: number;
            comments: number[];
            containsPinnedComment: boolean;
            pinnedCommentPosition: number;
        }

        // Build list of blocks (starting with one for each comment)
        let blocks: Block[] = [];
        for (let commentId in this.commentElements) {
            blocks.push({
                position: this.commentDesiredPositions[commentId],
                height: this.commentHeights[commentId],
                comments: [parseInt(commentId)],
                containsPinnedComment:
                    this.pinnedComment !== null &&
                    commentId == this.pinnedComment.toString(),
                pinnedCommentPosition: 0
            });
        }

        // Sort blocks
        blocks.sort((a, b) => a.position - b.position);

        // Resolve overlapping blocks
        let overlaps = true;
        while (overlaps) {
            overlaps = false;
            let newBlocks: Block[] = [];
            let previousBlock: Block | null = null;

            for (let block of blocks) {
                if (previousBlock) {
                    if (
                        previousBlock.position + previousBlock.height + GAP >
                        block.position
                    ) {
                        overlaps = true;

                        // Merge the blocks
                        previousBlock.comments.push(...block.comments);

                        if (block.containsPinnedComment) {
                            previousBlock.containsPinnedComment = true;
                            previousBlock.pinnedCommentPosition =
                                block.pinnedCommentPosition +
                                previousBlock.height;
                        }
                        previousBlock.height += block.height;

                        // Make sure comments don't disappear off the top of the page
                        // But only if a comment isn't focused
                        if (
                            !this.pinnedComment &&
                            previousBlock.position < TOP_MARGIN + OFFSET
                        ) {
                            previousBlock.position =
                                TOP_MARGIN + previousBlock.height - OFFSET;
                        }

                        // If this block contains the focused comment, position it so
                        // the focused comment is in it's desired position
                        if (
                            this.pinnedComment !== null &&
                            previousBlock.containsPinnedComment
                        ) {
                            previousBlock.position =
                                this.commentDesiredPositions[
                                    this.pinnedComment
                                ] - previousBlock.pinnedCommentPosition;
                        }

                        continue;
                    }
                }

                newBlocks.push(block);
                previousBlock = block;
            }

            blocks = newBlocks;
        }

        // Write positions
        for (let block of blocks) {
            let currentPosition = block.position;
            for (let commentId of block.comments) {
                this.commentCalculatedPositions[commentId] = currentPosition;
                currentPosition += this.commentHeights[commentId] + GAP;
            }
        }

        this.isDirty = false;
    }

    getCommentPosition(commentId: number) {
        if (commentId in this.commentCalculatedPositions) {
            return this.commentCalculatedPositions[commentId];
        } else {
            return this.commentDesiredPositions[commentId];
        }
    }
}
