let dialogController = new AbortController();

function showTableDialog(panel) {
    const dialog = document.getElementById('tableProperties');
    dialogController = new AbortController();
    const length = panel.numTables;
    const diff = length - 1;

    const idRangeStart = document.getElementById('tableSeatStart');
    const idRangeEnd = document.getElementById('tableSeatEnd');
    idRangeEnd.setAttribute('min', length);

    idRangeStart.value = panel.tableIDs[0];
    idRangeEnd.value = panel.tableIDs[1];

    const linkInputs = {
        start: e => idRangeEnd.value = +idRangeStart.value + diff,
        end: e => idRangeStart.value = +idRangeEnd.value - diff
    };
    const confirmInputs = () => {
        panel.tableIDs = [+idRangeStart.value, +idRangeEnd.value];
        dialog.close();
    };
    const updateNameList = () => {
        const nameList = document.getElementById('tableNames');
        Util.deleteChildren(nameList);
        for(const name of Table.getRange(+idRangeStart.value, +idRangeEnd.value)) {
            const li = document.createElement('li');
            li.innerText = name;
            nameList.append(li);
        }
    };
    const cancel = () => dialog.close();
    const deletePanel = () => {
        Options[panel.tableType].count -= panel.numTables;
        deleteFromDrawn(panel.id);
        dialog.close();
    }

    updateNameList();

    manageEvents([
        [idRangeStart, 'input', linkInputs.start],
        [idRangeStart, 'input', updateNameList],
        [idRangeEnd, 'input', linkInputs.end],
        [idRangeEnd, 'input', updateNameList],
        [document.getElementById('tableConfirm'), 'click', confirmInputs],
        [document.getElementById('tableCancel'), 'click', cancel],
        [document.getElementById('tableDelete'), 'click', deletePanel],
        [dialog, 'close', e => dialogController.abort()]
    ]);

    dialog.showModal();
}

function showLaneDialog(lane) {
    const dialog = document.getElementById('laneProperties');
    dialogController = new AbortController();
    const initial = {};
    
    const nameInput = document.getElementById('laneText');
    initial.text = lane.text;
    nameInput.value = lane.text;

    const width = document.getElementById('laneWidth');
    const height = document.getElementById('laneHeight');
    initial.width = lane.w;
    initial.height = lane.h;
    width.value = lane.w;
    height.value = lane.h

    const setWidth = w => lane.w = w;
    const setHeight = h => lane.h = h;

    const changeWidth = () => setWidth(+width.value);
    const changeHeight = () => setHeight(+height.value);

    const matchWidth = document.getElementById('laneWidthMatching');
    const matchHeight = document.getElementById('laneHeightMatching');
    Util.deleteChildren(matchWidth);
    Util.deleteChildren(matchHeight);
    const nearest = lane.getNearest(drawn.filter(r => r != lane));
    for(const [edge, rectangle] of Object.entries(nearest)) {
        if(rectangle == Rectangle.MAX) continue;

        if(lane[edge] != rectangle[Util.oppositeEdges[edge]]) continue;

        const button = document.createElement('button');
        button.innerText = `Match with ${edge}`;
        if(edge == 'top' || edge == 'bottom') {
            button.addEventListener('click', e => {
                setWidth(rectangle.w);
                width.value = rectangle.w;
            });
            matchWidth.append(button);
        } else if(edge == 'left' || edge == 'right') {
            button.addEventListener('click', e => {
                setHeight(rectangle.h);
                height.value = rectangle.h;
            });
            matchHeight.append(button);
        }
    
    }

    const confirmName = () => {
        lane.text = nameInput.value;
        dialog.close();
    }
    const cancel = () => {
        lane.text = initial.text;
        lane.w = initial.width;
        lane.h = initial.height;
        dialog.close();
    }
    const deleteLane = () => {
        deleteFromDrawn(lane.id);
        dialog.close();
    }

    manageEvents([
        [document.getElementById('laneConfirm'), 'click', confirmName],
        [document.getElementById('laneCancel'), 'click', cancel],
        [document.getElementById('laneDelete'), 'click', deleteLane],
        [width, 'input', changeWidth],
        [height, 'input', changeHeight],
        [dialog, 'close', e => dialogController.abort()]
    ]);

    dialog.showModal();
}

