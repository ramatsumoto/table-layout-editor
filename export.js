function getRGB(colorHex) {
    const split = colorHex.trim().replace('#', '');
    return Array.from({ length: split.length / 2 }, (x, i) => split[2 * i] + split[2 * i + 1 ]).map(n => parseInt(n, 16));
}

function exportPanel(panel) {
    const definition = `APPanel ${panel.name} = getTableRowPanel(parent, tables.subList(${panel.tableIDs[0] - 1}, ${panel.tableIDs[1]}), ${panel.isVertical ? 'SWT.VERTICAL' : 'SWT.HORIZONTAL'}, ${Options[panel.tableType].wConstant}, ${Options[panel.tableType].hConstant}, ${panel.margin.top}, ${panel.margin.bottom}, ${panel.margin.left}, ${panel.margin.right}, ${panel.tableType}SectionBackground);`;
    const attachment = `setFormData(${panel.name}, new FormAttachment(0, ${panel.top}), null, new FormAttachment(0, ${panel.left}), null);`
    return {
        definition,
        attachment
    }
}

function exportLane(lane) {
    const definition = `APPanel ${lane.name} = getLanePanel(parent, ${lane.isVertical ? 'true' : 'false'}, "${lane.text}");`;
    const attachment = `setFormData(${lane.name}, new FormAttachment(0, ${lane.top}), new FormAttachment(0, ${lane.bottom}), new FormAttachment(0, ${lane.left}), new FormAttachment(0, ${lane.right}));`;
    return {
        definition,
        attachment
    }
}

function exportGroup(group) {
    const definition = `Group ${group.name} = new Group(parent, SWT.SHADOW_OUT);
\t\t${group.name}.setText("${group.text}");
\t\tFormLayout ${group.name}Layout = new FormLayout();
\t\t${group.name}.setLayout(${group.name}Layout);
\t\t${group.name}.setBackground(${group.tableType}SectionBackground);
\t\tFontData ${group.name}FD = new FontData("Arial", 12, SWT.BOLD);
\t\t${group.name}.setFont(swtMainFrame.getInstance().getResourceManager().getFont(${group.name}FD));`
    const panelDefinition = group.splitTableIDs().map(([start, end], i) => 
    `APPanel ${group.name}P${i + 1} = getTableRowPanel(${group.name}, tables.subList(${start - 1}, ${end}), SWT.VERTICAL, ${Options[group.tableType].wConstant}, ${Options[group.tableType].hConstant}, 0, 0, 0, 0, ${group.tableType}SectionBackground);`);

    const attachment = `setFormData(${group.name}, new FormAttachment(0, ${group.top}), null, new FormAttachment(0, ${group.left}), null);`;
    const panelAttachment = group.panelCounts.map((count, i) => {
        const tempPanel = new Panel(0, 0, count, group.tableType, true, { marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0});
        const indent = group.h - (tempPanel.h + Group.MARGIN * 2 + Group.TEXT_HEIGHT);
        const shouldIndent = (group.indent == 'left' && i == 0) || (group.indent == 'right' && i == group.panelCounts.length - 1);
        const top = `new FormAttachment(0, ${shouldIndent ? indent : 0})`;
        const left = i == 0 ? 'new FormAttachment(0, 0)' : `new FormAttachment(${group.name}P${i}, 0, SWT.RIGHT)`;
        return `setFormData(${group.name}P${i + 1}, ${top}, null, ${left}, null);`
    });

    return {
        definition: [definition, ...panelDefinition].join('\n\t\t'),
        attachment: [attachment, ...panelAttachment].join('\n\t\t')
    }
}

function exportTogo(togo) {
    const definition = `APPanel togoPanel = new APPanel(parent, SWT.NORMAL);
\t\ttogoPanel.setBackground(color);
\t\tgetTogoPanel(togoPanel, ENTRANCE_TABLE_NUM, ${togo.numPerRow}, ${Options[togo.tableType].wConstant},  ${Options[togo.tableType].hConstant});`;
    const attachment = `setFormData(togoPanel, new FormAttachment(0, ${togo.top}), null, new FormAttachment(0, ${togo.left}), null);`
    return {
        definition,
        attachment
    }
}

