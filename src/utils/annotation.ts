let annotator: any = require('annotator');

import './annotator.scss';

export interface Range {
    start: string;
    startOffset: number;
    end: string;
    endOffset: number;
}

export interface AnnotationInfo {
    quote: string;
    ranges: Range[];
}

export interface Annotation {
    contentPath: string;
    annotation: AnnotationInfo;
    highlights: HTMLElement[];
    onDelete(): void;
    onFocus(): void;
    onUnfocus(): void;
    show(): void;
    hide(): void;
    setOnClickHandler: (handler: any) => void;
}

// trim strips whitespace from either end of a string.
//
// This usually exists in native code, but not in IE8.
function trim(s: string): string {
    if (typeof String.prototype.trim === 'function') {
        return String.prototype.trim.call(s);
    } else {
        return s.replace(/^[\s\xA0]+|[\s\xA0]+$/g, '');
    }
}

// annotationFactory returns a function that can be used to construct an
// annotation from a list of selected ranges.
function annotationFactory(
    contextEl: HTMLElement,
    ignoreSelector: string
): (ranges: any[]) => AnnotationInfo {
    return function(ranges: any[]) {
        var text = [],
            serializedRanges: Range[] = [];

        for (var i = 0, len = ranges.length; i < len; i++) {
            var r = ranges[i];
            text.push(trim(r.text()));
            serializedRanges.push(r.serialize(contextEl, ignoreSelector));
        }

        return {
            quote: text.join(' / '),
            ranges: serializedRanges
        };
    };
}

export class AnnotatableSection {
    contentPath: string;
    element: HTMLElement;
    highlighter: any;
    makeAnnotation: (ranges: any[]) => AnnotationInfo;
    adder: any;
    selector: any;

    constructor(
        contentPath: string,
        element: HTMLElement,
        onNewComment: (annotation: Annotation) => void,
        selectionEnabled: () => boolean
    ) {
        this.contentPath = contentPath;
        this.element = element;

        this.highlighter = new annotator.ui.highlighter.Highlighter(element);
        this.makeAnnotation = annotationFactory(element, '.annotator-hl');
        this.adder = new annotator.ui.adder.Adder({
            onCreate: (annotationInfo: AnnotationInfo) => {
                let highlights = this.highlighter.draw(annotationInfo);
                onNewComment(this.addAnnotation(annotationInfo, highlights));
            }
        });
        this.adder.attach();

        this.selector = new annotator.ui.textselector.TextSelector(element, {
            onSelection: (ranges: any[], event: any) => {
                if (ranges.length > 0 && selectionEnabled()) {
                    let annotation = this.makeAnnotation(ranges);
                    let interactionPoint = annotator.util.mousePosition(event);
                    this.adder.load(annotation, interactionPoint);
                } else {
                    this.adder.hide();
                }
            }
        });
    }

    addAnnotation(
        annotationInfo: AnnotationInfo,
        highlights?: HTMLElement[]
    ): Annotation {
        // Draw highlights if they don't exist yet
        if (!highlights) {
            highlights = this.highlighter.draw(annotationInfo);
        }

        // Hide by default
        for (let highlight of highlights) {
            highlight.classList.add('annotator-hl--hidden');
        }

        // This is called when this comment is deleted by a used
        let onDelete = () => {
            this.highlighter.undraw(annotationInfo);
        };

        // These two are called by main.tsx when the corresponding comment has been focused/unfocused
        let onFocus = () => {
            for (let highlight of highlights) {
                highlight.classList.add('annotator-hl--focused');
            }
        };

        let onUnfocus = () => {
            for (let highlight of highlights) {
                highlight.classList.remove('annotator-hl--focused');
            }
        };

        // This is called to register a callback so the corresponding comment can be focused when the highlight is clicked
        let setOnClickHandler = (
            handler: (this: GlobalEventHandlers, ev: MouseEvent) => any
        ) => {
            for (let highlight of highlights) {
                highlight.onclick = handler;
            }
        };

        // These are called whenever the comments are mounted/unmounted from the DOM
        let show = () => {
            for (let highlight of highlights) {
                highlight.classList.remove('annotator-hl--hidden');
            }
        };

        let hide = () => {
            for (let highlight of highlights) {
                highlight.classList.add('annotator-hl--hidden');
            }
        };

        return {
            contentPath: this.contentPath,
            annotation: annotationInfo,
            highlights,
            onDelete,
            onFocus,
            onUnfocus,
            setOnClickHandler,
            show,
            hide
        };
    }
}
