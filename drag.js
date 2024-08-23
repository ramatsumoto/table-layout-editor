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
}

main.addEventListener('mousedown', e => {
    for(const rectangle of State.drawn.toReversed()) {
        if(State.mode == 'register' && rectangle.hitTest(...State.mouse)) {
            clickedRectangle = rectangle.id;
            rectangle.clicked = true;
            return true;
        }
    }
});

main.addEventListener('mousemove', e => {
    State.mouse = [e.clientX - main.getBoundingClientRect().left, e.clientY - main.getBoundingClientRect().top];

    if(clickedRectangle < 0) return ;

    const target = State.drawn.find(r => r.id == clickedRectangle);
    const others = State.drawn.filter(r => r != target);
    const [dx, dy] = [e.movementX, e.movementY];
    const [x, y] = [target.x + dx, target.y + dy];

    if(target.isOutOfBounds() && !e.shiftKey) return;

    target.x = x;
    target.y = y;

    canvasHasChanged();

    if(e.shiftKey) return;

    for(const edge of Util.edges) {
        const almostAligned = others.map(r => [r, Math.abs(target[edge] - r[edge]), Math.abs(target[edge]) - r[Util.oppositeEdges[edge]]]);
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

main.addEventListener('mouseup', unselectRectangle);
main.addEventListener('mouseleave', unselectRectangle);

main.addEventListener('dblclick', e => {
    window.getSelection().removeAllRanges?.();
    const clicked = State.drawn.toReversed().find(r => r.hitTest(...State.mouse));
    
    dialog.dataset.id = clicked?.id ?? -1;

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
    if(clickedRectangle >= 0) {
        const target = State.drawn.find(r => r.id == clickedRectangle);
        if('wasdWASD'.includes(e.key)) canvasHasChanged();

        switch(e.key) {
            case 'w':
                target.y -= 1;
                break;
            case 'a':
                target.x -= 1;
                break;
            case 's':
                target.y += 1;
                break;
            case 'd':
                target.x += 1;
                break;
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
        target.y = Math.min(Math.max(0, target.y), main.height);
        target.x = Math.min(Math.max(0, target.x), main.width);
    }
});
