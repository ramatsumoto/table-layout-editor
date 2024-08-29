class Rectangle {
    static SCALE = 1;
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

        return Util.isOverlapping(this.hRange, otherRectangle.hRange, includeEdges) && Util.isOverlapping(this.vRange, otherRectangle.vRange, includeEdges);
    }

    draw(context, style = {}) {
        style = { strokeStyle: 'rgba(0,0,0,0)', fillStyle: this.clicked ? 'darkGrey' : 'lightGrey', shadowOffsetX: 1, shadowOffsetY: 1, shadowColor: 'grey', showName: true, ...style };
        context.save();
        for(const prop in style) {
            context[prop] = style[prop];
        }
        const rectangle = [this.x, this.y, this.w, this.h].map(n => n * Rectangle.SCALE);
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
            top: near.top.filter(other => !Util.isDisjoint(other.hRange, this.hRange))?.[0] ?? Border.MAX,
            bottom: near.bottom.filter(other => !Util.isDisjoint(other.hRange, this.hRange))?.[0] ?? Border.MAX,
            left: near.left.filter(other => !Util.isDisjoint(other.vRange, this.vRange))?.[0] ?? Border.MAX,
            right: near.right.filter(other => !Util.isDisjoint(other.vRange, this.vRange))?.[0] ?? Border.MAX,
        }

        return nearest;
    }

    connectNearest(context, others) {
        const nearest = this.getNearest(others);

        for(const [edge, other] of Object.entries(nearest)) {
            const opposite = Util.oppositeEdges[edge];
            const isVertical = edge == 'top' || edge == 'bottom';

            const perpendicularOverlap = isVertical ?
                Util.intersection(this.hRange, other.hRange) : Util.intersection(this.vRange, other.vRange);
            const overlapMiddle = Util.average(...perpendicularOverlap);

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
            context.fillText(distance, ...point(Math.min(Util.average(start, end), start + 100)), distance);
        }

    } 

    getAligned(others, threshold = 0) {
        const res = {};
        for(const edge of Util.edges) {
            res[edge] = others.filter(other => {
                const sameEdge = this[edge] == other[edge];
                const oppositeEdge = this[edge] == other[Util.oppositeEdges[edge]];

                return (0 <= sameEdge && sameEdge <= threshold) || (0 <= oppositeEdge && oppositeEdge <= threshold);
            });
        }
        return res;
    }

    connectAligned(context, others) {
        for(const edge of Util.edges) {
            const aligned = others.filter(other => this[edge] == other[edge] || this[edge] == other[Util.oppositeEdges[edge]]);
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
        for(const edge of Util.edges) {
            const almost = others.map(r => [r, Math.abs(this[edge] - r[edge]), Math.abs(this[edge] - r[Util.oppositeEdges[edge]])])
            
            const isVertical = edge == 'top' || edge == 'bottom';

            for(const [other, sameDist, oppositeDist] of almost) {
                context.save();
                context.strokeStyle = 'blue';
                context.setLineDash([8, 8]);

                const maxLength = Math.max(main.width, main.height);
                if(0 < sameDist && sameDist <= threshold) {
                    const point = Util.axialPointPartial(!isVertical, other[edge]);
                    context.beginPath();
                    context.moveTo(...point(0));
                    context.lineTo(...point(maxLength));
                    context.stroke();
                }
                if(0 < oppositeDist && oppositeDist <= threshold) {
                    const point = Util.axialPointPartial(!isVertical, other[Util.oppositeEdges[edge]]);
                    context.beginPath();
                    context.moveTo(...point(0));
                    context.lineTo(...point(maxLength));
                    context.stroke();
                }

                context.restore();
            }
        }
    }

    isOutOfBounds(maxWidth = main.width, maxHeight = main.height) {
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
        this.x = Math.min(Math.max(0, this.x), main.width - this.w);
        this.y = Math.min(Math.max(0, this.y), main.height - this.h);
    }
}

class Border extends Rectangle {
    constructor(maxW, maxH) {
        super(0, 0, maxW, maxH);
    }

    get left() {
        return this.x + this.w;
    }

    get right() {
        return this.x;
    }

    get top() {
        return this.y + this.h;
    }

    get bottom() {
        return this.y;
    }

    static MAX = new Border(main.width, main.height);
}

class SeatButton extends Rectangle {
    static emulateFont = false;

    constructor(x, y, w, h) {
        super(x, y, w, h, true);
        this.text = '';
    }

