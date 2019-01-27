"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
if (require.main === module) {
    let buf = fs_1.readFileSync('handsScore.bin');
    let occurrences = Array.from(Array(256), _ => 0);
    for (let n of buf) {
        occurrences[n]++;
    }
    console.log(occurrences.map((n, i) => [n, i]));
}
