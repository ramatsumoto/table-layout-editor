// Object for representing `table_seating`.
// This simply parses the `tableSeating` element. Meaning the HTML is the source of truth, not this object. 
/**
 * Object for handling the representation of `table_seating`.
 */
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
    /**
     * Returns the `tableSeating` HTML table as an array.
     * @returns 
     */
    getData: () => [...document.querySelectorAll('#tableSeating tbody tr')].map(tr => ({
        id: +tr.children[0].innerText,
        name: tr.querySelector('input').value,
        isTogo: tr.querySelector('input[type="checkbox"]').checked
    })),
    /**
     * Returns the name of the `table_seating` row with the given `index`.
     * @param {number} index The ID of the row to find
     * @param {boolean} includeID if `true` the returned name will also include `index`.
     * @returns The name of the row with the given ID (`index`). If such a row does not exist, then "[N/A]"
     */
    get: (index, includeID = false) => {
        const row = Table.getData().find(tr => tr.id == index);
        const name = row?.name ?? '[N/A]';
        if(includeID) {
            return name + ` (${index})`;
        } else {
            return name;
        }
    },
    /**
     * Returns the names of the rows whose IDs are between `start` and `end` inclusive.
     * @param {number} start Starting ID
     * @param {number} end Ending ID (inclusive)
     * @param {boolean} includeID if `true` the IDs are included along with the names
     * @returns {string[]} A list of names of rows. If the range includes IDs that are not present in `table_seating`, "[N/A]" will be returned.
     */
    getRange: (start, end, includeID = false) => {
        if(start < 1) return false;
        return Array.from({ length: end - start + 1 }, (_, i) => Table.get(i + start, includeID));
    },
    /**
     * Edits the row with `id` to have `text` and the provided is-`togo` flag.
     * @param {number} id The ID of the row to edit
     * @param {string} text The new text
     * @param {boolean} togo The new to-go boolean
     */
    setRow: (id, text, togo) => {
        if(id < 1 || id > Table.length()) return false;
        const row = document.querySelector(`#tableSeating tbody tr:nth-child(${id})`);
        if(!row) return ;
        const [_, name, checkbox] = [...row.children].map(td => td.querySelector('input'));
        name.value = text;
        checkbox.checked = togo;
        tableSeatingHasChanged();
    },
    /**
     * Gets the length of the `table_seating` table.
     * @returns The length of `table_seating`. Should also be the highest/last id in the table.
     */
    length: () => document.querySelectorAll('#tableSeating tbody tr').length
}

/**
 * Appends a new row to `#tableSeating` with the ID as `n`.
 */
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
    for(let i = 1; i <= 20; i++) {
        Table.addRow();
        Table.setRow(Table.length() - 20 + i, 'TOGO' + (i), true);
    }
})
document.getElementById('tableSeatingRemove').addEventListener('click', Table.removeLastRow);
document.getElementById('tableSeatingRemove10').addEventListener('click', () => Array(10).fill().forEach(Table.removeLastRow));

document.getElementById('tableSeating').addEventListener('change', e => {
    tableSeatingHasChanged();
});