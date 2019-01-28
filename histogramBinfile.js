"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const comb_1 = require("./comb");
const skinnyRank_1 = require("./skinnyRank");
const { shorts } = skinnyRank_1.initCards();
function search(buf, r, key) {
    let occurrences = Array.from(Array(10 + 1), _ => 0);
    let keybuf = Buffer.from(key);
    const keylen = key.length;
    outer: for (let n = 0; n < buf.length; n += (r + 1)) {
        let hand = buf.subarray(n, n + r);
        let targetIdx = 0;
        if (hand[r - 2] < keybuf[0]) {
            continue;
        }
        for (let c of hand) {
            if (c > keybuf[targetIdx]) {
                continue outer;
            }
            else if (c === keybuf[targetIdx]) {
                if (++targetIdx === keylen) {
                    occurrences[buf[n + r]]++;
                    continue outer;
                }
            }
        }
    }
    return occurrences;
}
exports.search = search;
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
        let thisOccur = search(buf, r, hand.join(''));
        map.set(hand.join(''), thisOccur);
        console.log(hand, thisOccur);
    }
    fs_1.writeFileSync(`map-npocket${npocket}.json`, JSON.stringify(Array.from(map)));
    console.log(map);
}
