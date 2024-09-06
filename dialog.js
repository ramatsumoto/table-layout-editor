let dialogController = new AbortController();
const dialog = document.getElementById('dialog');

function showDialog(type) {
    dialogController = new AbortController();

    const [x, y] = [+dialog.dataset.x, +dialog.dataset.y];

    [...dialog.children].forEach(Elements.hide);
    Elements.unhide('dialogConfirm');
    Elements.unhide('dialogCancel');
    Elements.unhide('dialogDelete');
    Elements.unhide('dName');

    let buttonEvents = {};
    if(type == 'panel') {
        buttonEvents = preparePanelDialog();
    } else if(type == 'lane') {
        buttonEvents = prepareLaneDialog();
    } else if(type == 'group') {
        buttonEvents = prepareGroupDialog();
    } else if(type == 'togo') {
        buttonEvents = prepareTogoDialog();
    } else if(type == 'create') {
        Elements.hide('dialogDelete');
        Elements.hide('dName');
        buttonEvents = prepareCreateDialog(x, y);
    } else if(type == 'handy') {
        Elements.hide('dialogDelete');
        Elements.hide('dName');
        buttonEvents = prepareSeatDialog();
    } else if(type == 'seat') {
        Elements.hide('dName');
        buttonEvents = prepareSeatEditDialog();
    }

    const confirm = () => {
        buttonEvents.confirm?.();
        canvasHasChanged();
        dialog.close();
    }
    const cancel = () => {
        buttonEvents.cancel?.();
        dialog.close();
    }
    manageEvents([
        ['dialogConfirm', 'click', confirm],
        ['dialogCancel', 'click', cancel],
        [dialog, 'close', () => dialogController.abort()]
    ]);

    dialog.showModal();
}

function preparePanelDialog() {
    const panel = getCurrentRectangle();
    Elements.unhide('dSeating');
    Elements.unhide('dOrientation');
    Elements.unhide('dMargins');

    const start = document.getElementById('dSeatingStart');
    const end = document.getElementById('dSeatingEnd');
    const orientation = document.getElementById('dOrientation');
    const [mTop, mBottom, mLeft, mRight] = Elements.getAll(['dMarginTop', 'dMarginBottom', 'dMarginLeft', 'dMarginRight']);
    
    mTop.value = panel.margin.top;
    mBottom.value = panel.margin.bottom;
    mLeft.value = panel.margin.left;
    mRight.value = panel.margin.right;
    
    const initial = {
        isVertical: panel.isVertical,
        tableIDs: [...panel.tableIDs],
        margins: {...panel.margin},
    }
    orientation.value = (panel.isVertical) ? 'vertical' : 'horizontal';
    document.getElementById('dName').value = panel.name;

    manageEvents([
        [start, 'input', () => seatingNameList()],
        [end, 'input', () => seatingNameList()],
        [orientation, 'input', () => panel.isVertical = orientation.value == 'vertical'],
        [mTop, 'input', () => panel.margin.top = +mTop.value],
        [mBottom, 'input', () => panel.margin.bottom = +mBottom.value],
        [mLeft, 'input', () => panel.margin.left = +mLeft.value],
        [mRight, 'input', () => panel.margin.right = +mRight.value],
        [dialog, 'input', () => panel.calculateSize()]
    ]);
    [start.value, end.value] = panel.tableIDs;
    end.setAttribute('min', panel.tableIDs[1] - panel.tableIDs[0] + 1);
    Elements.fireInputEvent(start.id);

    const confirm = () => {
        panel.name = document.getElementById('dName').value;
    }
    const cancel = () => {
        panel.tableIDs = initial.tableIDs;
        panel.isVertical = initial.isVertical;
        panel.margin = initial.margins;
        panel.calculateSize();
    }

    return { confirm, cancel };
}

