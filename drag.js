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
    }

    State.clicked.clear();

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

    if(State.clicked.size == 0) return ;

    const [dx, dy] = [e.movementX, e.movementY];
    const targets = [...State.clicked].map(id => State.drawn.find(r => r.id == id));

    if(targets.length > 1) {
        for(const t of targets) {
            t.move(dx, dy, true);
        }
        return;
    }

    const target = State.drawn.find(r => r.id == [...State.clicked][0]);
    const others = State.drawn.filter(r => r != target);

    target.move(dx, dy, e.shiftKey);

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

    if(State.mode == 'handy' && !clicked) {
        dialog.dataset.x = Util.round(5)(State.mouse[0]);
        dialog.dataset.y = Util.round(5)(State.mouse[1]);
        showDialog('handy');
        return;
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