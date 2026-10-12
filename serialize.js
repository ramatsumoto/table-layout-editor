function getAllRectangles() {
    return ;
}
const Serialize = {
    tableSeating: () => Table.getData(),
    rectangles: () => getAllRectangles().map(r => r.toJSON()),
    registry: {
        "Rectangle": Rectangle,
        "Panel": Panel,
        "Lane": Lane,
        "Togo": Togo,
        "Group": Group,
        "Seat": Seat
    },
    registerClasses: ['Panel', 'Lane', 'Togo', 'Group'],
    handyClasses: ['Seat'],
    serialize: () => JSON.stringify({
        tableSeating: Table.getData(),
        rectangles: drawnRegister.concat(drawnHandy).map(r => r.toJSON()),
        options: Options
    }),
    deserialize: (json) => {
        const parsed = JSON.parse(json);

        if(parsed.tableSeating) {
            document.getElementById("tableSeating").replaceChildren();
            const tableSeating = parsed.tableSeating;
            for (const row of tableSeating) {
                Table.addRow();
                Table.setRow(row.id, row.name, row.isTogo);
            }
            console.log(`Read ${tableSeating.length} rows into table_seating`);
        }

        if (parsed.rectangles) {
            for (const rectObj of parsed.rectangles) {
                const rectangle = Serialize.deserializeRectangle(rectObj);
                rectangle.selected = false;

                const className = rectangle.className;
                if (Serialize.handyClasses.includes(className)) {
                    drawnHandy.push(rectangle);
                } else if(Serialize.registerClasses.includes(className)) {
                    drawnRegister.push(rectangle);
                } else {
                    console.warn("Unknown Rectangle found during parse.");
                    console.warn(rectangle);
                }
            }
            console.log(`Restored ${drawnHandy.length + drawnRegister.length}/${parsed.rectangles.length} provided Rectangles`);
        }

        if (parsed.options) {
            Object.assign(Options, parsed.options);
        }
    },
    deserializeRectangle: (obj) => {
        const { __type, data } = obj;
        const Target = Serialize.registry?.[__type];
        console.log(obj, __type);

        const instance = Object.create(Target?.prototype || null);

        for (const [k, v] of Object.entries(data)) {
            instance[k] = Serialize.deserializeHelper(v);
        }

        return instance;
    },
    deserializeHelper: (value) => {
        if (value && typeof value == 'object' && '__type' in value && 'data' in value) {
            return Serialize.deserializeRectangle(value);
        }
        if (Array.isArray(value)) {
            return value.map(x => Serialize.deserializeHelper(x));
        }
        return value;
    }
}
