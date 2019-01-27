"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function* range(start, end) {
    for (; start <= end; ++start) {
        yield start;
    }
}
function last(arr) { return arr[arr.length - 1]; }
function* numericCombinations(n, r, loc = []) {
    const idx = loc.length;
    if (idx === r) {
        yield loc;
        return;
    }
    for (let next of range(idx ? last(loc) + 1 : 0, n - r + idx)) {
        yield* numericCombinations(n, r, loc.concat(next));
    }
}
exports.numericCombinations = numericCombinations;
function* combinations(arr, r) {
    for (let idxs of numericCombinations(arr.length, r)) {
        yield idxs.map(i => arr[i]);
    }
}
exports.combinations = combinations;
if (module === require.main) {
    let i = 0;
    for (let o of numericCombinations(52, 7)) {
        i++;
    }
    console.log(i);
    const shorts = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    let j = 0;
    // for (let o of combinations(shorts, 6)) { j += o.length; }
    console.log(j);
}
