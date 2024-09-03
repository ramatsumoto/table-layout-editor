const Elements = {
    get: (idOrElem) => {
        if(typeof idOrElem == 'string') {
            return document.getElementById(idOrElem);
        }
        return idOrElem;
    },
    getWithLabel: (idOrElem) => {
        const elem = Elements.get(idOrElem);
        if(elem.parentElement.tagName == 'LABEL') {
            return elem.parentElement;
        } else {
            return elem;
        }
    },
    hide: (idOrElem) => Elements.getWithLabel(idOrElem).toggleAttribute('hidden', true),
    unhide: (idOrElem) => Elements.getWithLabel(idOrElem).toggleAttribute('hidden', false),
    value: (idOrElem) => Elements.get(idOrElem).value,
    valueAsNum: (idOrElem) => +Elements.value(idOrElem),
    fireInputEvent: (idOrElem) => Elements.get(idOrElem).dispatchEvent(new InputEvent('input')),
}