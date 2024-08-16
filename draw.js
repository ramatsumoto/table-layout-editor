const origin = [0, 0];
const drawn = [];

const Options = {
    table: {
        width: 100,
        height: 60,
        wConstant: 'TABLE_BUTTON_WIDTH',
        hConstant: 'TABLE_BUTTON_HEIGHT',
        color: 'orange',
        count: 0
    },
    counter: {
        width: 90,
        height: 50,
        wConstant: 'COUNTER_BUTTON_WIDTH',
        hConstant: 'COUNTER_BUTTON_HEIGHT',
        color: 'yellow',
        count: 0
    },
    bar: {
        width: 90,
        height: 53,
        wConstant: 'BAR_BUTTON_WIDTH',
        hConstant: 'BAR_BUTTON_HEIGHT',
        color: 'green',
        count: 0
    },
    togo: {
        width: 90,
        height: 50,
        wConstant: 'TOGO_BUTTON_WIDTH',
        hConstant: 'TOGO_BUTTON_HEIGHT',
        color: 'grey',
        count: 0
    }
}

function deleteFromDrawn(id) {
    const index = drawn.findIndex(r => r.id == id);
    if(index >= 0) {
        drawn.splice(index, 1);
    }
}

function updateSizes() {
    const list = document.getElementById('setDimensions');
    for(const input of list.querySelectorAll('input')) {
        const tableType = input.dataset.type;
        const dimension = input.dataset.dimension;

        if(tableType && dimension) {
            Options[tableType][dimension] = +input.value;
        }
    }

    for(const rect of drawn) {
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
}

document.getElementById('setDimensions').addEventListener('input', updateSizes);

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
}

function drawCursor(x, y) {
    if(shift) console.log('hi');
    if(canClick()) {
        ctx.fillStyle = 'black';
    } else {
        if(Seat.seats.some(seat => seat.inBounds(...mouseRounded())) && shift) {
            ctx.fillStyle = 'red';
        } else {
            ctx.fillStyle = 'grey';
        }
    }
    ctx.beginPath();
    ctx.ellipse(x, y, 3, 3, 0, 0, 7);
    ctx.fill();
}

function frame() {
    ctx.clearRect(0, 0, main.width, main.height);
    drawGrid();

    updateSizes();

    let processClick = -1;
    for(const x of drawn) {
        x.draw(ctx, x.selected ? { strokeStyle: 'black' } : {});
        if(x.clicked) {
            processClick = x.id;
        }
    }
    if(processClick >= 0) {
        const clicked = drawn.find(r => r.id == processClick)
        const others = drawn.filter(r => r != clicked);
        clicked.connectAligned(ctx, others);
        clicked.connectNearest(ctx, others);
        clicked.almostAligned(ctx, others);
    }

    window.requestAnimationFrame(frame);
}

frame();