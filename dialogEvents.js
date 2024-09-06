/**
 * When a edit dialog (as opposed to the creation dialogs) is opened ({@linkcode showDialog})
 *      the ID of the `Rectangle` to be editted gets passed as a data attribute to the {@link dialog}.
 * 
 * This function returns the `Rectangle` who is currently being editted.
 * @returns {Rectangle} The `Rectangle` currently being editted by the open dialog.
 */
function getCurrentRectangle() {
    return State.drawn.find(r => r.id == dialog.dataset.id);
}


/**
 * Hides/shows and prepares elements based on the selected table type
 *  in the Register mode creation dialog.
 * 
 * To be called as an event attached to 'dCreateType'
 */
function createTypeSelection(e) {
    const type = e.target.value;

    const ids = {
        panel: ['dSeatType', 'dOrientation', 'dSeatNum', 'dMargins'],
        lane: ['dText', 'dOrientation', 'dWidth', 'dHeight'],
        group: ['dSeatType', 'dText', 'dGroup'],
        togo: ['dSeatType', 'dTogoRow'],
    };

    const toUnhide = new Set(ids[type]);
    const toHide = new Set(Object.values(ids).flat()).difference(toUnhide);
    toHide.forEach(Elements.hide);
    toUnhide.forEach(Elements.unhide);

    const seatType = document.getElementById('dSeatType');
    if(type == 'panel') {
        seatType.value = 'table';
        seatType.toggleAttribute('disabled', false);
    }
    if(type == 'lane') {
        const width = document.getElementById('dWidth');
        const height = document.getElementById('dHeight');
        document.getElementById('dText').value = 'SUSHI LANE';
        if(document.getElementById('dOrientation').value == 'vertical') {
            width.value = 20;
            height.value = 100;
        } else {
            width.value = 100;
            height.value = 20;
        }
        manageEvents([
            ['dOrientation', 'change', () => [width.value, height.value] = [height.value, width.value]]
        ]);
    } 
    if(type == 'group') {
        document.getElementById('dText').value = 'Sushi bar';
        seatType.value = 'counter';
        seatType.toggleAttribute('disabled', false);
    }
    if(type == 'togo') {
        seatType.value = 'togo';
        seatType.toggleAttribute('disabled', true);
    }
}
document.getElementById('dCreateType').addEventListener('input', createTypeSelection);

/**
 * For the creating {@linkcode Group}s in the Register mode creation dialog.
 * 
 * Disables/enables the panel seat count inputs depending on the input of 'dGroupPanels'. 
 */
function createGroupPanels(e) {
    const panels = e.target.value;

    const panel1 = document.getElementById('dGroupPanel1');
    const panel2 = document.getElementById('dGroupPanel2');

    if(panels == '1') {
        panel1.toggleAttribute('disabled', false);
        panel2.toggleAttribute('disabled', true);
    } else {
        panel1.toggleAttribute('disabled', false);
        panel2.toggleAttribute('disabled', false);
    }
}
document.getElementById('dGroupPanels').addEventListener('input', createGroupPanels);

/**
 * Generates a list of names pulled from {@link Table}.
 * 
 * Uses the values of 'dSeatingStart' and 'dSeatingEnd'.
 * 
 * @param {number[]} panelCounts The list will have extra line breaks 
 *      where a panel would begin/end. This parameter should only be
 *      overwritten when creating a name list for a {@linkcode Group}
 */
function seatingNameList(panelCounts = [-1]) {
    const list = document.getElementById('dSeatingList');
    list.replaceChildren();

    for(const name of Table.getRange(Elements.valueAsNum('dSeatingStart'), Elements.valueAsNum('dSeatingEnd'))) {
        const li = document.createElement('li');
        li.innerText = name;
        list.append(li);

        if(panelCounts[0] == list.querySelectorAll('li').length) {
            list.append(document.createElement('br'));
            panelCounts.shift();
        }
    }
}

/**
 * Links 'dSeatingStart' and 'dSeatingEnd' so they are always a specific interval apart.
 * 
 * The interval depends on the `tableIDs` of the {@linkcode Panel} or {@linkcode Group} is currently being editted.
 */
function seatingLinks(e) {
    const rect = getCurrentRectangle();
    if(!rect || !(rect instanceof Panel || rect instanceof Group)) {
        return;
    }
    const diff = rect.tableIDs[1] - rect.tableIDs[0];
    
    const start = document.getElementById('dSeatingStart');
    const end = document.getElementById('dSeatingEnd');
    
    if(e.target == start) {
        end.value = +start.value + diff;
    } else {
        start.value = +end.value - diff
    }
    rect.tableIDs = [+start.value, +end.value];
}
document.getElementById('dSeatingStart').addEventListener('input', seatingLinks);
document.getElementById('dSeatingEnd').addEventListener('input', seatingLinks);


/**
 * Suggests a name for a given `Rectangle`.
 * 
 * Names {@linkcode Lane}s based on their orientation, {@linkcode Group}s by their table type, 
 *      and {@linkcode Panel}s based on their `table_seating` names if applicable.
 * 
 * Naming collisions are avoided by appending a number to the name.
 * @returns {string} The automatically created name for the `Rectangle` being editted.
 */
