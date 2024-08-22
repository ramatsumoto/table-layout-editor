const Table = {
    addRow: () => {
        const body = document.querySelector('#tableSeating tbody');
        const n = body.children.length + 1; // Table IDs start at 1 not 0
        body.append(createRow(n));
        tableSeatingHasChanged();
    },
    removeLastRow: () => {
        const last = document.querySelector('#tableSeating tbody tr:last-child');
        if(last) {
            last.remove();
            tableSeatingHasChanged();
        }
    },
    getData: () => [...document.querySelectorAll('#tableSeating tbody tr')].map(tr => ({
        id: +tr.children[0].innerText,
        name: tr.querySelector('input').value,
        isTogo: tr.querySelector('input[type="checkbox"]').checked
    })),
    getRange: (start, end, includeID = false) => {
        if(start < 1) return false;
        const length = end - start + 1;
        const validRange = Table.getData().map(d => includeID ? `${d.name} (${d.id})` : d.name).slice(start - 1, end);
        while(validRange.length < length) validRange.push(`[N/A] (${start + validRange.length})`);
        return validRange;
    },
    setRow: (id, text, togo) => {
        if(id < 1 || id > Table.length()) return false;
        const row = document.querySelector(`#tableSeating tbody tr:nth-child(${id})`);
        if(!row) return false;
        const [_, name, checkbox] = [...row.children].map(td => td.querySelector('input'));
        name.value = text;
        checkbox.checked = togo;
        tableSeatingHasChanged();
    },
    length: () => document.querySelectorAll('#tableSeating tbody tr').length
}

function createRow(n) {
    const row = document.createElement('tr');

    const id = document.createElement('span');
    id.innerText = n;

    const name = document.createElement('input');
    name.setAttribute('value', 'T' + n);
    name.setAttribute('size', 10);

    const togo = document.createElement('input');
    togo.setAttribute('type', 'checkbox');

    const cells = [id, name, togo].map(elem =>  {
        const cell = document.createElement('td');
        cell.append(elem);
        return cell;
    })
    row.append(...cells);
    
    return row;
}

document.getElementById('tableSeatingAdd').addEventListener('click', Table.addRow);
document.getElementById('tableSeatingAdd10').addEventListener('click', () => Array(10).fill().forEach(Table.addRow));
document.getElementById('tableSeatingAddTogo').addEventListener('click', () => {
    Array(20).fill(0).forEach(Table.addRow);
    for(let i = 1; i <= 20; i++) {
        Table.setRow(Table.length() - 20 + i, 'TOGO' + (i), true);
    }
})
document.getElementById('tableSeatingRemove').addEventListener('click', Table.removeLastRow);
document.getElementById('tableSeatingRemove10').addEventListener('click', () => Array(10).fill().forEach(Table.removeLastRow));

document.getElementById('tableSeating').addEventListener('change', e => {
    tableSeatingHasChanged();
})