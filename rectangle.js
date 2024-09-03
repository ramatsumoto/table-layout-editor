class Rectangle {
    static Edges = ['top', 'bottom', 'left', 'right'];
    static OppositeEdges = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left',
    }

    static opposite(edge) {
        return Rectangle.OppositeEdges[edge];
    }

    static counter = 0;

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

    get center() {
        return [this.x + this.w * 0.5, this.y + this.h * 0.5];
    }

    get top() {
        return Math.min(this.y, this.y + this.h);
    }

    get bottom() {
        return Math.max(this.y, this.y + this.h);
    }

    get left() {
        return Math.min(this.x, this.x + this.w);
    }

    get right() {
        return Math.max(this.x, this.x + this.w);
    }

    get hRange() {
        return [this.left, this.right].toSorted((a, b) => a - b);
    }

    get vRange() {
        return [this.top, this.bottom].toSorted((a, b) => a - b);
    }

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

    hitTest(mouseX, mouseY) {
        return (this.x < mouseX && mouseX < this.x + this.w) && (this.y < mouseY && mouseY < this.y + this.h);
    }

    isOverlapping(otherRectangle, includeEdges = false) {
        const dx = otherRectangle.left - this.left;
        const dy = otherRectangle.top - this.top;

        return Math2.isOverlapping(this.hRange, otherRectangle.hRange, includeEdges) && Math2.isOverlapping(this.vRange, otherRectangle.vRange, includeEdges);
    }

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

    select() {
        this.clicked = true;
    }

    unselect() {
        this.clicked = false;
        this.selected = false;
    }

    getNearest(others) {
        const near = {
            top: others.filter(other => other.bottom <= this.top).sort((a, b) => b.bottom - a.bottom),
            bottom: others.filter(other => other.top >= this.bottom).sort((a, b) => a.top - b.top),
            left: others.filter(other => other.right <= this.left).sort((a, b) => b.right - a.right),
            right: others.filter(other => other.left >= this.right).sort((a, b) => a.left - b.left)
        };

        const nearest = {
            top: near.top.filter(other => !Math2.isDisjoint(other.hRange, this.hRange))?.[0] ?? Border.MAX,
            bottom: near.bottom.filter(other => !Math2.isDisjoint(other.hRange, this.hRange))?.[0] ?? Border.MAX,
            left: near.left.filter(other => !Math2.isDisjoint(other.vRange, this.vRange))?.[0] ?? Border.MAX,
            right: near.right.filter(other => !Math2.isDisjoint(other.vRange, this.vRange))?.[0] ?? Border.MAX,
        }

        return nearest;
    }

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

    getAligned(others, threshold = 0) {
        const res = {};
        for(const edge of Rectangle.Edges) {
            res[edge] = others.filter(other => {
                const sameEdge = this[edge] == other[edge];
                const oppositeEdge = this[edge] == other[Rectangle.opposite(edge)];

                return (0 <= sameEdge && sameEdge <= threshold) || (0 <= oppositeEdge && oppositeEdge <= threshold);
            });
        }
        return res;
    }

    connectAligned(context, others) {
        for(const edge of Rectangle.Edges) {
            const aligned = others.filter(other => this[edge] == other[edge] || this[edge] == other[Rectangle.opposite(edge)]);
            if(aligned.length == 0) continue;
            
            const isVertical = edge == 'top' || edge == 'bottom';
            const sharedCoord = this[edge];

            const point = Util.axialPointPartial(!isVertical, sharedCoord);
            
            aligned.push(this);
            const ranges = isVertical ? aligned.map(r => r.hRange) : aligned.map(r => r.vRange);
            const min = ranges.map(range => range[0]).sort((a, b) => a - b)[0];
            const max = ranges.map(range => range[1]).sort((a, b) => b - a)[0];

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

    isOutOfBounds(maxWidth = +main.dataset.width, maxHeight = +main.dataset.height) {
        return this.left < 0 || this.top < 0 || this.right > maxWidth || this.bottom > maxHeight;
    }

    move(dx, dy, ignoreCollision = false, ignoreOOB = false) {
        const isOverlapping = () => checkForOverlaps(this) && !ignoreCollision;

        if(isOverlapping()) {
            return false;
        }

        this.x += dx;
        this.y += dy;

        if(isOverlapping()) {
            this.x -= dx;
            this.y -= dy;
        }

        if(!ignoreOOB) this.preventOOB();
    }

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