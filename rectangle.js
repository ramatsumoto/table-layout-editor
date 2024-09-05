/**
 * The base class for all the elements drawn on to the canvas.
 * 
 * Establishes positioning and movement methods, as well as how to draw itself.
 */
class Rectangle {
    /** Defines the names of the edges of a rectangle, as well as a canonical ordering. */
    static Edges = ['top', 'bottom', 'left', 'right'];
    static OppositeEdges = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left',
    }

    /**
     * Returns the edge opposite to the given `edge`. Used for distance calculations between rectangles.
     * @param {string} edge top, bottom, left, or right.
     * @returns The edge opposite to `edge`.
     */
    static opposite(edge) {
        return Rectangle.OppositeEdges[edge];
    }

    static counter = 0;

    /**
     * Create a basic rectangle.
     * @param {number} x The x-coordinate of `this` rectangle's top left corner.
     * @param {number} y The y-coordinate of `this` rectangle's top left corner.
     * @param {number} w The width of `this` rectangle. How far it extends to the right.
     * @param {number} h The height of `this rectangle. How far it extends downards.
     * @param {boolean} temporary Set to `true` to if `this` instance is not intended to persist. 
     */
    constructor(x, y, w, h, temporary = false) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        if(!temporary) {
            this.id = Rectangle.counter++;
            this.name = `table` + this.id;
        }
        this.clicked = false;
        this.selected = false;
    }

    /**
     * Get the coordinates of the center of `this` rectangle.
     * @returns {number[]} The x and y values of the center.
     */
    get center() {
        return [this.x + this.w * 0.5, this.y + this.h * 0.5];
    }

    /**
     * Get the y-coordinate of the upper edge of `this` rectangle.
     * @returns {number} The y value of the top edge.
     */
    get top() {
        return Math.min(this.y, this.y + this.h);
    }

    /**
     * Get the y-coordinate of the lower edge of `this` rectangle.
     * @returns {number} The y value of the bottom edge.
     */
    get bottom() {
        return Math.max(this.y, this.y + this.h);
    }

    /**
     * Get the x-coordinate of the leftmost edge of `this` rectangle.
     * @returns {number} The x value of the left edge.
     */
    get left() {
        return Math.min(this.x, this.x + this.w);
    }

    /**
     * Get the x-coordinate of the rightmost edge of `this` rectangle.
     * @returns {number} The x value of the right edge.
     */
    get right() {
        return Math.max(this.x, this.x + this.w);
    }

    /**
     * Get the minimum and maximum x-coordinates of `this` rectangle.
     * @returns {number[]} The min and max x values in this form: `[min, max]`.
     */
    get hRange() {
        return [this.left, this.right].toSorted((a, b) => a - b);
    }


    /**
     * Get the minimum and maximum y-coordinates of `this` rectangle.
     * @return {number[]} The min and max y values in this form: `[min, max]`.
     */
    get vRange() {
        return [this.top, this.bottom].toSorted((a, b) => a - b);
    }

    /**
     * Moves `this` rectangle such that `edge` is located at the given `value`.
     * @param {string} edge One of `this` rectangle's edges. See {@link Rectangle.Edges}.
     * @param {number} value The coordinate to move to
     */
    setEdge(edge, value) {
        switch(edge) {
            case 'left':
                this.x = value;
                break;
            case 'right':
                this.x = value - this.w;
                break;
            case 'top':
                this.y = value;
                break;
            case 'bottom':
                this.y = value - this.h;
                break;
            default:
                console.warn(`Cannot set edge '${edge}'`);
                break;
        }
    }

    /**
     * Checks if the given x and y values would be over this rectangle.
     * @param {number} mouseX The x-coordinate to test with
     * @param {number} mouseY The y-coordinate to test with
     * @returns `true` if `(mouseX, mouseY)` is contained within `this` rectangle, `false` otherwise.
     */
    hitTest(mouseX, mouseY) {
        return (this.x < mouseX && mouseX < this.x + this.w) && (this.y < mouseY && mouseY < this.y + this.h);
    }

    /**
     * Checks if `this` rectangle overlaps with the `otherRectangle`.
     * @param {Rectangle} otherRectangle The other rectangle to test against
     * @param {boolean} includeEdges Set to `true` to judge adjacent edges as overlapping.
     * @returns `true` if `this` rectangle overlaps at all with `otherRectangle`, `false` otherwise.
     */
    isOverlapping(otherRectangle, includeEdges = false) {
        return Math2.isOverlapping(this.hRange, otherRectangle.hRange, includeEdges) && Math2.isOverlapping(this.vRange, otherRectangle.vRange, includeEdges);
    }

    /**
     * Draws `this` rectangle to the given canvas `context`.
     * 
     * Is to be overridden to add extra details for subclasses of `Rectangle`.
     * @param {CanvasRenderingContext2D} context The context of the canvas to draw onto
     * @param {Object} style An object defining the properties to be applied to `context`, such as its `fillStyle`, `shadowColor`, etc.
     */
    draw(context, style = {}) {
        style = { strokeStyle: 'rgba(0,0,0,0)', fillStyle: this.clicked ? 'darkGrey' : 'lightGrey', shadowOffsetX: 1, shadowOffsetY: 1, shadowColor: 'grey', showName: true, ...style };
        context.save();
        for(const prop in style) {
            context[prop] = style[prop];
        }
        const rectangle = [this.x, this.y, this.w, this.h];
        context.fillRect(...rectangle);
        context.strokeRect(...rectangle);

        if(style.showName) {
            context.textAlign = 'center';
            context.textBaseline = 'bottom';
            context.fillStyle = this.clicked ? 'black' : 'rgba(0, 0, 0, 0.5)';
            context.font = '16px monospace';
            context.fillText(this.name ?? '', this.center[0], this.top);
        }
        context.restore();
    }

    /** Shorthand method for marking `this` as no longer being selected or clicked. */
    unselect() {
        this.clicked = false;
        this.selected = false;
    }

    /**
     * Gets the rectangle closest to each edge of `this` (see {@link Rectangle.Edges}).
     * 
     * A rectangle must some horizontal or vertical overlap with `this` to be considered "near".
     * 
     * @param {Rectangle[]} others The set of other `Rectangle`s to consider
     * @returns An object containing the `Rectangle` closest to each edge of `this`. If no such `Rectangle` exists, it instead returns `Border.MAX`.
     */
    getNearest(others) {
        const near = {
            top: Math2.min(others.filter(other => other.bottom <= this.top), rect => rect.bottom),
            bottom: Math2.max(others.filter(other => other.top >= this.bottom), rect => rect.top),
            left: Math2.min(others.filter(other => other.right <= this.left), rect => rect.right),
            right: Math2.max(others.filter(other => other.left >= this.right), rect => rect.left)
        };

        const nearest = {
            top: near.top.filter(other => !Math2.isDisjoint(other.hRange, this.hRange))?.[0] ?? Border.MAX,
            bottom: near.bottom.filter(other => !Math2.isDisjoint(other.hRange, this.hRange))?.[0] ?? Border.MAX,
            left: near.left.filter(other => !Math2.isDisjoint(other.vRange, this.vRange))?.[0] ?? Border.MAX,
            right: near.right.filter(other => !Math2.isDisjoint(other.vRange, this.vRange))?.[0] ?? Border.MAX,
        }

        return nearest;
    }

    /**
     * Draws four lines connecting `this` to the rectangles each edge is closest to.
     * @see {@link Rectangle.getNearest}
     * @param {CanvasRenderingContext2D} context The canvas context to draw to
     * @param {Rectangle[]} others The set of other `Rectangle`s to consider and draw to
     */
    connectNearest(context, others) {
        const nearest = this.getNearest(others);

        for(const [edge, other] of Object.entries(nearest)) {
            const opposite = Rectangle.opposite(edge);
            const isVertical = edge == 'top' || edge == 'bottom';

            const perpendicularOverlap = isVertical ?
                Math2.intersection(this.hRange, other.hRange) : Math2.intersection(this.vRange, other.vRange);
            const overlapMiddle = Math2.average(...perpendicularOverlap);

            const point = Util.axialPointPartial(isVertical, overlapMiddle);

            const [start, end] = [this[edge], other[opposite]];
            const distance = Math.abs(start - end);
            
            context.beginPath();
            context.strokeStyle = 'red';
            context.moveTo(...point(start));
            context.lineTo(...point(end));
            context.stroke();

            if(distance < 10) continue;

            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillStyle = 'black';
            context.font = '16px monospace';
            context.fillText(Math.round(distance), ...point(Math.min(Math2.average(start, end), start + 100)), distance);
        }

    } 

    /**
     * Draws a solid line between any edge of `this` that shares the same value as another `Rectangle`.
     * 
     * If `this.left() == other.left()` or `this.left() == other.right()`, then `this` and `other` are 
     * considered to be 'aligned'.
     * @param {CanvasRenderingContext2D} context The canvas context to draw to
     * @param {Rectangle[]} others The set of other `Rectangles` to consider and draw to
     */
    connectAligned(context, others) {
        for(const edge of Rectangle.Edges) {
            const aligned = others.filter(other => this[edge] == other[edge] || this[edge] == other[Rectangle.opposite(edge)]);
            if(aligned.length == 0) continue;
            
            const isVertical = edge == 'top' || edge == 'bottom';
            const sharedCoord = this[edge];

            const point = Util.axialPointPartial(!isVertical, sharedCoord);
            
            aligned.push(this);
            const ranges = isVertical ? aligned.map(r => r.hRange) : aligned.map(r => r.vRange);
            const min = Math.min(...ranges.map(range => range[0]));
            const max = Math.max(...ranges.map(range => range[1]));

            context.beginPath();
            context.strokeStyle = 'blue';
            context.save();
            context.globalCompositionOperation = 'lighten';
            context.moveTo(...point(min));
            context.lineTo(...point(max));
            context.stroke();
            context.restore();
        }
    }

    /**
     * Draws a dotted line between any edge of `this` that is almost aligned with another `Rectangle`.
     * @see {@link Rectangle.connectAligned}
     * @param {CanvasRenderingContext2D} context The canvas context to draw to
     * @param {Rectangle[]} others The set of other `Rectangle`s to consider and draw to
     * @param {number} threshold The maximum distance between edges to be 'almost aligned'.
     */
    almostAligned(context, others, threshold = 10) {
        for(const edge of Rectangle.Edges) {
            const almost = others.map(r => [r, Math.abs(this[edge] - r[edge]), Math.abs(this[edge] - r[Rectangle.opposite(edge)])])
            
            const isVertical = edge == 'top' || edge == 'bottom';

            for(const [other, sameDist, oppositeDist] of almost) {
                context.save();
                context.strokeStyle = 'blue';
                context.setLineDash([8, 8]);

                const maxLength = Math.max(+main.dataset.width, +main.dataset.height);
                if(0 < sameDist && sameDist <= threshold) {
                    const point = Util.axialPointPartial(!isVertical, other[edge]);
                    context.beginPath();
                    context.moveTo(...point(0));
                    context.lineTo(...point(maxLength));
                    context.stroke();
                }
                if(0 < oppositeDist && oppositeDist <= threshold) {
                    const point = Util.axialPointPartial(!isVertical, other[Rectangle.opposite(edge)]);
                    context.beginPath();
                    context.moveTo(...point(0));
                    context.lineTo(...point(maxLength));
                    context.stroke();
                }

                context.restore();
            }
        }
    }

    /**
     * Checks if `this` is out of bounds.
     * @param {number} maxWidth The maximum x value. Defaults to canvas width
     * @param {number} maxHeight The maximum y value. Defaults to canvas height
     * @returns `true` if `this` is not fully between `(0, 0)` and `(maxWidth, maxHeight)`, `false` otherwise
     */
    isOutOfBounds(maxWidth = +main.dataset.width, maxHeight = +main.dataset.height) {
        return this.left < 0 || this.top < 0 || this.right > maxWidth || this.bottom > maxHeight;
    }

    /**
     * Moves `this` by `(dx, dy)`. If the movement would lead to `this` overlapping 
     * with another `Rectangle` or being out of bounds, then no movement will happen.
     * @param {number} dx The change in x value
     * @param {number} dy The change in y value
     * @param {boolean} ignoreCollision Set to `true` to ignore other `Rectangle`s
     * @param {boolean} ignoreOOB Set to `true` to ignore the bounds of the canvas
     */
    move(dx, dy, ignoreCollision = false, ignoreOOB = false) {
        const isOverlapping = () => checkForOverlaps(this) && !ignoreCollision;

        if(isOverlapping()) {
            return ;
        }

        this.x += dx;
        this.y += dy;

        if(isOverlapping()) {
            this.x -= dx;
            this.y -= dy;
        }

        if(!ignoreOOB) this.preventOOB();
    }

    /**
     * Forces `this` to be in bounds.
     */
    preventOOB() {
        this.x = Math2.clamp(0, this.x, +main.dataset.width - this.w);
        this.y = Math2.clamp(0, this.y, +main.dataset.height - this.h);
    }
}

