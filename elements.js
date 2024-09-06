const Elements = {
    /**
     * An idempotent alias for `document.getElementById()`.
     * 
     * Unlike `getElementById`, the context will always be `document` meaning using this method won't throw Illegal Invocation errors.
     * 
     * `[...].map(document.getElementById)` throws an error but `[...].map(Elements.get)` will not.
     * @param {string | Element} idOrElem The ID of the element to get or the element.
     * @returns The element with the given id, or the input if it was already an element.
     */
    get: (idOrElem) => {
        if(typeof idOrElem == 'string') {
            return document.getElementById(idOrElem);
        }
        return idOrElem;
    },
    /**
     * Calls `document.getElementById` on a list of IDs.
     * @see {@link Elements.get}
     * @param {string[]} ids A list of IDs of elements
     * @returns {Element[]} The elements with the specified IDs
     */
    getAll: (ids) => {
        return ids.map(Elements.get);
    },
    /**
     * Gets the element as specified by `idOrElem`. If this element is contained in a `<label>`,
     *  this will return the parent label element instead.
     * 
     * This is only used for hiding/showing elements.
     * @see {@link Elements.get}
     * @see {@link Elements.hide}
     * @see {@link Elements.unhide}
     * @param {string | Element} idOrElem The id of the element or the element itself.
     * @returns 
     */
    getWithLabel: (idOrElem) => {
        const elem = Elements.get(idOrElem);
        if(elem.parentElement.tagName == 'LABEL') {
            return elem.parentElement;
        } else {
            return elem;
        }
    },
    /**
     * Hides the specified element, as well as its parent `<label>` if it has one.
     * @param {string | Element} idOrElem The element or the ID of the element to hide
     */
    hide: (idOrElem) => Elements.getWithLabel(idOrElem).toggleAttribute('hidden', true),
    /**
     * Stops hiding the specified element, as well as its parent `<label>` if it has one.
     * @param {string | Element} idOrElem The element or the ID of the element to stop hiding
     */
    unhide: (idOrElem) => Elements.getWithLabel(idOrElem).toggleAttribute('hidden', false),
    /**
     * Gets the value of the specified element. To be called on `<input>` or `<select>` elements.
     * @param {string | Element} idOrElem The element or its ID
     * @returns {string} The value of the specified element
     */
    value: (idOrElem) => Elements.get(idOrElem).value,
    /**
     * Gets the numerical value of the specified element. To be called mostly on `<input type="number">` elements.
     * @see {@link Elements.value}
     * @param {string | Element} idOrElem The element or its ID 
     * @returns {number} The value of the specified element as a number
     */
    valueAsNum: (idOrElem) => +Elements.value(idOrElem),
    /**
     * Programatically dispatches an Input Event on the specified element.
     * 
     * To be used when you `addEventListener` and want to call it immediately. 
     * @param {string | Element} idOrElem The element of its ID
     */
    fireInputEvent: (idOrElem) => Elements.get(idOrElem).dispatchEvent(new InputEvent('input')),
}