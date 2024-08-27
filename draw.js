const main = document.getElementById("main");
const ctx = main.getContext("2d");

const origin = [0, 0];
const drawnRegister = [];
const drawnHandy = [];

const State = {
    mode: 'register',
    posDimensions: {
        width: 942,
        height: 624
    },
    mouse: [0, 0],
    drawn: drawnRegister,
    cursorColor: 'black',
    shift: false
}

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

        if(tableType && dimension) {
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

function drawGrid() {
    const step = 10;
    ctx.strokeStyle = 'lightgrey';
    for(let i = 0; i < main.width; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, main.height);
        if(i % 100 == 0) {
            ctx.strokeStyle = 'grey';
        } else {
            ctx.strokeStyle = 'lightgrey';
        }
        ctx.stroke();
    }
    for(let i = 0; i < main.height; i += step) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(main.width, i);
        if(i % 100 == 0) {
            ctx.strokeStyle = 'grey';
        } else {
            ctx.strokeStyle = 'lightgrey';
        }
        ctx.stroke();
    }

    if(State.mode == 'register') {
        drawPOSBounds();
    } else {
        // Draw origin
    }
}

function drawPOSBounds() {
    const dimensions = [942, 624];
    ctx.save();
    ctx.strokeStyle = 'black';
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(0, 0, ...dimensions);
    ctx.restore();
}

function drawCursor(x, y) {
    ctx.fillStyle = State.cursorColor;
    ctx.beginPath();
    ctx.ellipse(x, y, 3, 3, 0, 0, 7);
    ctx.fill();
}

function frame() {
    ctx.clearRect(0, 0, main.width, main.height);
    drawGrid();

    let processClick = -1;
    for(const x of State.drawn) {
        let style = {};
        if(x.selected) style = { strokeStyle: 'black' };
        if(x.isOutOfBounds() || checkForOverlaps(x)) style = { strokeStyle: 'red', lineWidth: 2 };

        x.draw(ctx, style);
        if(x.clicked) {
            processClick = x.id;
        }
    }
    if(processClick >= 0) {
        const clicked = State.drawn.find(r => r.id == processClick)
        const others = State.drawn.filter(r => r != clicked);
        clicked.connectAligned(ctx, others);
        clicked.connectNearest(ctx, others);
        clicked.almostAligned(ctx, others);
    }

    if(State.mode == 'handy') {
        const roundedPos = State.mouse.map(Util.round(5));
        drawCursor(...roundedPos);

        const [width, height, shape, count, direction] = ['setSeatWidth', 'setSeatHeight', 'setSeatShape', 'setSeatCount', 'setSeatDirection'].map(id => +Util.value(id));

        const previews = [];
        let [x, y] = roundedPos;
        for(const i of Array(count)) {
            const seat = new Seat(x, y, width, height, shape, true);
            previews.push(seat);
            if(direction) {
                x += width;
            } else {
                y += height;
            }
        }

        const isOverlapping = previews.some(checkForOverlaps);
        if(!isOverlapping) {
            previews.forEach(s => s.draw(ctx));
            State.cursorColor = 'black';
        } else if(State.drawn.some(r => r.hitTest(...roundedPos)) && State.shift) {
            State.cursorColor = 'red';
        } else {
            State.cursorColor = 'grey';
        }
    }

    window.requestAnimationFrame(frame);
}

frame();

function switchCanvas() {
    if(State.mode == 'register') {
        State.mode = 'handy'
        State.drawn = drawnHandy;
        document.querySelectorAll('[data-target="register"]').forEach(Util.hide);
        document.querySelectorAll('[data-target="handy"]').forEach(Util.unhide);
        Util.hide('previewLayout');
    } else {
        State.mode = 'register'
        State.drawn = drawnRegister;
        document.querySelectorAll('[data-target="register"]').forEach(Util.unhide);
        document.querySelectorAll('[data-target="handy"]').forEach(Util.hide);
        Util.unhide('previewLayout');
    }
}

switchCanvas();