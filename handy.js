class Seat extends Rectangle {
    constructor(x, y, w, h, shape, temp = false) {
        super(x, y, w, h, temp);
        this.shape = shape;
        this.temp = temp;
        this.tableID = 1;
    }

    draw(context, style = {}) {
        context.save();
        context.beginPath();
        context.fillStyle = 'white';
        context.strokeStyle = this.selected ? 'green' : 'black';
        context.strokeWidth = 2;
        
        for(const prop in style) {
            context[prop] = style[prop];
        }

        const [x, y, w ,h] = [this.x, this.y, this.w, this.h];

        if(this.shape == 0) {
            context.rect(x, y, w, h);
        } else {
            context.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
        }

        if(this.temp) {
            context.clip();
            context.stroke();
            context.restore();
            return;
        }
        context.fill();
        context.stroke();

        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = '12pt Arial';
        context.fillStyle = 'black';
        context.fillText(Table.get(this.tableID, true), ...this.center);

        context.restore();
    }

    multiply(rows, cols, temp = false) {
        const seats = [];
        for(const i of Array(rows).keys()) {
            for(const j of Array(cols).keys()) {
                const seat = new Seat(this.x + j * this.w, this.y + i * this.h, this.w, this.h, this.shape, temp);
                seats.push(seat);
            }
        }
        return seats;
    }
}

document.getElementById('setSeatPreset').addEventListener('change', e => {
    const preset = e.target.value;
    const inputs = [...document.querySelectorAll('dl#setDimensions input')].filter(i => i.dataset.target == 'handy');

    const w = inputs.find(i => i.dataset.type == preset && i.dataset.dimension == 'width');
    const h = inputs.find(i => i.dataset.type == preset && i.dataset.dimension == 'height');
    if(!w || !h) {
        return ;
    }
    const shape = (preset == 'counter') ? 1 : 0;

    document.getElementById('setSeatWidth').value = w.value;
    document.getElementById('setSeatHeight').value = h.value;
    document.getElementById('setSeatShape').value = shape;
});

['setSeatWidth', 'setSeatHeight', 'setSeatShape'].forEach(id => document.getElementById(id).addEventListener('input', e => {
    document.getElementById('setSeatPreset').value = 'custom';
}));

function previewSeat(x, y) {
    return new Seat(x, y, ...['setSeatWidth', 'setSeatHeight', 'setSeatShape'].map(id => +Util.value(id)), true);
}