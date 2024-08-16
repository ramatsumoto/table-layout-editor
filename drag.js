let clickedRectangle = -1;

function checkForOverlaps(target = null) {
    if(target) {
        return drawn.filter(r => r != target).some(r => r.isOverlapping(target));
    } else {
        const drawnCopy = [...drawn];
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
    drawn.find(r => r.id == clickedRectangle)?.unselect?.();
    clickedRectangle = -1;
}

main.addEventListener('mousedown', e => {
    for(const rectangle of drawn.toReversed()) {
        if(rectangle.hitTest(e.clientX - main.getBoundingClientRect().left, e.clientY - main.getBoundingClientRect().top)) {
            clickedRectangle = rectangle.id;
            rectangle.clicked = true;
            return true;
        }
    }
});

main.addEventListener('mousemove', e => {
    if(clickedRectangle < 0) return ;

    const target = drawn.find(r => r.id == clickedRectangle);
    const others = drawn.filter(r => r != target);
    const [dx, dy] = [e.movementX, e.movementY];
    const [x, y] = [target.x + dx, target.y + dy];

    const outOfBounds = x < 0 || y < 0 || x + target.w > main.width || y + target.h > main.height;
    if(outOfBounds) return;

    target.x = x;
    target.y = y;

    if(e.shiftKey) return;

    for(const edge of Util.edges) {
        const almostAligned = others.map(r => [r, Math.abs(target[edge] - r[edge]), Math.abs(target[edge]) - r[Util.oppositeEdges[edge]]]);
        for(const [other, sameDist, oppositeDist] of almostAligned) {
            if(0 < sameDist && sameDist < 5) {
                target.setEdge(edge, other[edge]);
            }
        }
    }
    
    if(checkForOverlaps(target)) {
        target.x -= dx;
        target.y -= dy;
    }
});

main.addEventListener('mouseup', unselectRectangle);
main.addEventListener('mouseleave', unselectRectangle);

main.addEventListener('dblclick', e => {
    window.getSelection().removeAllRanges?.();
    const adjustedPosition = [e.clientX - main.getBoundingClientRect().left, e.clientY - main.getBoundingClientRect().top];
    const clicked = drawn.find(r => r.hitTest(...adjustedPosition));
    
    if(clicked instanceof Panel) {
        showTableDialog(clicked);
    } else if(clicked instanceof Lane) {
        showLaneDialog(clicked);
    } else if(clicked instanceof Group) {
        showGroupDialog(clicked);
    } else if(clicked instanceof Togo) {
        showTogoDialog(clicked);
    } else if(clicked === undefined) {
        showCreationDialog(adjustedPosition);
    }
});

document.body.addEventListener('keydown', e => {
    if(clickedRectangle >= 0) {
        const target = drawn.find(r => r.id == clickedRectangle);
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
        }
    }
});
