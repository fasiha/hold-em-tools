"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const comb_1 = require("./comb");
const skinnyRank_1 = require("./skinnyRank");
const { shorts } = skinnyRank_1.initCards();
function searchBuf(buf, r, npocket, verbose = false) {
    let map = new Map();
    let z = Array.from(Array(10), _ => 0);
    for (let pocket of comb_1.combinations(shorts, npocket)) {
        map.set(pocket.join(''), z.slice());
    }
    const buflen = buf.length;
    let i = 0;
    for (let n = 0; n < buflen; n += (r + 1)) {
        if (verbose) {
            if ((++i) % 1e5 === 0) {
                console.log(i / 1e6);
            }
        }
        const hand = buf.subarray(n, n + r).toString().split('');
        const rankIdx = buf[n + r] - 1;
        for (let pocket of comb_1.combinations(hand, npocket)) {
            map.get(pocket.join(''))[rankIdx]++;
        }
    }
    return map;
}
if (require.main === module) {
    (() => __awaiter(this, void 0, void 0, function* () {
        const npocket = 3;
        const r = 7;
        let buf = fs_1.readFileSync('handsScore-' + r + '.bin');
        {
            let occurrences = Array.from(Array(10 + 1), _ => 0);
            for (let n = r; n < buf.length; n += (r + 1)) {
                occurrences[buf[n]]++;
            }
            console.log(occurrences.map((n, i) => [n, i]));
        }
        let map = searchBuf(buf, r, npocket, true);
        fs_1.writeFileSync(`map-r-${r}-n-${npocket}.json`, JSON.stringify(Array.from(map)));
    }))();
}
