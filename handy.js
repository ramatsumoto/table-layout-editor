class Seat extends Rectangle {
    constructor(x, y, w, h, shape, temp = false) {
        super(x, y, w, h, temp);
        this.shape = shape;
        this.temp = temp;
        this.tableID = 0;
    }

    draw(context) {
        context.save();
        context.beginPath();
        context.fillStyle = 'white';
        context.strokeStyle = 'black';
        context.strokeWidth = 2;

        const [x, y, w ,h] = [this.x, this.y, this.w, this.h].map(n => n * Rectangle.SCALE);

        if(this.shape == 0) {
            context.rect(x, y, w, h);
        } else {
            context.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
        }

        context.clip();
        if(this.temp) {
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

    changeID() {
        const response = window.prompt('Set new table seating ID', this.tableID);
        const asNum = Number.parseInt(response);

        if(Number.isNaN(asNum)) return;

        this.tableID = asNum;
    }
}