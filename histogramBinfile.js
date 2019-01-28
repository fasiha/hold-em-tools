"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const comb_1 = require("./comb");
const skinnyRank_1 = require("./skinnyRank");
const { shorts } = skinnyRank_1.initCards();
function search(buf, r, key) {
    let occurrences = Array.from(Array(10 + 1), _ => 0);
    let keybuf = Buffer.from(key);
    for (let n = 0; n < buf.length; n += (r + 1)) {
        let hand = buf.subarray(n, n + r);
        let start = 0;
        for (let idx = 0; idx < keybuf.length && start >= 0; idx++) {
            start = hand.indexOf(keybuf[idx], start);
        }
        if (start >= 0) {
            occurrences[buf[n + r]]++;
        }
    }
    return occurrences;
}
if (require.main === module) {
    const r = 5;
    let buf = fs_1.readFileSync('handsScore-' + r + '.bin');
    let occurrences = Array.from(Array(10 + 1), _ => 0);
    for (let n = r; n < buf.length; n += (r + 1)) {
        occurrences[buf[n]]++;
    }
    console.log(occurrences.map((n, i) => [n, i]));
    let npocket = 2;
    let map = new Map();
    for (let hand of comb_1.combinations(shorts, npocket)) {
        map.set(hand.join(), search(buf, r, hand.join()));
        console.log(hand);
    }
    fs_1.writeFileSync(`map-npocket${npocket}.json`, JSON.stringify(Array.from(map)));
    console.log(map);
}
