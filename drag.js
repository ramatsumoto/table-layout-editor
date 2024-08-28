let clickedRectangle = -1;

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
    State.drawn.find(r => r.id == clickedRectangle)?.unselect?.();
    clickedRectangle = -1;
    State.clicked.clear();
    for(const r of State.drawn) {
        r.unselect();
    }
}

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
            State.clicked.add(rectangle.id);
        }
        return true;

        if(State.mode == 'register' && isClicked) {
            clickedRectangle = rectangle.id;
            rectangle.clicked = true;
            State.clicked.add(rectangle.id);
            return true;
        }
        if(State.mode == 'handy' && rectangle.hitTest(...State.mouse.map(Util.round(5)))) {
            if(e.shiftKey) {
                deleteFromDrawn(rectangle.id);
            } else {
                rectangle.changeID();
            }
            canvasHasChanged();
            return true;
        }
    }

    State.clicked.clear();
    
    if(State.mode == 'handy') {        
        let [x, y] = State.mouse.map(Util.round(5));

        if(Util.arrEquals(State.origin, [x, y])) {
            State.originClicked = true;
            return;
        }

        const [width, height, shape, count, direction] = 
            ['setSeatWidth', 'setSeatHeight', 'setSeatShape', 'setSeatCount', 'setSeatDirection'].map(id => +Util.value(id));

        const seats = [];
        for(const i of Array(count)) {
            const seat = new Seat(x, y, width, height, shape);
            seats.push(seat);
            if(direction) {
                x += width;
            } else {
                y += height;
            }
        }
        if(seats.some(checkForOverlaps)) return;

        State.drawn.push(...seats);
        canvasHasChanged();
    }

    [State.selector.x, State.selector.y] = State.mouse;
});

main.addEventListener('mousemove', e => {
    State.mouse = [e.clientX - main.getBoundingClientRect().left, e.clientY - main.getBoundingClientRect().top];
    if(e.buttons > 0 && State.clicked.size == 0) {
        State.selector.w = State.mouse[0] - State.selector.x;
        State.selector.h = State.mouse[1] - State.selector.y;
    }

    if(State.originClicked) {
        State.origin = State.mouse.map(Util.round(5));
        return;
    }

    if(clickedRectangle < 0 && State.clicked.size == 0) return ;

    const [dx, dy] = [e.movementX, e.movementY];
    const targets = [...State.clicked].map(id => State.drawn.find(r => r.id == id));

    if(targets.length > 1) {
        for(const t of targets) {
            t.x += dx;
            t.y += dy;
        }
        return;
    }

    const target = State.drawn.find(r => r.id == [...State.clicked][0]);
    const [x, y] = [target.x + dx, target.y + dy];
    const others = State.drawn.filter(r => r != target);

    if(target.isOutOfBounds() && !e.shiftKey) return;

    target.x = x;
    target.y = y;

    canvasHasChanged();

    if(e.shiftKey) return;

    for(const edge of Util.edges) {
        const almostAligned = others.map(r => [r, Math.abs(target[edge] - r[edge]), Math.abs(target[edge] - r[Util.oppositeEdges[edge]])]);
        for(const [other, sameDist, oppositeDist] of almostAligned) {
            if(0 < sameDist && sameDist < 5) {
                target.setEdge(edge, other[edge]);
            }
        }
    }
    
    if(checkForOverlaps(target) || target.isOutOfBounds()) {
        target.x -= dx;
        target.y -= dy;
    }
});

main.addEventListener('mouseup', () => {
    unselectRectangle();
    State.originClicked = false;
    
    for(const r of State.drawn) {
        if(r.isOverlapping(State.selector)) {
            r.selected = true;
        }
    }

    State.selector.w = 0;
    State.selector.h = 0;

});
main.addEventListener('mouseleave', unselectRectangle);

main.addEventListener('dblclick', e => {
    window.getSelection().removeAllRanges?.();
    const clicked = State.drawn.toReversed().find(r => r.hitTest(...State.mouse));
    
    dialog.dataset.id = clicked?.id ?? -1;

    if(State.mode == 'handy') {
        return console.log('this isnt real yet');
    }

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
});

document.body.addEventListener('keydown', e => {
    if(State.clicked.size > 0) {
        const targets = [...State.clicked].map(id => State.drawn.find(r => r.id == id));
        if('wasdWASD'.includes(e.key)) canvasHasChanged();

        switch(e.key) {
            case 'w':
                targets.forEach(t => t.y -= 1);
                break;
            case 'a':
                targets.forEach(t => t.x -= 1);
                break;
            case 's':
                targets.forEach(t => t.y += 1);
                break;
            case 'd':
                targets.forEach(t => t.x += 1);
                break;
        }
        if(State.clicked.size == 1) {
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
            }
        }
        for(const target of targets) {
            target.y = Math.min(Math.max(0, target.y), main.height);
            target.x = Math.min(Math.max(0, target.x), main.width);
        }
    }
    if(State.mode == 'handy') {
        if(e.key == 'Shift') {
            State.shift = true;
        }

        const shiftNum = '!@#$%^&*()'.indexOf(e.key);
        if(shiftNum >= 0) {
            document.getElementById('setSeatCount').value = shiftNum + 1;
        }
    }
});

document.body.addEventListener('keyup', e => {
    if(State.shift && e.key == 'Shift') {
        State.shift = false;
    }
});