const Util = {
    // intersection: ([min1, max1], [min2, max2]) => [Math.max(min1, min2), Math.min(max1, max2)],
    // isDisjoint: ([min1, max1], [min2, max2]) => (max1 < min2) || (max2 < min1),
    // isOverlapping: (range1, range2, closed = false) => !Math2.isDisjoint(range1, range2) && (new Set(Math2.intersection(range1, range2)).size != 1 || closed),
    // sum: (arr) => arr.reduce((a, b) => a + b, 0),
    // average: (...n) => Math2.sum(n) / n.length,
    edges: ['top', 'bottom', 'left', 'right'],
    oppositeEdges: {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left'
    },
    // Use this to generate a function that creates points along a given axis
    axialPointPartial: (vertical, staticCoord) => vertical ?
        (y) => [staticCoord, y] : (x) => [x, staticCoord],
    // deleteChildren: (element) => {
    //     while(element.hasChildNodes()) element.lastChild.remove();    
    // },
    // get: (idOrElem) => {
    //     let e = idOrElem;
    //     if(typeof idOrElem == 'string') {
    //         e = document.getElementById(idOrElem);
    //     }
    //     if(e.parentElement.tagName.toUpperCase() == 'LABEL') {
    //         return e.parentElement;
    //     } else {
    //         return e;
    //     }
    // },
    // hide: (idOrElem) => Util.get(idOrElem).classList.add('hidden'),
    // unhide: (idOrElem) => Util.get(idOrElem).classList.remove('hidden'),
    // value: (id) => document.getElementById(id).value,
    // fireInputEvent: (id) => document.getElementById(id).dispatchEvent(new InputEvent('input')),
    // round: (k) => n => Math.round(n / k) * k,
    arrEquals: (arr1, arr2) => arr1.every((x, i) => x == arr2[i]),
}