function showGroupDialog(group) {
    const dialog = document.getElementById('groupProperties');
    dialogController = new AbortController();
    const initial = {};

    const titleInput = document.getElementById('groupText');
    titleInput.value = group.text;
    initial.text = group.text;

    const changeText = () => group.text = titleInput.value;

    const groupHeight = document.getElementById('groupHeight');
    initial.height = Math.max(group.minHeight, group.defaultHeight);
    groupHeight.setAttribute('min', group.minHeight);
    groupHeight.value = initial.height;

    const changeHeight = () => group.setHeight(+groupHeight.value);

    const indentation = document.getElementById('groupIndenting');
    indentation.value = group.indent;
    initial.indent = group.indent;

    const changeIndent = () => group.indent = indentation.value;

    const length = Util.sum(group.panelCounts);
    const diff = length - 1;
    const idRangeStart = document.getElementById('groupSeatStart');
    const idRangeEnd = document.getElementById('groupSeatEnd');
    idRangeEnd.setAttribute('min', length);

    idRangeStart.value = group.tableIDs[0];
    idRangeEnd.value = group.tableIDs[1];

    const linkInputs = {
        start: e => idRangeEnd.value = +idRangeStart.value + diff,
        end: e => idRangeStart.value = +idRangeEnd.value - diff
    };
    const updateNameList = () => {
        const nameList = document.getElementById('groupNames');
        const panelEnds = group.panelCounts.map((_, i) => Util.sum(group.panelCounts.slice(0, i + 1)));
        Util.deleteChildren(nameList);
        for(const name of Table.getRange(+idRangeStart.value, +idRangeEnd.value)) {
            const li = document.createElement('li');
            li.innerText = name;
            nameList.append(li);

            if(panelEnds[0] == nameList.querySelectorAll('li').length) {
                nameList.append(document.createElement('br'));
                panelEnds.shift();
            }
        }
    };
    updateNameList();

    const confirm = () => {
        group.tableIDs = [+idRangeStart.value, +idRangeEnd.value];
        dialog.close();
    }
    const cancel = () => {
        group.setHeight(initial.height);
        group.text = initial.text;
        group.indent = initial.indent;
        dialog.close();
    }
    const deleteGroup = () => {
        Options[group.tableType].count -= Util.sum(group.panelCounts);
        deleteFromDrawn(group.id);
        dialog.close();
    }

    manageEvents([
        [document.getElementById('groupConfirm'), 'click', confirm],
        [document.getElementById('groupCancel'), 'click', cancel],
        [document.getElementById('groupDelete'), 'click', deleteGroup],
        [groupHeight, 'input', changeHeight],
        [indentation, 'change', changeIndent],
        [titleInput, 'input', changeText],
        [idRangeStart, 'input', linkInputs.start],
        [idRangeEnd, 'input', linkInputs.end],
        [idRangeStart, 'input', updateNameList],
        [idRangeEnd, 'input', updateNameList],
        [dialog, 'close', e => dialogController.abort()]
    ]);

    dialog.showModal();
}

function showTogoDialog(togo) {
    const dialog = document.getElementById("togoProperties");
    dialogController = new AbortController();

    const numPerRow = document.getElementById("togoNumPerRow");
    numPerRow.value = togo.numPerRow;

    const confirm = () => {
        togo.numPerRow = +numPerRow.value;
        dialog.close();
    }
    const cancel = () => {
        dialog.close();
    }
    const deleteTogo = () => {
        deleteFromDrawn(togo.id);
        dialog.close();
    }

    manageEvents([
        [document.getElementById('togoConfirm'), 'click', confirm],
        [document.getElementById('togoCancel'), 'click', cancel],
        [document.getElementById('togoDelete'), 'click', deleteTogo],
        [dialog, 'close', e => dialogController.abort()]
    ]);

    dialog.showModal();
}