function exportJava(name, drawn) {
    const lines = drawn.map(rect => {
        if(rect instanceof Panel) {
            return exportPanel(rect);
        } else if(rect instanceof Lane) {
            return exportLane(rect);
        } else if(rect instanceof Group) {
            return exportGroup(rect); 
        } else if(rect instanceof Togo) {
            return exportTogo(rect);
        } else {
            return 0;
        }
    }).filter(r => r).map(r => `\t\t${r.definition}\n\t\t${r.attachment}\n`);

    const text = javaTemplate
        .replace('{}', lines.join('\n'))
        .replaceAll('[NAME]', name.trim().toUpperCase())
        .replace('[table width]', Options.table.width)
        .replace('[table height]', Options.table.height)
        .replace('[counter width]', Options.counter.width)
        .replace('[counter height]', Options.counter.height)
        .replace('[bar width]', Options.bar.width)
        .replace('[bar height]', Options.bar.height)
        .replace('[togo width]', Options.togo.width)
        .replace('[togo height]', Options.togo.height)
        .replace('[table count]', Options.table.count)
        .replace('[counter count]', Options.counter.count)
        .replace('[bar count]', Options.bar.count)
        .replace('[table color]', getRGB(Options.table.color).join(', '))
        .replace('[counter color]', getRGB(Options.counter.color).join(', '))
        .replace('[bar color]', getRGB(Options.bar.color).join(', '))
        .replace('[togo color]', getRGB(Options.togo.color).join(', '));
    
    return text;
}

function readyJavaFile(name, drawn) {
    name = name.trim().toUpperCase();
    const filename = `TablePanelImplKula${name}.java`;
    const text = exportJava(name, drawn);
    const java = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(java);

    const link = document.getElementById('downloadJava');
    link.removeAttribute('href');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.innerText = filename;
}

function readySQLFile(name, tableRows) {
    name = name.trim().toUpperCase();
    let res = `DELETE FROM table_seating;\n`;
    for(const row of tableRows) {
        res += `INSERT INTO table_seating VALUES (${row.id}, NULL, '${row.name}', 0, ${row.isTogo});\n`;
    }

    const sql = new Blob([res], { type: 'text/plain' });
    const url = URL.createObjectURL(sql);
    const link = document.getElementById('downloadSQL');
    const filename = `table_seating_${name}.sql`;
    link.removeAttribute('href');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.innerText = filename;
}

function readyConflictSQLFile(name, tableRows) {
    name = name.trim().toUpperCase();
    let res = ''
    for(const row of tableRows) {
        res += `INSERT INTO table_seating VALUES (${row.id}, NULL, '${row.name}', 0, ${row.isTogo}) ON CONFLICT (table_id) DO UPDATE SET table_desc='${row.name}', is_takeout=${row.isTogo};\n`;
    }

    const sql = new Blob([res], { type: 'text/plain' });
    const url = URL.createObjectURL(sql);
    const link = document.getElementById('downloadConflictSQL');
    const filename = `table_seating_conflict.sql`;
    link.removeAttribute('href');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.innerText = filename;
}

function readyDownloads() {
    const name = document.getElementById('storeCode').value;
    readyJavaFile(name, drawn);
    readySQLFile(name, Table.getData());
    readyConflictSQLFile(name, Table.getData());

    main.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        document.getElementById('previousCanvas').setAttribute('href', url);
    });
}

function canvasHasChanged() {
    document.getElementById('downloadJava').removeAttribute('href');
}

function tableSeatingHasChanged() {
    document.getElementById('downloadSQL').removeAttribute('href');
    document.getElementById('downloadConflictSQL').removeAttribute('href');
}