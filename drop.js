{
    const target = document.getElementById('mainContainer');

    target.addEventListener('dragover', e => e.preventDefault());
    target.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();

        const dt = e.dataTransfer;
        const file = dt.files?.[0];

        if (!file) return;

        if (file.type != 'application/json') return;

        if (file && confirm(`Load file ${file.name}? (Will overwrite current work)`)) {
            Serialize.loadFromFile(file);
        }
    }, false);
}