function showCreationDialog([x, y]) {
    const dialog = document.getElementById('createRectangle');
    dialogController = new AbortController();
    
    const toggleSection = () => {
        const type = document.getElementById('createType');
        dialog.querySelectorAll('div').forEach(div => div.classList.add('hidden'));
        
        if(type.value == 'panel') dialog.querySelector('#createPanel').classList.remove('hidden');
        else if(type.value == 'lane') dialog.querySelector('#createLane').classList.remove('hidden');
        else if(type.value == 'group') dialog.querySelector('#createGroup').classList.remove('hidden');
        else if(type.value == 'togo') dialog.querySelector('#createTogo').classList.remove('hidden');
    }

    const laneTranspose = () => {
        const laneW = document.getElementById('createLaneWidth');
        const laneH = document.getElementById('createLaneHeight');
        
        [laneW.value, laneH.value] = [laneH.value, laneW.value];
    }

    const groupPanelInputs = () => {
        const panelCount = +document.getElementById('createGroupPanelNum').value;
        const form = document.getElementById('createGroupPanels');
        const currentCount = document.querySelectorAll('#createGroupPanels label').length;

        if(currentCount < panelCount) {
            for(let i = currentCount + 1; i <= panelCount; i++) {
                const label = document.createElement('label');
                label.innerText = `Panel ${i} Table Count: `;

                const input = document.createElement('input');
                input.setAttribute('id', 'createGroupPanel' + i);
                input.setAttribute('type', 'number');
                input.setAttribute('min', '1');
                input.setAttribute('value', '4');
                input.classList.add('short');

                const br = document.createElement('br');
                label.append(input, br);

                form.append(label);
            }
        } else if(currentCount > panelCount) {
            for(let i = 0; i < currentCount - panelCount; i++) {
                form.lastElementChild.remove();
            }
        }
    }

    toggleSection();

    const confirm = () => {
        createFromDialog([x, y]);
        dialog.close();
    }
    const cancel = () => dialog.close();

    manageEvents([
        [document.getElementById('createType'), 'change', toggleSection],
        [document.getElementById('createConfirm'), 'click', confirm],
        [document.getElementById('createCancel'), 'click', cancel],
        [document.getElementById('createLaneOrient'), 'change', laneTranspose],
        [document.getElementById('createGroupPanelNum'), 'input', groupPanelInputs],
        [dialog, 'close', e => dialogController.abort()]
    ]);

    dialog.showModal();
}

function createFromDialog([x, y]) {
    const value = id => document.getElementById(id).value;
    const type = value('createType');

    if(type == 'panel') {
        const count = +value('createPanelCount');
        const type = value('createPanelType');
        drawn.push(new Panel(
            x,
            y,
            +value('createPanelCount'),
            value('createPanelType'),
            value('createPanelOrient') == 'vertical',
            {
                marginTop: +value('createPanelMarginTop'),
                marginBottom: +value('createPanelMarginBottom'),
                marginLeft: +value('createPanelMarginLeft'),
                marginRight: +value('createPanelMarginRight')
            }
        ));
        Options[type].count += count;
        console.log('Created a Panel');
    } else if(type == 'lane') {
        drawn.push(new Lane(
            x,
            y,
            +value('createLaneWidth'),
            +value('createLaneHeight'),
            value('createLaneOrient') == 'vertical',
            value('createLaneText')
        ));
        console.log('Created a Lane');
    } else if(type == 'group') {
        const panelCounts = [...document.getElementById('createGroupPanels').querySelectorAll('input')].map(elem => +elem.value);
        const type = value('createGroupType');
        drawn.push(new Group(
            x,
            y,
            value('createGroupText'),
            type,
            panelCounts,
            100,
            true
        ));
        Options[type].count += Util.sum(panelCounts);
        console.log('Created a Group');
    } else if(type == 'togo') {
        drawn.push(new Togo(
            x,
            y,
            +value('createTogoPerRow')
        ));
        console.log('Create a Togo set');
    }
}

function manageEvents(eventTriples) {
    for(const [elem, event, func] of eventTriples) {
        elem.addEventListener(event, func, { signal: dialogController.signal });
    }
}
