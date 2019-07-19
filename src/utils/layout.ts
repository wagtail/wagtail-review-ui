import { Annotation } from './annotation';

const GAP = 20.0; // Gap between comments in pixels
const TOP_MARGIN = 100.0; // Spacing from the top to the first comment in pixels
const OFFSET = -50; // How many pixels from the annotation position should the comments be placed?

export class LayoutController {
    commentElements: Map<number, HTMLElement> = new Map();
    commentAnnotations: Map<number, Annotation> = new Map();
    commentDesiredPositions: Map<number, number> = new Map();
    commentHeights: Map<number, number> = new Map();
    pinnedComment: number | null = null;
    commentCalculatedPositions: Map<number, number> = new Map();
    isDirty: boolean = false;

    setCommentElement(commentId: number, element: HTMLElement | null) {
        if (element !== null) {
            this.commentElements.set(commentId, element);
        } else {
            this.commentElements.delete(commentId);
        }

        this.isDirty = true;
    }

    setCommentAnnotation(commentId: number, annotation: Annotation) {
        this.commentAnnotations.set(commentId, annotation);
        this.updateDesiredPosition(commentId);
        this.isDirty = true;
    }

    setCommentHeight(commentId: number, height: number) {
        if (this.commentHeights.get(commentId) != height) {
            this.commentHeights.set(commentId, height);
            this.isDirty = true;
        }
    }

    setPinnedComment(commentId: number | null) {
        this.pinnedComment = commentId;
        this.isDirty = true;
    }

    updateDesiredPosition(commentId: number) {
        let annotation = this.commentAnnotations.get(commentId);

        if (annotation.highlights.length === 0) {
            return;
        }

        // Get average position
        const sumOfPositions = annotation.highlights
            .map(highlight => {
                return (
                    highlight.getBoundingClientRect().top +
                    document.documentElement.scrollTop
                );
            })
            .reduce((sum, position) => {
                return sum + position;
            });

        const averagePosition = sumOfPositions / annotation.highlights.length;

        this.commentDesiredPositions.set(commentId, averagePosition + OFFSET);
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
        let blocks: Block[] = Array.from(this.commentElements.keys()).map(
            commentId => {
                return {
                    position: this.commentDesiredPositions.get(commentId),
                    height: this.commentHeights.get(commentId),
                    comments: [commentId],
                    containsPinnedComment:
                        this.pinnedComment !== null &&
                        commentId == this.pinnedComment,
                    pinnedCommentPosition: 0
                };
            }
        );

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
                                this.commentDesiredPositions.get(
                                    this.pinnedComment
                                ) - previousBlock.pinnedCommentPosition;
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
        blocks.forEach(block => {
            let currentPosition = block.position;
            block.comments.forEach(commentId => {
                this.commentCalculatedPositions.set(commentId, currentPosition);
                currentPosition += this.commentHeights.get(commentId) + GAP;
            });
        });

        this.isDirty = false;
    }

    getCommentPosition(commentId: number) {
        if (this.commentCalculatedPositions.has(commentId)) {
            return this.commentCalculatedPositions.get(commentId);
        } else {
            return this.commentDesiredPositions.get(commentId);
        }
    }
}
