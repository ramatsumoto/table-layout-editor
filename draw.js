const main = document.getElementById("main");
const ctx = main.getContext("2d");
/** @type {Rectangle[]} */
const drawnRegister = [];
/** @type {Rectangle[]} */
const drawnHandy = [];

Border.MAX = new Border(main.width, main.height);

/**
 * Object that manages the state of the program.
 */
const State = {
    /** 
     * Sets the mode of the program.
     * @see {@link switchCanvas}
     */
    mode: 'register',
    /**
     * Describes how the size of the POS Register program.
     * 
     * Used to draw to dotted bounds in `register` mode.
     */
    posDimensions: {
        width: 942,
        height: 624
    },
    /** The position of the mouse relative to the top left corner of canvas. */
    mouse: [0, 0],
    /** The `Rectangle`s currently being drawn. @see {@link State.mode} */
    drawn: drawnRegister,
    /** `true` if the shift key is being pressed. */
    shift: false,
    /** @type {Set<number>} The set of IDs of rectangles that are clicked on/selected. */
    clicked: new Set(),
    /** The `Rectangle` used as the blue selection rectangle thing for when you click and drag. */
    selector: new Rectangle(0, 0, 0, 0, true),
    /** @returns {Rectangle[]} Gets the currently clicked Rectangles. */
    getClicked: () => State.drawn.filter(r => State.clicked.has(r.id)),
    /** The scale/zoom factor of the canvas in the two modes. @see {@link setScale} */
    scale: {
        register: 1,
        handy: 0.8
    },
}

/**
 * Describes variables to be used for creating the .java class file.
 * 
 * Contains the dimensions, color, and count of each table type.
 */
const Options = {
    table: {
        width: 100,
        height: 60,
        wConstant: 'TABLE_BUTTON_WIDTH',
        hConstant: 'TABLE_BUTTON_HEIGHT',
        color: '#ffa500',
        count: 0
    },
    counter: {
        width: 90,
        height: 50,
        wConstant: 'COUNTER_BUTTON_WIDTH',
        hConstant: 'COUNTER_BUTTON_HEIGHT',
        color: '#ffff00',
        count: 0
    },
    bar: {
        width: 90,
        height: 53,
        wConstant: 'BAR_BUTTON_WIDTH',
        hConstant: 'BAR_BUTTON_HEIGHT',
        color: '#008000',
        count: 0
    },
    togo: {
        width: 90,
        height: 50,
        wConstant: 'TOGO_BUTTON_WIDTH',
        hConstant: 'TOGO_BUTTON_HEIGHT',
        color: '#F5FAF5',
        count: 0
    }
}

/**
 * Deletes the `Rectangle` with the given `id`.
 * @param {number} id The ID of the `Rectangle` to remove
 */
function deleteFromDrawn(id) {
    const index = State.drawn.findIndex(r => r.id == id);
    if(index >= 0) {
        State.drawn.splice(index, 1);
    }
}

function updateOptions(e) {
    const list = document.getElementById('setDimensions');
    for(const input of list.querySelectorAll('input')) {
        const tableType = input.dataset.type;
        const dimension = input.dataset.dimension;

        if(tableType && dimension && input.dataset.target == 'register') {
            if(dimension == 'color') {
                Options[tableType][dimension] = input.value;
            } else {
                Options[tableType][dimension] = +input.value;
            }
        }
    }

    for(const rect of State.drawn) {
        if(rect instanceof Panel) {
            rect.calculateSize();
        }
        if(rect instanceof Group) {
            rect.setHeight(rect.defaultHeight);
        }
        if(rect instanceof Togo) {
            rect.calculateSize();
        }
    }

    canvasHasChanged();
}
document.getElementById('setDimensions').addEventListener('input', updateOptions);

/** Draws the background gridlines */
function drawGrid() {
    const step = 10;
    ctx.strokeStyle = 'lightgrey';
    const [w, h] = [+main.dataset.width, +main.dataset.height];
    for(let i = 0; i < w; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        if(i % 100 == 0) {
            ctx.strokeStyle = 'grey';
        } else {
            ctx.strokeStyle = 'lightgrey';
        }
        ctx.stroke();
    }
    for(let i = 0; i < h; i += step) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        if(i % 100 == 0) {
            ctx.strokeStyle = 'grey';
        } else {
            ctx.strokeStyle = 'lightgrey';
        }
        ctx.stroke();
    }

    if(State.mode == 'register') {
        drawPOSBounds();
    }
}