function suggestedName() {
    const rect = getCurrentRectangle();
    if(!rect) return false;
    
    const words = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    let name = '';
    let duplicateCount = 0;
    let includeOne = false;

    if(rect instanceof Panel) {
        const tableNames = Table.getRange(...rect.tableIDs);
        if(tableNames.includes('[N/A]')) {
            name = 'panel' + (rect.isVertical ? 'V' : 'H');
            includeOne = true;
        } else {
            name = `panel${tableNames[0]}to${tableNames.at(-1)}`;
        }
    } else if(rect instanceof Lane) {
        name = 'lane' + (rect.isVertical ? 'V' : 'H');
        includeOne = true;
    } else if(rect instanceof Group) {
        const type = rect.tableType;
        name = type + 'Area';
    } else if(rect instanceof Togo) {
        name = 'togoPanel';
    }

    for(const other of State.drawn.filter(r => r != rect)) {
        if(other.name.startsWith(name)) {
            duplicateCount++;
        }
    }

    if(duplicateCount == 0 && includeOne) {
        name += 'One';
    } else if(duplicateCount > 0) {
        name += words.at(duplicateCount) ?? duplicateCount;
    }

    return name;
}
document.getElementById('dNameFill').addEventListener('click', e => document.getElementById('dName').value = suggestedName());

/**
 * Creates a matrix/2D array based on the given parameters.
 * 
 * Travelling horizontally, each element of the matrix will increment/decrement by one.
 * 
 * The elements will increment if `start < end`, and will decrement otherwise.
 * @param {number} rows The number of rows the matrix will have
 * @param {number} cols The number of columns the matrix will have
 * @param {number} start The first element of the matrix
 * @param {number} end Dictates the last element of the matrix. If `rows * cols - 1 = |start - end|` then `end will be the last element.
 * @returns {number[][]} A 2D array of length `rows` where each element is an array of length `cols`.
 */
function createMatrix(rows, cols, start, end) {
    const length = rows * cols;
    const ascending = start < end;
    const numbers = Array.from({ length }, (_, i) => ascending ? start + i : start - i);
    const matrix = numbers.reduce((arrs, x) => arrs.at(-1).length < cols ? arrs.with(-1, [...arrs.at(-1), x]) : [...arrs, [x]], [[]]);
    return matrix;
}

/**
 * For the Handy mode Seat creation dialog.
 * 
 * Creates a `<table>` to simulate how the {@linkcode Seat}s will be layed out
 *      based on the inputs of the dialog.
 */
function createSeatPreview() {
    const tr = [];
    for(const row of createMatrix(...['dSeatRows', 'dSeatCols', 'dSeatIDStart', 'dSeatIDEnd'].map(Elements.valueAsNum))) {
        const cells = row.map(n => {
            const e = document.createElement('td');
            e.innerText = Table.get(n, true);
            return e;
        });
        const r = document.createElement('tr');
        r.append(...cells);
        tr.push(r);
    }
    const tbody = document.createElement('tbody');
    tbody.append(...tr);
    document.getElementById('dSeatPreview').replaceChildren(tbody);
}

/**
 * For the Handy mode Seat creation dialog.
 * 
 * Ensures that 'dSeatIDStart' and 'dSeatIDEnd' are updated together,
 *      and maintain a consistent interval as dictated by 
 *      'dSeatRows' and 'dSeatCols'.
 * @see {@link seatingLinks}
 */
function updateSeatIDs(e) {
    const [start, end] = ['dSeatIDStart', 'dSeatIDEnd'].map(Elements.get);
    const length = Elements.valueAsNum('dSeatRows') * Elements.valueAsNum('dSeatCols') - 1;
    const ascending = +start.value < +end.value;
    const count = ascending ? length : -length;

    if(e.target == start) {
        end.value = +start.value + count;
    } else if(e.target == end) {
        start.value = +end.value - count;
    } else if(ascending) {
        end.value = +start.value + count;
    } else if(!ascending) {
        start.value = +end.value - count;
    }
}
for(const id of ['dSeatRows', 'dSeatCols', 'dSeatIDStart', 'dSeatIDEnd']) {
    document.getElementById(id).addEventListener('input', e => {
        updateSeatIDs(e);
        createSeatPreview();
    });
}
document.getElementById('dSeatIDReverse').addEventListener('click', e => {
    const [start, end] = [document.getElementById('dSeatIDStart'), document.getElementById('dSeatIDEnd')];
    [start.value, end.value] = [end.value, start.value];
    Elements.fireInputEvent(start);
});

/** For the Handy mode Seat edit dialog, updates the name previews. */
document.getElementById('dSeatIDChange').addEventListener('input', e => {
    document.querySelector('[for="dSeatIDChange"]').innerText = `\u21A6 ${Table.get(+e.target.value)}`; // \u21A6 is ↦
});

/**
 * Updates the table counts (see {@link Options}) when a {@linkcode Panel} or {@linkcode Group} is deleted.
 */
function reduceTableCounts() {
    const rect = getCurrentRectangle();
    if(rect instanceof Panel) {
        Options[rect.tableType].count -= rect.numTables;
    } else {
        Options[rect.tableType].count -= Math2.sum(rect.panelCounts);
    }
    deleteFromDrawn(rect.id);
    dialog.close();
}
document.getElementById('dialogDelete').querySelector('button').addEventListener('click', reduceTableCounts);

/**
 * Takes a list of elements, event names, and event handlers add the associated event listener.
 * 
 * These listeners will automatically remove themselves the next time the {@link dialog} closes.
 * @param {any[][]} eventTriples A list of arrays in the form `[element, eventName, eventHandler]`. 
 */
function manageEvents(eventTriples) {
    for(const [elem, event, func] of eventTriples) {
        if(elem instanceof HTMLElement) {
            elem.addEventListener(event, func, { signal: dialogController.signal });
        } else {
            document.getElementById(elem).addEventListener(event, func, { signal: dialogController.signal });
        }
    }
}
