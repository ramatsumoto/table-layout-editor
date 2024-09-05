function checkForOverlaps(target = null) {
    if(target) {
        return State.drawn.filter(r => r != target).some(r => r.isOverlapping(target));
    } else {
        const drawnCopy = [...State.drawn];
        while(drawnCopy.length) {
            target = drawnCopy.shift();
            if(drawnCopy.some(r => r.isOverlapping(target))) {
                return true;
            }
        }
        return false;
    }
}

function unselectRectangle() {
    for(const r of State.drawn) {
        r.unselect();
    }
}

/**
 * Expected behavior when mouse is clicked
 *      The rectangle the mouse is currently over is clicked
 *      If the clicked rectangle was also selected (green border)
 *          then click on all selected rectangles.
 *      If the clicked rectangle was not selected
 *          then unselect all (other) rectangles.
 */
main.addEventListener('mousedown', e => {
    for(const rectangle of State.drawn.toReversed()) {
        const isClicked = rectangle.hitTest(...State.mouse);

        if(!isClicked) {
            continue;
        }

        if(rectangle.selected) {
            const selected = State.drawn.filter(r => r.selected);
            selected.forEach(r => State.clicked.add(r.id));
        } else {
            rectangle.clicked = true;
            rectangle.selected = true;
            State.clicked.add(rectangle.id);
            State.drawn.filter(r => r != rectangle).forEach(r => r.selected = false);
        }
        return true;
    }

    State.clicked.clear();

    [State.selector.x, State.selector.y] = State.mouse;

    if(e.shiftKey && State.mode == 'handy') {
        const preview = previewSeat(...State.mouse.map(Math2.roundTo(5)));
        if(!checkForOverlaps(preview)) {
            const id = window.prompt('Set table_seating ID.', '1');
            const asNum = Number.parseInt(id);

            if(!Number.isNaN(asNum) && asNum >= 1) {
                const seat = new Seat(preview.x, preview.y, preview.w, preview.h, preview.shape);
                seat.tableID = asNum;
                State.drawn.push(seat);
            }
        }
    }
});

/**
 * Expected behavior when mouse moves:
 *      Update {@link State.mouse}
 *      If clicking and dragging, expand the selection rectangle to mouse position
 *      If there are clicked rectangles, move all rectangles
 *          If shift is pressed, ignore all collision
 *          If multiple rectangles are clicked, move all of them at once
 */
main.addEventListener('mousemove', e => {
    const bcr = main.getBoundingClientRect();
    State.mouse = [e.clientX - bcr.left, e.clientY - bcr.top].map(n => n / State.scale[State.mode]);

    if(e.buttons > 0 && State.clicked.size == 0) {
        State.selector.w = State.mouse[0] - State.selector.x;
        State.selector.h = State.mouse[1] - State.selector.y;
    }

    if(State.clicked.size == 0) return ;

    const [dx, dy] = [e.movementX, e.movementY].map(n => n / State.scale[State.mode]);
    const targets = State.getClicked();
    const others = State.drawn.filter(r => !targets.includes(r));

    if(targets.length > 1) {
        // When moving multiple rectangles at once, collision needs to be disabled
        //  otherwise the rectangles will collide with each other and start changing
        //  how far apart they are from each other.
        for(const t of targets) {
            t.move(dx, dy, true, true);
        }
        // After all rectangles have moved without collision,
        //  a collision test is performed on all selected rectangles, treated as a single unit.
        const overlappingUnselected = targets.some(r => others.some(other => r.isOverlapping(other)));
        if(overlappingUnselected || targets.some(r => r.isOutOfBounds())) {
            for(const t of targets) {
                t.move(-dx, -dy, true);
            }
        }
        return;
    }

    const target = State.getClicked()[0];

    target.move(dx, dy, e.shiftKey);

    canvasHasChanged();

    if(e.shiftKey) return;

    // Snap to almost aligned edges.
    const snappingThreshold = 5;
    for(const edge of Rectangle.Edges) {
        const almostAligned = others.map(r => [r, Math.abs(target[edge] - r[edge]), Math.abs(target[edge] - r[Rectangle.opposite(edge)])]);
        for(const [other, sameDist, oppositeDist] of almostAligned) {
            if(0 < sameDist && sameDist < snappingThreshold) {
                target.setEdge(edge, other[edge]);
            }
        }
    }
});