/** Draws the rectangle describing the screen size of a POS register. @see {@link State.posDimensions} */
function drawPOSBounds() {
    const dimensions = [942, 624];
    ctx.save();
    ctx.strokeStyle = 'black';
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(0, 0, ...dimensions);
    ctx.restore();
}

/** Draws everything to canvas. */
function frame() {
    ctx.clearRect(0, 0, +main.dataset.width, +main.dataset.height);
    drawGrid();

    for(const rectangle of State.drawn) {
        let style = {};
        if(rectangle.selected) style = { strokeStyle: 'green' };
        if(rectangle.isOutOfBounds() || checkForOverlaps(rectangle)) style = { strokeStyle: 'red', lineWidth: 2 };

        rectangle.draw(ctx, style);
    }

    if(State.clicked.size == 1) {
        const clicked = State.getClicked()[0];
        const others = State.drawn.filter(r => r != clicked);
        clicked.connectAligned(ctx, others);
        clicked.connectNearest(ctx, others);
        clicked.almostAligned(ctx, others);

    } else if(State.clicked.size > 1) {
        const clicked = State.getClicked();
        const x = Math2.min(clicked, rect => rect.left).left;
        const y = Math2.min(clicked, rect => rect.top).top;
        // Create the minimal rectangle containing all clicked rectangles.
        const bounding = new Rectangle(
            x,
            y,
            Math2.max(clicked, rect => rect.right).right - x,
            Math2.max(clicked, rect => rect.bottom).bottom - y,
            true
        );

        const others = State.drawn.filter(r => !State.clicked.has(r.id));
        bounding.draw(ctx, { fillStyle: 'rgba(0,0,0,0)', strokeStyle: 'darkgrey'});
        bounding.connectAligned(ctx, others);
        bounding.connectNearest(ctx, others);
        bounding.almostAligned(ctx, others);
    }

    if(State.mode == 'handy' && State.shift) {
        const ids = ['setSeatWidth', 'setSeatHeight', 'setSeatShape'];
        const preview = new Seat(...State.mouse.map(Math2.roundTo(5)), ...ids.map(Elements.valueAsNum), true);
        if(!checkForOverlaps(preview)) {
            preview.draw(ctx);
        }
    }

    State.selector.draw(ctx, { fillStyle: 'rgba(0, 100, 200, 0.3)', strokeStyle: 'rgba(0, 120, 255, 0.8)' });

    window.requestAnimationFrame(frame);
}

frame();

/** Changes the canvas scaling of the current mode. */
function setScale(k) {
    main.setAttribute('width', +main.dataset.width * k);
    main.setAttribute('height', +main.dataset.height * k);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    State.scale[State.mode] = k;
}

const zoomInput = document.getElementById('canvasZoom');
document.getElementById('canvasZoomOut').addEventListener('click', e => {
    zoomInput.value -= 10;
    Elements.fireInputEvent(zoomInput.id);
});
document.getElementById('canvasZoomIn').addEventListener('click', e => {
    zoomInput.value = +zoomInput.value + 10;
    Elements.fireInputEvent(zoomInput.id);
});
zoomInput.addEventListener('input', e => {
    setScale(+e.target.value / 100);
});

/** Switches the program mode between `register` and `handy`. */
function switchCanvas() {
    if(State.mode == 'register') {
        State.mode = 'handy'
        State.drawn = drawnHandy;
        document.querySelectorAll('[data-target="register"]').forEach(Elements.hide);
        document.querySelectorAll('[data-target="handy"]').forEach(Elements.unhide);
        Elements.hide('previewLayout');
        document.getElementById('canvasToggle').innerText = 'Switch to Register layout';
        setScale(State.scale.handy);
        zoomInput.value = State.scale.handy * 100;
    } else {
        State.mode = 'register'
        State.drawn = drawnRegister;
        document.querySelectorAll('[data-target="register"]').forEach(Elements.unhide);
        document.querySelectorAll('[data-target="handy"]').forEach(Elements.hide);
        Elements.unhide('previewLayout');
        document.getElementById('canvasToggle').innerText = 'Switch to Handy layout';
        setScale(State.scale.register);
        zoomInput.value = State.scale.register * 100;
    }
}

switchCanvas();
switchCanvas();

