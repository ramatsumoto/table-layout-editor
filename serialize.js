const Serialize = {
    tableSeating: () => Table.getData(),
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
        options: Options,
        storeCode: Elements.get('storeCode').value,
        timestamp: new Date().toLocaleString(),
    }),
    deserialize: (json) => {
        const parsed = JSON.parse(json);

        if(parsed.tableSeating) {
            document.querySelector("#tableSeating tbody").replaceChildren();
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
                rectangle.clicked = false;

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
            syncFromOptions();
        }

        if (parsed.storeCode) {
            Elements.get('storeCode').value = parsed.storeCode;
        }
    },
    deserializeRectangle: (obj) => {
        const { __type, data } = obj;
        const Target = Serialize.registry?.[__type];
        console.log(obj);

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
        return value; // Primitives need no processing
    },
    prepareDownload: (text) => {
        const date = new Date().toLocaleDateString('sv', {timeZone: 'America/Los_Angeles'});

        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.getElementById('saveDownloadLink');
        link.setAttribute('download', `table-layout_${Options.storeCode.toUpperCase()}_${date}.json`);
        link.setAttribute('href', url);
        document.getElementById('saveDownload').removeAttribute('disabled');
    },
    saveProgress: () => {
        const state = Serialize.serialize();
        const now = new Date();

        localStorage.setItem("progress", state);

        const timestamp = document.getElementById('saveTimestamp');
        timestamp.innerText = now.toLocaleString();
        timestamp.classList.remove('unsavedChanges');

        Serialize.prepareDownload(state);
    },
    loadProgress: () => {
        const save = localStorage.getItem("progress");
        if (!save) return;

        console.log("Loading progress");
        Serialize.deserialize(save);
        document.getElementById('saveTimestamp').innerText = JSON.parse(save)?.timestamp ?? 'Never';
        document.getElementById('saveTimestamp').classList.remove('unsavedChanges');
        Serialize.prepareDownload(save);
    },
    clearProgress: () => {
        localStorage.removeItem("progress");
    },
    initAutoSaver: (waitMs) => {
        let timeoutId = null;
        return () => {
            console.log(`Saving in ${waitMs} ms`);
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                console.log('Saved');
                Serialize.saveProgress();
            }, waitMs);
        }
    },
    loadFromFile: (file) => {
        if (file.type != 'application/json') {
            console.log('File must be a .json');
            return;
        }

        console.log(`Loading file "${file.name}"`);
        const reader = new FileReader();
        reader.onload = e => {
            Serialize.deserialize(e.target.result);
        };
        reader.readAsText(file);
    }
}

Serialize.loadProgress();
const triggerSave = Serialize.initAutoSaver(1200);

function resetEditor() {
    Serialize.clearProgress();

    document.querySelector("#tableSeating tbody").replaceChildren();
    drawnHandy.length = 0;
    drawnRegister.length = 0;

    Rectangle.counter = 0;
    for (const input of document.querySelectorAll('input')) {
        input.value = input.getAttribute('value');
    }
    setScale(1);

    Elements.get("saveTimestamp").innerText = 'Never';
    Elements.get("saveDownload").toggleAttribute("disabled", true);
    Elements.get("saveDownloadLink").removeAttribute("href");

    Elements.get("mainContainer").style.setProperty('width', '1000px');
    Elements.get("mainContainer").style.setProperty('height', '800px');
}

Elements.get("clearState").addEventListener('click', e => {
    if (confirm('Reset editor? (Cannot be undone)')) {
        resetEditor();
    }
});
Elements.get("saveDownload").addEventListener('click', () => {
    Elements.get("saveDownloadLink").click();
});
Elements.get("loadSave").addEventListener('click', () => {
    Elements.get("loadFileSelector").click();
});
Elements.get("loadFileSelector").addEventListener('input', e => {
    load(e.target.files[0]);
});

/** Triggers visual changes to indicate that there are unsaved changes */
function unsavedChanges() {
    document.getElementById('saveTimestamp').classList.add('unsavedChanges');
    document.getElementById('saveDownload').toggleAttribute('disabled', true);
    document.getElementById('saveDownloadLink').removeAttribute('href');
}
/** Loads editor state from a JSON save file */
function load(saveFile) {
    if (!saveFile) return;

    if (saveFile.type != 'application/json') return;

    if (confirm(`Load file ${saveFile.name}?\n(Will overwrite current work)`)) {
        resetEditor();
        Serialize.loadFromFile(saveFile);
    }
}

document.body.addEventListener('keydown', e => {
    if (e.defaultPrevented) return;

    if (e.ctrlKey || e.metaKey) {
        if (e.key == 's') {
            e.preventDefault();
            Serialize.saveProgress();
            Elements.get("saveDownloadLink").click();
        } else if (e.key == 'o') {
            e.preventDefault();
            Elements.get('loadFileSelector').click();
        }
    }
});

{ // Add events for drag/drop loading
    const target = document.getElementById('mainContainer');
    const text = document.getElementById('loadFileText');

    target.addEventListener('dragover', e => e.preventDefault());
    target.addEventListener('dragstart', e => {
        console.log('dragstart');
        Elements.unhide('loadFileText');
    });
    target.addEventListener('dragenter', e => {
        console.log('dragenter');
        Elements.unhide('loadFileText');
    });
    target.addEventListener('dragover', e => {
        console.log('dragover');
        Elements.unhide('loadFileText');
    });
    target.addEventListener('dragleave', e => {
        console.log('dragleave');
        Elements.hide('loadFileText');
    });
    target.addEventListener('dragend', e => {
        console.log('dragend');
        Elements.hide('loadFileText');
    });
    target.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();

        Elements.hide('loadFileText');

        const dt = e.dataTransfer;
        const file = dt.files?.[0];

        load(file);
    }, false);
}