function prepareLaneDialog() {
    const lane = getCurrentRectangle();

    const ids = ['dName', 'dOrientation', 'dText', 'dWidth', 'dWidthMatch', 'dHeight', 'dHeightMatch'];
    ids.forEach(Elements.unhide);
    
    const [name, orientation, text, width, widthMatch, height, heightMatch] = Elements.getAll(ids);
    widthMatch.replaceChildren();
    heightMatch.replaceChildren();
    orientation.value = lane.isVertical ? 'vertical' : 'horizontal'; 

    name.value = lane.name;
    text.value = lane.text;
    width.value = lane.w;
    height.value = lane.h;
    const initial = {
        text: lane.text,
        w: lane.w,
        h: lane.h,
        isVertical: lane.isVertical
    };

    const others = State.drawn.filter(r => r != lane);
    for(const [edge, nearest] of Object.entries(lane.getNearest(others))) {
        if(nearest == Border.MAX) continue;

        const opposite = Rectangle.opposite(edge);
        if(lane[edge] - nearest[opposite] != 0) continue;

        const button = document.createElement('button');
        button.innerText = `Match with ${edge}`;
        if(edge == 'top' || edge == 'bottom') {
            button.addEventListener('click', e => width.value = lane.w = nearest.w);
            widthMatch.append(button);
        } else if(edge == 'left' || edge == 'right') {
            button.addEventListener('click', e => height.value = lane.h = nearest.h);
            heightMatch.append(button);
        }
    }

    const laneTranspose = () => {
        lane.isVertical = orientation.value == 'vertical';
        [lane.w, lane.h] = [lane.h, lane.w];
        [width.value, height.value] = [height.value, width.value];
    }

    manageEvents([
        [text, 'input', () => lane.text = text.value],
        [width, 'input', () => lane.w = +width.value],
        [height, 'input', () => lane.h = +height.value],
        [orientation, 'input', laneTranspose]
    ]);

    const confirm = () => {
        lane.name = name.value;
    }

    const cancel = () => {
        lane.text = initial.text;
        lane.w = initial.w;
        lane.h = initial.h;
        lane.isVertical = initial.isVertical;
    };

    return { confirm, cancel };
}

function prepareGroupDialog() {
    const group = getCurrentRectangle();

    const ids = ['dName', 'dText', 'dIndent', 'dHeight', 'dHeightMatch', 'dSeating'];
    ids.forEach(Elements.unhide);
    const [name, text, indent, height, heightMatch, ] = Elements.getAll(ids);

    const initial = {
        text: group.text,
        indent: group.indent,
        height: Math.max(group.defaultHeight, group.minHeight),
        tableIDs: [...group.tableIDs]
    };
    name.value = group.name;
    text.value = initial.text;
    indent.value = initial.indent;
    height.value = initial.height;
    heightMatch.replaceChildren();

    const start = document.getElementById('dSeatingStart');
    const end = document.getElementById('dSeatingEnd');
    [start.value, end.value] = group.tableIDs;
    end.setAttribute('min', group.tableIDs[1] - group.tableIDs[0] + 1);

    const others = State.drawn.filter(r => r != group);
    for(const [edge, nearest] of Object.entries(group.getNearest(others))) {
        if(edge != 'left' && edge != 'right') continue;

        const opposite = Rectangle.opposite(edge);
        if(group[edge] - nearest[opposite] != 0) continue;

        const button = document.createElement('button');
        button.innerText = `Match with ${edge}`;
        button.addEventListener('click', e => {
            const adjustedH = nearest.h - Group.EXTRA_HEIGHT;
            group.setHeight(adjustedH);
            height.value = adjustedH;
        });
        heightMatch.append(button);
    }

    manageEvents([
        [start, 'input', () => seatingNameList([...group.panelCounts])],
        [end, 'input', () => seatingNameList([...group.panelCounts])],
        [text, 'input', () => group.text = text.value],
        [indent, 'input', () => group.indent = indent.value],
        [height, 'input', () => group.setHeight(+height.value)]
    ]);
    Elements.fireInputEvent(start.id);

    const confirm = () => {
        group.name = name.value;
    };
    const cancel = () => {
        group.text = initial.text;
        group.indent = initial.indent;
        group.setHeight(initial.height);
        group.tableIDs = initial.tableIDs;
    }

    return { confirm, cancel };
}

