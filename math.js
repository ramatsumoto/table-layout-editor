/**
 * @typedef {number[]} Interval A pair of numbers representing a (closed) interval 
 */

const Math2 = {
    /**
     * Creates the interval of the intersection of two intervals.
     * 
     * If the two intervals are disjoint, the result will be nonsense.
     * @param {Interval} interval1 
     * @param {Interval} interval2 
     * @returns {Interval} The intersection of `interval1` and `interval2`.
     */
    intersection: ([min1, max1], [min2, max2]) => [Math.max(min1, min2), Math.min(max1, max2)],
    /**
     * Checks if two intervals are disjoint.
     * @param {Interval} interval1
     * @param {Interval} interval2
     * @returns `true` if the two intervals do not overlap, `false` otherwise.
     */
    isDisjoint: ([min1, max1], [min2, max2]) => (max1 < min2) || (max2 < min1),
    /**
     * Checks if two intervals are overlapping.
     * 
     * By default considers intervals like `[1, 2], [2, 3]` as not overlapping.
     * Set `includeEdges` to `true` to consider them as overlapping.
     * @param {Interval} range1 
     * @param {Interval} range2 
     * @param {boolean} includeEdges Set to `true` to consider adjacent intervals as overlapping
     * @returns `true` if the two intervals are overlapping
     */
    isOverlapping: (range1, range2, includeEdges = false) => 
        !Math2.isDisjoint(range1, range2) && 
        (new Set(Math2.intersection(range1, range2)).size != 1 || includeEdges),
    /**
     * Sums a list of numbers.
     * @param {number[]} arr A list of numbers to sum
     * @returns {number} The summation of the given list.
     */
    sum: (arr) => arr.reduce((a, b) => a + b, 0),
    /**
     * Finds the average of all inputted numbers.
     * @param  {...number} n A sequence of numbers
     * @returns {number} The average of all inputs
     */
    average: (...n) => Math2.sum(n) / n.length,
    /**
     * Returns a function that rounds to the nearest `step`.
     * @param {number} step 
     * @returns {function(number): number} The function that rounds to the nearest `step`.
     */
    roundTo: (step) => n => Math.round(n / step) * step,
    /**
     * Forces `x` to be between `min` and `max`.
     * @param {number} min The lower bound
     * @param {number} x The number to clamp
     * @param {number} max The upper bound
     * @returns `x` if it is between `min` and `max`. `min` if `x <= min` and `max` if `x >= max`.
     */
    clamp: (min, x, max) => Math.max(min, Math.min(x, max)),
    /**
     * Returns a sorting function to be used in {@link Array.sort}.
     * Does not sort anything by itself.
     * 
     * The sorting function will apply `criterion` to all of its inputs.
     * @param {function(any): number} criterion The operation to apply to all inputs before sorting
     */
    sortBy: (criterion = (x) => x) => ({
        ascending: (a, b) => criterion(a) - criterion(b),
        descending: (a, b) => criterion(b) - criterion(a)
    }),
}