    draw(context) {
        context.save();
        context.miterLimit = 0;
        context.beginPath();

        context.rect(this.x, this.y, this.w, this.h);
        context.clip();

        context.fillStyle = 'white';
        context.fill();
        
        context.shadowColor = 'darkgray';
        context.shadowOffsetX = 1;
        context.shadowOffsetY = 1;

        context.strokeStyle = '#F0F0F0';
        // context.strokeStyle = 'black';
        context.strokeWidth = 2;
        context.stroke();

        context.closePath();

        context.shadowColor = 'rgba(0, 0, 0, 0)';
        context.fillStyle = 'black';
        if(SeatButton.emulateFont) {
            context.textAlign = 'left';
            context.textBaseline = 'top';
            context.font = 'bold 10pt Arial';
            context.fillText(this.text.replace(/ \(\d+\)/, ''), this.left + 10, this.top + 5);
        } else {
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.font = '16px Arial';
            context.fillText(this.text, ...this.center);
        }

        context.restore();
    }
}

class Panel extends Rectangle {
    static TABLE_SPACING = 10;
    static DEFAULT_MARGIN = 3

    constructor(x, y, numTables, tableType, isVertical, { marginTop, marginBottom, marginLeft, marginRight } = { marginTop: Panel.DEFAULT_MARGIN, marginBottom: Panel.DEFAULT_MARGIN, marginLeft: Panel.DEFAULT_MARGIN, marginRight: Panel.DEFAULT_MARGIN }) {
        super(x, y, 0, 0);
        this.attachment = {
            top: [-1, y],
            left: [-1, x]
        };

        this.numTables = numTables;
        this.tableType = tableType;
        this.isVertical = isVertical;
        this.margin = {
            top: marginTop,
            bottom: marginBottom,
            left: marginLeft,
            right: marginRight
        };
        this.tableIDs = [1, this.numTables];

        this.calculateSize();
    }

    calculateSize({ width, height } = Options[this.tableType], tableSpacing = Panel.TABLE_SPACING) {
        this.w = 0;
        this.h = 0;

        this.w += this.margin.left + width + this.margin.right;
        this.h += this.margin.bottom + height + this.margin.top;

        if(this.isVertical) {
            this.h += (height + tableSpacing) * (this.numTables - 1);
        } else {
            this.w += (width + tableSpacing) * (this.numTables - 1);
        }
    }
    
    draw(context, style = {}) {
        super.draw(context, { fillStyle: Options[this.tableType].color, ...style });

        const { width, height } = Options[this.tableType]
        const table = new SeatButton(this.x, this.y, width, height);
        table.x += this.margin.left;
        table.y += this.margin.top;

        const text = Table.getRange(...this.tableIDs, true);
        for(let i = 0; i < this.numTables; i++) {
            table.text = text[i];
            table.draw(context);

            if(this.isVertical) {
                table.y += Panel.TABLE_SPACING + height;
            } else {
                table.x += Panel.TABLE_SPACING + width;
            }
        }
    }
}

class Lane extends Rectangle {
    constructor(x, y, w, h, isVertical, text) {
        super(x, y, w, h);
        this.isVertical = isVertical;
        this.text = text;
    }

    draw(context, style = {}) {
        super.draw(context, { fillStyle: '#5C8A8A', ...style });
        context.save();
        context.textAlign = 'left';
        context.font = 'bold 12pt Arial';
        context.fillStyle = 'white';
        context.textRendering = 'geometricPrecision';

        context.beginPath();
        context.rect(this.x, this.y, this.w, this.h);
        context.clip();

        if(this.isVertical) {
            context.textBaseline = 'alphabetic';
            context.translate(this.x + 8, this.y + 56);
            context.rotate(Math.PI * 0.5);
            context.fillText(this.text, 0, 0);
        } else {
            context.textBaseline = 'top';
            context.fillText(this.text, this.x + 56, this.y + 6);
        }
        context.restore();
    }
}

class Group extends Rectangle {
    static MARGIN = 3;
    static TEXT_HEIGHT = 12 * 4/3; // 12pt font is this many pixels tall
    static EXTRA_HEIGHT = Group.MARGIN * 2 + Group.TEXT_HEIGHT;

    constructor(x, y, text, tableType, panelCounts, defaultHeight, indentLeft) {
        super(x, y, 0, 0);
        this.text = text;
        this.tableType = tableType;
        this.panelCounts = panelCounts;
        this.w = Options[tableType].width * panelCounts.length + Group.MARGIN * 2;
        this.indent = indentLeft ? 'left' : 'right';
        this.defaultHeight = defaultHeight;
        this.setHeight(this.defaultHeight);
        this.tableIDs = [1, Util.sum(panelCounts)];
        this.panels = this.panelCounts.map(n => new Panel(0, 0, n, tableType, true, { marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 }));
    }

    // the necessary height to fit the largest Panel
    get minHeight() {
        return Math.max(...this.panelCounts) * (Options[this.tableType].height + Panel.TABLE_SPACING) - Panel.TABLE_SPACING;
    }

    splitTableIDs([start, end] = this.tableIDs) {
        const counts = this.panelCounts;
        return counts.map((_, i) => [
            Util.sum(counts.slice(0, i)) + start,
            Util.sum(counts.slice(0, i + 1)) + start - 1
        ]);
    }