/**
 * Expected behavior when mouse releases click:
 *      If mouse is released over blank space, everything is unselected
 *      Otherwise select everything the selection rectangle covers.
 */
main.addEventListener('mouseup', () => {
    const isOverClickedRectangle = State.getClicked().some(r => r.hitTest(...State.mouse));

    if(!isOverClickedRectangle) {
        unselectRectangle();
    }
    State.clicked.clear();
    
    for(const r of State.drawn) {
        if(r.isOverlapping(State.selector)) {
            r.selected = true;
        }
    }

    State.selector.w = 0;
    State.selector.h = 0;

});

/**
 * Expected behavior when mouse leaves the canvas:
 *      All rectangles stop being clicked
 *      The selection rectangle is reset/cleared
 */
main.addEventListener('mouseleave', () => {
    State.clicked.clear();
    State.selector.w = 0;
    State.selector.h = 0;
});

/**
 * Expected behavior when double clicking:
 *      Opens a dialog
 *          This dialog depends on what was clicked as well as the mode.
 */
main.addEventListener('dblclick', e => {
    window.getSelection().removeAllRanges?.();
    const clicked = State.drawn.toReversed().find(r => r.hitTest(...State.mouse));
    
    dialog.dataset.id = clicked?.id ?? -1;

    if(State.mode == 'handy') {
        if(clicked instanceof Seat) {
            showDialog('seat');
        } else if(clicked == undefined) {
            dialog.dataset.x = Math2.roundTo(5)(State.mouse[0]);
            dialog.dataset.y = Math2.roundTo(5)(State.mouse[1]);
            showDialog('handy');
        }
        return;
    }

    if(State.mode == 'register') {
        if(clicked instanceof Panel) {
            showDialog('panel');
        } else if(clicked instanceof Lane) {
            showDialog('lane');
        } else if(clicked instanceof Group) {
            showDialog('group');
        } else if(clicked instanceof Togo) {
            showDialog('togo');
        } else if(clicked === undefined) {
            dialog.dataset.x = Math.round(State.mouse[0]);
            dialog.dataset.y = Math.round(State.mouse[1]);
            showDialog('create');
        }
    }
});

document.body.addEventListener('keydown', e => {
    const selected = new Set(State.drawn.filter(r => r.selected).map(r => r.id));
    const clicked = selected.union(State.clicked);

    if(clicked.size > 0) {
        const targets = [...clicked].map(id => State.drawn.find(r => r.id == id));
        if('wasdWASD'.includes(e.key)) canvasHasChanged();

        switch(e.key) {
            case 'w':
                targets.forEach(t => t.move(0, -1, true));
                break;
            case 'a':
                targets.forEach(t => t.move(-1, 0, true));
                break;
            case 's':
                targets.forEach(t => t.move(0, 1, true));
                break;
            case 'd':
                targets.forEach(t => t.move(1, 0, true));
                break;
            case 'Backspace':
            case 'Delete':
                const text = targets.length == 1 ? 'element?' : targets.length + ' elements?';
                if(window.confirm('Delete the selected ' + text)) {
                    clicked.forEach(deleteFromDrawn);
                    State.clicked.clear();
                    canvasHasChanged();
                }
                break;
        }
        if(clicked.size == 1) {
            const target = targets[0];
            switch(e.key) {
                case 'W':
                    target.setEdge('top', 10 * Math.floor((target.top - 1) / 10));
                    break;
                case 'A':
                    target.setEdge('left', 10 * Math.floor((target.left - 1) / 10));
                    break;
                case 'S':
                    target.setEdge('bottom', 10 * Math.ceil((target.bottom + 1) / 10));
                    break;
                case 'D':
                    target.setEdge('right', 10 * Math.ceil((target.right + 1) / 10));
                    break;
                case 'Enter':
                    const dblclick = new MouseEvent('dblclick');
                    State.mouse = target.center.map(n => n * State.scale[State.mode]);
                    main.dispatchEvent(dblclick);
                    break;
            }
        }
        for(const target of targets) {
            target.y = Math2.clamp(0, target.y, +main.dataset.height);
            target.x = Math2.clamp(0, target.x, +main.dataset.height);
        }
    }
    if(State.mode == 'handy') {
        if(e.key == 'Shift') {
            State.shift = true;
        }
    }
});

document.body.addEventListener('keyup', e => {
    if(State.shift && e.key == 'Shift') {
        State.shift = false;
    }
});