function prepareTogoDialog() {
    const togo = getCurrentRectangle();
    const perRow = document.getElementById('dTogoRow');
    Elements.unhide('dTogoRow');
    Elements.unhide('dName');

    const initalNum = +perRow.value;
    document.getElementById('dName').value = togo.name;

    manageEvents([
        [perRow, 'input', () => togo.numPerRow = +perRow.value]
    ]);

    const confirm = () => {
        togo.name = document.getElementById('dName').value;
    }

    const cancel = () => {
        togo.perRow = initalNum;
    }

    return { confirm, cancel };
}

function prepareCreateDialog(x, y) {
    Elements.unhide('dCreateType');
    Elements.fireInputEvent('dCreateType');

    ['dMarginTop', 'dMarginBottom', 'dMarginLeft', 'dMarginRight'].forEach(id => document.getElementById(id).value = 3);

    const confirm = () => {
        createFromDialog(x, y);
    };

    return { confirm };
}

function createFromDialog(x, y) {
    const type = Elements.value('dCreateType');

    if(type == 'panel') {
        Options[Elements.value('dSeatType')].count += Elements.valueAsNum('dSeatNum');
        State.drawn.push(new Panel(
            x,
            y,
            Elements.valueAsNum('dSeatNum'),
            Elements.value('dSeatType'),
            Elements.value('dOrientation') == 'vertical',
            {
                marginTop: Elements.valueAsNum('dMarginTop'),
                marginBottom: Elements.valueAsNum('dMarginBottom'),
                marginRight: Elements.valueAsNum('dMarginRight'),
                marginLeft: Elements.valueAsNum('dMarginLeft'),
            }
        ));
    } else if(type == 'lane') {
        State.drawn.push(new Lane(
            x,
            y,
            Elements.valueAsNum('dWidth'),
            Elements.valueAsNum('dHeight'),
            Elements.value('dOrientation') == 'vertical',
            Elements.value('dText')
        ));
    } else if(type == 'group') {
        const panelCounts = [Elements.valueAsNum('dGroupPanel1'), Elements.valueAsNum('dGroupPanel2')];
        if(Elements.value('dGroupPanels') == '1') panelCounts.pop();

        Options[Elements.value('dSeatType')].count += Math2.sum(panelCounts);
        State.drawn.push(new Group(
            x,
            y,
            Elements.value('dText'),
            Elements.value('dSeatType'),
            panelCounts,
            100,
            Elements.value('dIndent') == 'left'
        ));
    } else if(type == 'togo') {
        State.drawn.push(new Togo(
            x,
            y,
            Elements.valueAsNum('dTogoRow'),
            Elements.value('dSeatType')
        ));
    }
}

function prepareSeatDialog() {
    Elements.unhide('dSeat');
    Elements.fireInputEvent('dSeatRows');

    const [rows, cols, start, end] = Elements.getAll(['dSeatRows', 'dSeatCols', 'dSeatIDStart', 'dSeatIDEnd']);
    const [w, h, shape] = ['setSeatWidth', 'setSeatHeight', 'setSeatShape'].map(Elements.valueAsNum);

    const x = +dialog.dataset.x;
    const y = +dialog.dataset.y;
    const confirm = () => {
        const seat = new Seat(x, y, w, h, shape, true);
        const seats = seat.multiply(+rows.value, +cols.value);
        const ids = createMatrix(...[rows, cols, start, end].map(Elements.valueAsNum)).flat();
        for(const [i, s] of seats.entries()) {
            s.tableID = ids[i];
        }
        State.drawn.push(...seats);
    }

    return { confirm };
}

function prepareSeatEditDialog() {
    const seat = getCurrentRectangle();
    Elements.unhide('dSeatEdit');
    const id = document.getElementById('dSeatIDChange');
    id.value = seat.tableID;
    Elements.fireInputEvent(id);

    const confirm = () => {
        seat.tableID = +id.value;
    }

    return { confirm };
}