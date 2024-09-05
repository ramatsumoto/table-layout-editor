const Math2 = {
    intersection: ([min1, max1], [min2, max2]) => [Math.max(min1, min2), Math.min(max1, max2)],
    isDisjoint: ([min1, max1], [min2, max2]) => (max1 < min2) || (max2 < min1),
    isOverlapping: (range1, range2, includeEdges = false) => 
        !Math2.isDisjoint(range1, range2) && 
        (new Set(Math2.intersection(range1, range2)).size != 1 || includeEdges),
    sum: (arr) => arr.reduce((a, b) => a + b, 0),
    average: (...n) => Math2.sum(n) / n.length,
    roundTo: (step) => n => Math.round(n / step) * step,
    clamp: (min, x, max) => Math.max(min, Math.min(x, max)),
    max: (arr, mapFunc = (x) => x) => arr.toSorted((a, b) => mapFunc(b) - mapFunc(a))[0],
    min: (arr, mapFunc = (x) => x) => arr.toSorted((a, b) => mapFunc(a) - mapFunc(b))[0],
    sortAscending: (a, b) => a - b,
    sortAscending: (a, b) => b - a,
}