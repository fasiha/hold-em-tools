"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Does an input string have any kanji? Applies XRegExp's '\Han' Unicode block test.
 * @param s string to test
 * See https://stackoverflow.com/questions/7344871/javascript-regular-expression-to-catch-kanji#comment91884309_7351856
 */
function hasKanji(s) {
    const k = /[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DB5\u4E00-\u9FEF\uF900-\uFA6D\uFA70-\uFAD9]/;
    return k.test(s);
}
exports.hasKanji = hasKanji;
/**
 * Flatten once.
 * @param arr array of arrays
 */
function flatten(arr) { return arr.reduce((memo, curr) => memo.concat(curr), []); }
exports.flatten = flatten;
/**
 * Generates `[index, value]` 2-tuples, so you can `for (let [index, value] of enumerate(v) {...})`.
 * @param v array or iterable iterator to enumerate
 * @param n starting number (defaults to 0)
 *
 * Hat tip: https://docs.python.org/3/library/functions.html#enumerate
 */
function* enumerate(v, n = 0) {
    for (let x of v) {
        yield [n++, x];
    }
}
exports.enumerate = enumerate;
/**
 * Generates tuples slicing across each of the input arrays, like Python's zip.
 * @param arrs arrays to zip over
 *
 * Outputs only as many times as the *shortest* input array.
 * Example:
 * `for (let [num, let] of zip([1, 2, 3], ['one', 'two', 'three', 'four'])) { console.log(num, let); }` produces the
 * following:
 * - `[1, 'one']`
 * - `[2, 'two']`
 * - `[3, 'three']`
 *
 * Hat tip: https://docs.python.org/3/library/functions.html#zip
 */
function* zip(...arrs) {
    const stop = Math.min(...arrs.map(v => v.length));
    for (let i = 0; i < stop; i++) {
        yield arrs.map(v => v[i]);
    }
}
exports.zip = zip;
/**
 * Apply a predicate to an array from its end, returning the continguously-passing sub-array.
 * @param arr Array to filter from the right (end)
 * @param predicate Function to apply to each element, defaults to boolean check
 *
 * See alo `filterLeft`.
 */
function filterRight(arr, predicate = (element) => !!element) {
    let ret = [];
    if (arr.length === 0) {
        return ret;
    }
    for (let idx = arr.length - 1; idx >= 0; idx--) {
        if (predicate(arr[idx])) {
            ret.push(arr[idx]);
        }
        else {
            break;
        }
    }
    return ret.reverse();
}
exports.filterRight = filterRight;
/**
 * Get the leading elements of an array that pass a predicate function.
 * @param arr Array to filter from the beginning (left)
 * @param predicate Function to apply to each element, defaults to boolean check
 *
 * See also `filterRight`.
 */
function filterLeft(arr, predicate = (element) => !!element) {
    let ret = [];
    for (let x of arr) {
        if (predicate(x)) {
            ret.push(x);
        }
        else {
            break;
        }
    }
    return ret;
}
exports.filterLeft = filterLeft;
function argmin(arr, map, status) {
    let smallestElement = undefined;
    let smallestMapped = Infinity;
    let smallestIdx = -1;
    for (const [i, x] of enumerate(arr)) {
        const mapped = map(x);
        if (mapped < smallestMapped) {
            smallestElement = x;
            smallestMapped = mapped;
            smallestIdx = i;
        }
    }
    if (status) {
        status.min = smallestElement;
        status.argmin = smallestIdx;
        status.minmapped = smallestMapped;
    }
    return smallestIdx;
}
exports.argmin = argmin;
function fillHoles(a, b, predicate = (o => !o)) {
    let bidx = 0;
    for (let aidx in a) {
        if (predicate(a[aidx])) {
            a[aidx] = b[bidx++];
        }
    }
    return a;
}
exports.fillHoles = fillHoles;
function setEq(a, b) {
    if (a.size !== b.size) {
        return false;
    }
    return isSuperset(a, b);
}
exports.setEq = setEq;
// From
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#Implementing_basic_set_operations
function isSuperset(set, subset) {
    for (var elem of subset) {
        if (!set.has(elem)) {
            return false;
        }
    }
    return true;
}
exports.isSuperset = isSuperset;
function union(setA, setB) {
    var _union = new Set(setA);
    for (var elem of setB) {
        _union.add(elem);
    }
    return _union;
}
exports.union = union;
function intersection(setA, setB) {
    var _intersection = new Set();
    for (var elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem);
        }
    }
    return _intersection;
}
exports.intersection = intersection;
function difference(setA, setB) {
    var _difference = new Set(setA);
    for (var elem of setB) {
        _difference.delete(elem);
    }
    return _difference;
}
exports.difference = difference;
function reservoirSample(list, N) {
    let ret = [];
    for (let [idx, elem] of enumerate(list)) {
        if (idx < N) {
            ret.push(elem);
        }
        else {
            const r = Math.floor(Math.random() * (idx + 1));
            if (r < N) {
                ret[r] = elem;
            }
        }
    }
    return ret;
}
exports.reservoirSample = reservoirSample;
function groupBy(list, f) {
    let ret = new Map([]);
    for (let x of list) {
        const y = f(x);
        ret.set(y, (ret.get(y) || []).concat(x));
    }
    return ret;
}
exports.groupBy = groupBy;
/**
 * Evaluates the number of combinations, i.e., how many ways can you choose `r` items for `n`.
 *
 * Returns `n! / (r! (n-r)!)`. Evaluates this without using factorials, using only a few arithmetic operations.
 *
 * @param n total number of items available
 * @param r number of items one can choose
 */
function ncr(n, r) {
    let ret = 1;
    for (let i = 0; i < r; i++) {
        ret *= (n - i) / (1 + i);
    }
    return ret;
}
exports.ncr = ncr;
function sum(arr) { return arr.reduce((o, n) => o + n); }
exports.sum = sum;
