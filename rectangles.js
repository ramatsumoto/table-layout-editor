/**
 * The class to with its edges 'inverted'.
 * 
 * Used to describe the bounds of the canvas.
 * 
 * Should have no members besides `MAX`, which is created after the canvas is intialized.
 */
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
}

/**
 * A class representing individual seats in the Register layout.
 * 
 * Only for drawing purposes, and cannot be created by the user.
 * 
 * @see {@link Panel.draw}
 * @see {@link Group.draw}
 * @see {@link Togo.draw}
 */
class SeatButton extends Rectangle {
    /**
     * Set to `true` to emulate the font of the actual POS Registers.
     * 
     * Used for generating previews.
     */
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

/**
 * The class representing the Panel created by `getTableRowPanel` in the java file.
 * 
 * A single line of `SeatButtons`.
 */
class Panel extends Rectangle {
    static TABLE_SPACING = 10;
    static DEFAULT_MARGIN = 3

    constructor(x, y, numTables, tableType, isVertical, { marginTop, marginBottom, marginLeft, marginRight } = { marginTop: Panel.DEFAULT_MARGIN, marginBottom: Panel.DEFAULT_MARGIN, marginLeft: Panel.DEFAULT_MARGIN, marginRight: Panel.DEFAULT_MARGIN }) {
        super(x, y, 0, 0);

        /** The number of tables/seats `this` will have. */
        this.numTables = numTables;
        /** Describes the size of the individual `SeatButtons` as well the border color of `this`. */
        this.tableType = tableType;
        this.isVertical = isVertical;
        this.margin = {
            top: marginTop,
            bottom: marginBottom,
            left: marginLeft,
            right: marginRight
        };
        /** The `table_seating` IDs of `this` panel's tables. @see {@link Table} */
        this.tableIDs = [1, this.numTables];

        this.calculateSize();
    }

    /**
     * Calculate the width and height of `this` based off of the given dimensions and spacing of the tables.
     * @param {Object} param0 The width and height of the tables in `this`.
     * @param {number} tableSpacing The spacing between each table.
     */
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

/**
 * A rectangle with text in it.
 */
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

/**
 * A set of {@linkcode Panel}s grouped together, with a title at the top.
 * 
 * Used to emulate how counter areas are represented in the POS Register.
 * 
 * Can only be aligned vertically.
 */
class Group extends Rectangle {
    static MARGIN = 3;
    static TEXT_HEIGHT = 12 * 4/3; // 12pt font is this many pixels tall
    /** The height inherent to `Group`s that are not created by {@linkcode Panel}s */
    static EXTRA_HEIGHT = Group.MARGIN * 2 + Group.TEXT_HEIGHT;

    constructor(x, y, text, tableType, panelCounts, defaultHeight, indentLeft) {
        super(x, y, 0, 0);
        this.text = text;
        this.tableType = tableType;
        /** @type {number} The number of {@linkcode Panel}s contained in `this`. */
        this.panelCounts = panelCounts;
        this.w = Options[tableType].width * panelCounts.length + Group.MARGIN * 2;
        /** Defines which panel should be vertically indented */
        this.indent = indentLeft ? 'left' : 'right';
        /** The 'suggested' height. Not necessarily the actual height of `this`. */
        this.defaultHeight = defaultHeight;
        this.setHeight(this.defaultHeight);
        /**
         * The bounds of the `table_seating` IDs of the {@linkcode Panel}s of `this`.
         * 
         * @see {@link Panel.tableIDs}
         */
        this.tableIDs = [1, Math2.sum(panelCounts)];
        /** The {@linkcode Panel}s contained in `this`. */
        this.panels = this.panelCounts.map(n => new Panel(0, 0, n, tableType, true, { marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 }));
    }

    /** The height required to fit the largest (longest) {@linkcode Panel}.  */
    get minHeight() {
        return Math.max(...this.panelCounts) * (Options[this.tableType].height + Panel.TABLE_SPACING) - Panel.TABLE_SPACING;
    }

    /**
     * Converts a pair of tableIDs to list of pairs of tableIDs, to be used for the {@linkcode Panel}s in `this`.
     * @param {number[]} param0 {@link Group.tableIDs}
     * @returns {number[][]} A list of tableIDs. See {@link Panel.tableIDs}
     */
    splitTableIDs([start, end] = this.tableIDs) {
        const counts = this.panelCounts;
        return counts.map((_, i) => [
            Math2.sum(counts.slice(0, i)) + start,
            Math2.sum(counts.slice(0, i + 1)) + start - 1
        ]);
    }

    /**
     * Changes the height of `this` to `height`, if possible.
     * 
     * If `height` would not accomodate for the Panels in `this`, the height will not change.
     * 
     * @see {@link Group.minHeight}
     * @param {number} height The given height to set
     */
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

/**
 * A block of To-go tables.
 */
class Togo extends Rectangle {
    static H_SPACING = 5;
    static V_SPACING = 5;
    static MARGIN = 10;
    static EXPECTED_COUNT = 20;

    constructor(x, y, numPerRow, tableType = 'togo') {
        super(x, y, 0, 0);

        /** The number of seats per row */
        this.numPerRow = numPerRow;
        this.tableType = tableType;

        this.calculateSize();
    }

    /**
     * Calculates the size of needed to fit all the togo tables.
     * 
     * The number of togo tables is dictated by how many rows of `table_seating` aren't used.
     * 
     * @see {@link Table}
     * @see {@link Options}
     */
    calculateSize() {
        const { width, height } = Options[this.tableType];
        const w = this.numPerRow * width + (this.numPerRow - 1) * Togo.H_SPACING + Togo.MARGIN * 2;
        const unusedTableIDs = Table.length() - (Options.table.count + Options.bar.count + Options.counter.count);
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