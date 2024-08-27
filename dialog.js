let dialogController = new AbortController();
const dialog = document.getElementById('dialog');

function showDialog(type) {
    dialogController = new AbortController();

    const [x, y] = [+dialog.dataset.x, +dialog.dataset.y];

    for(const elem of dialog.children) {
        elem.classList.add('hidden');
    }
    Util.unhide('dialogConfirm');
    Util.unhide('dialogCancel');
    Util.unhide('dialogDelete');
    Util.unhide('dName');

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
        Util.hide('dialogDelete');
        Util.hide('dName');
        buttonEvents = prepareCreateDialog(x, y);
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
    Util.unhide('dSeating');
    Util.unhide('dOrientation');
    Util.unhide('dMargins');

    const start = document.getElementById('dSeatingStart');
    const end = document.getElementById('dSeatingEnd');
    const orientation = document.getElementById('dOrientation');
    const [mTop, mBottom, mLeft, mRight] = ['dMarginTop', 'dMarginBottom', 'dMarginLeft', 'dMarginRight'].map(id => document.getElementById(id));
    
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
    Util.fireInputEvent(start.id);

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
    ids.forEach(Util.unhide);
    
    const [name, orientation, text, width, widthMatch, height, heightMatch] = ids.map(id => document.getElementById(id));
    Util.deleteChildren(widthMatch);
    Util.deleteChildren(heightMatch);
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

    const others = drawn.filter(r => r != lane);
    for(const [edge, nearest] of Object.entries(lane.getNearest(others))) {
        if(nearest == Rectangle.MAX) continue;

        const opposite = Util.oppositeEdges[edge];
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
    ids.forEach(Util.unhide);
    const [name, text, indent, height, heightMatch, ] = ids.map(id => document.getElementById(id));

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
    Util.deleteChildren(heightMatch);

    const start = document.getElementById('dSeatingStart');
    const end = document.getElementById('dSeatingEnd');
    [start.value, end.value] = group.tableIDs;
    end.setAttribute('min', group.tableIDs[1] - group.tableIDs[0] + 1);

    const others = drawn.filter(r => r != group);
    for(const [edge, nearest] of Object.entries(group.getNearest(others))) {
        if(edge != 'left' && edge != 'right') continue;

        const opposite = Util.oppositeEdges[edge];
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
    Util.fireInputEvent(start.id);

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
    Util.unhide('dTogoRow');
    Util.unhide('dName');

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

    return { cancel };
}

function prepareCreateDialog(x, y) {
    Util.unhide('dCreateType');
    Util.fireInputEvent('dCreateType');

    ['dMarginTop', 'dMarginBottom', 'dMarginLeft', 'dMarginRight'].forEach(id => document.getElementById(id).value = 3);

    const confirm = () => {
        createFromDialog(x, y);
    };

    return { confirm };
}

function createFromDialog(x, y) {
    const type = Util.value('dCreateType');

    if(type == 'panel') {
        Options[Util.value('dSeatType')].count += +Util.value('dSeatNum');
        drawn.push(new Panel(
            x,
            y,
            +Util.value('dSeatNum'),
            Util.value('dSeatType'),
            Util.value('dOrientation') == 'vertical',
            {
                marginTop: +Util.value('dMarginTop'),
                marginBottom: +Util.value('dMarginBottom'),
                marginRight: +Util.value('dMarginRight'),
                marginLeft: +Util.value('dMarginLeft'),
            }
        ));
    } else if(type == 'lane') {
        drawn.push(new Lane(
            x,
            y,
            +Util.value('dWidth'),
            +Util.value('dHeight'),
            Util.value('dOrientation') == 'vertical',
            Util.value('dText')
        ));
    } else if(type == 'group') {
        const panelCounts = [+Util.value('dGroupPanel1'), +Util.value('dGroupPanel2')];
        if(Util.value('dGroupPanels') == '1') panelCounts.pop();

        Options[Util.value('dSeatType')].count += Util.sum(panelCounts);
        drawn.push(new Group(
            x,
            y,
            Util.value('dText'),
            Util.value('dSeatType'),
            panelCounts,
            100,
            Util.value('dIndent') == 'left'
        ));
    } else if(type == 'togo') {
        drawn.push(new Togo(
            x,
            y,
            +Util.value('dTogoRow'),
            Util.value('dSeatType')
        ));
    }
}


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
    toHide.forEach(Util.hide);
    toUnhide.forEach(Util.unhide);

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

function seatingNameList(panelCounts = [-1]) {
    const list = document.getElementById('dSeatingList');
    Util.deleteChildren(list);

    for(const name of Table.getRange(+Util.value('dSeatingStart'), +Util.value('dSeatingEnd'))) {
        const li = document.createElement('li');
        li.innerText = name;
        list.append(li);

        if(panelCounts[0] == list.querySelectorAll('li').length) {
            list.append(document.createElement('br'));
            panelCounts.shift();
        }
    }
}

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

function getCurrentRectangle() {
    return drawn.find(r => r.id == dialog.dataset.id);
}

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

    for(const other of drawn.filter(r => r != rect)) {
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

document.getElementById('dialogDelete').querySelector('button').addEventListener('click', e => {
    const rect = getCurrentRectangle();
    if(rect instanceof Panel) {
        Options[rect.tableType].count -= rect.numTables;
    } else if(rect instanceof Group) {
        Options[rect.tableType].count -= Util.sum(rect.panelCounts);
    }
    deleteFromDrawn(rect.id);
    dialog.close();
});
document.getElementById('dCreateType').addEventListener('input', createTypeSelection);
document.getElementById('dGroupPanels').addEventListener('input', createGroupPanels);
document.getElementById('dSeatingStart').addEventListener('input', seatingLinks);
document.getElementById('dSeatingEnd').addEventListener('input', seatingLinks);
document.getElementById('dNameFill').addEventListener('click', e => document.getElementById('dName').value = suggestedName());

function manageEvents(eventTriples) {
    for(const [elem, event, func] of eventTriples) {
        if(elem instanceof HTMLElement) {
            elem.addEventListener(event, func, { signal: dialogController.signal });
        } else {
            document.getElementById(elem).addEventListener(event, func, { signal: dialogController.signal });
        }
    }
}