    setHeight(height) {
        this.defaultHeight = height;
        this.h = Math.max(this.minHeight, this.defaultHeight);
        this.h += Group.EXTRA_HEIGHT;
    }

    draw(context, style = {}) {
        super.draw(context, { fillStyle: Options[this.tableType].color, ...style });
        
        const canIndent = this.h - Group.EXTRA_HEIGHT == this.defaultHeight;
        const tableIDs = this.splitTableIDs(this.tableIDs);
        for(const [i, panel] of Object.entries(this.panels)) {
            panel.x = this.x + Options[this.tableType].width * i + Group.MARGIN;
            panel.y = this.y + Group.TEXT_HEIGHT + Group.MARGIN;
            panel.tableIDs = tableIDs[i];

            const shouldIndent = (this.indent == 'left' && i == 0) || (this.indent == 'right' && i == this.panelCounts.length - 1);
            if(canIndent && shouldIndent) {
                const indentDist = this.h - (panel.h + Group.EXTRA_HEIGHT);
                panel.y += indentDist;
            }
            panel.draw(context, { showName: false, shadowColor: 'rgba(0, 0, 0, 0)' });
        }

        context.textBaseline = 'top';
        context.textAlign = 'left';
        context.font = 'bold 12pt Arial';
        context.fillStyle = 'black';
        context.textRendering = 'geometricPrecision';

        context.fillText(this.text, this.x + Group.MARGIN, this.y + Group.MARGIN);
    }
}

class Togo extends Rectangle {
    static H_SPACING = 5;
    static V_SPACING = 5;
    static MARGIN = 10;
    static EXPECTED_COUNT = 20;

    constructor(x, y, numPerRow, tableType = 'togo') {
        super(x, y, 0, 0);

        this.numPerRow = numPerRow;
        this.tableType = tableType;

        this.calculateSize();
    }

    calculateSize() {
        const { width, height } = Options[this.tableType];
        const w = this.numPerRow * width + (this.numPerRow - 1) * Togo.H_SPACING + Togo.MARGIN * 2;
        const unusedTableIDs = Table.length() - Options.table.count + Options.bar.count + Options.counter.count;
        const rows = Math.ceil(Math.max(Togo.EXPECTED_COUNT, unusedTableIDs) / this.numPerRow);
        const h = rows * height + (rows - 1) * Togo.V_SPACING + Togo.MARGIN * 2;

        this.w = w;
        this.h = h;
    }

    draw(context, style = {}) {
        const otherTables = Options.table.count + Options.bar.count + Options.counter.count;
        const count = Table.length() - otherTables;
        const names = Table.getRange(otherTables + 1, otherTables + Math.max(Togo.EXPECTED_COUNT, count));

        const { width, height } = Options[this.tableType];
        
        super.draw(context, { fillStyle: Options[this.tableType].color, ...style });

        for(let i = 0; i < Math.max(Togo.EXPECTED_COUNT, count); i++) {
            const x = this.x + (i % this.numPerRow) * (width + Togo.H_SPACING) + Togo.MARGIN;
            const y = this.y + Math.floor(i / this.numPerRow) * (height + Togo.V_SPACING) + Togo.MARGIN;
            const rect = new SeatButton(x, y, width, height);
            rect.text = names[i];

            rect.draw(context);
        }
    }
}

const Util = {
    intersection: ([min1, max1], [min2, max2]) => [Math.max(min1, min2), Math.min(max1, max2)],
    isDisjoint: ([min1, max1], [min2, max2]) => (max1 < min2) || (max2 < min1),
    isOverlapping: (range1, range2, closed = false) => !Util.isDisjoint(range1, range2) && (new Set(Util.intersection(range1, range2)).size != 1 || closed),
    sum: (arr) => arr.reduce((a, b) => a + b, 0),
    average: (...n) => Util.sum(n) / n.length,
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
    deleteChildren: (element) => {
        while(element.hasChildNodes()) element.lastChild.remove();    
    },
    get: (idOrElem) => {
        let e = idOrElem;
        if(typeof idOrElem == 'string') {
            e = document.getElementById(idOrElem);
        }
        if(e.parentElement.tagName.toUpperCase() == 'LABEL') {
            return e.parentElement;
        } else {
            return e;
        }
    },
    hide: (idOrElem) => Util.get(idOrElem).classList.add('hidden'),
    unhide: (idOrElem) => Util.get(idOrElem).classList.remove('hidden'),
    value: (id) => document.getElementById(id).value,
    fireInputEvent: (id) => document.getElementById(id).dispatchEvent(new InputEvent('input')),
    round: (k) => n => Math.round(n / k) * k,
    arrEquals: (arr1, arr2) => arr1.every((x, i) => x == arr2[i]),
}