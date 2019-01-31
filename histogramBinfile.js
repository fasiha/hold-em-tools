"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const pify_1 = __importDefault(require("pify"));
const comb_1 = require("./comb");
const skinnyRank_1 = require("./skinnyRank");
let appendFile = pify_1.default(fs_1.appendFile);
const { shorts } = skinnyRank_1.initCards();
/**
 * For when `npocket` is big and the str2num map can't store the 10-long numeric arrays
 */
function searchBufBigN(buf, r, npocket, verbose = false) {
    let str2num = new Map();
    let i = 0;
    for (let pocket of comb_1.combinations(shorts, npocket)) {
        str2num.set(pocket.join(''), i * 10);
        i++;
        if (verbose && i % 1e4 === 0) {
            console.log(i / 1e6);
        }
    }
    let hugeOccurBuffer = new Uint32Array(i * 10);
    i = 0;
    const buflen = buf.length;
    // console.log(hugeOccurBuffer.length, str2num.size, str2num.get('yz'));
    for (let n = 0; n < buflen; n += (r + 1)) {
        if (verbose && (++i) % 1e5 === 0) {
            console.log(i / 1e6);
        }
        const hand = buf.subarray(n, n + r).toString().split('');
        const rankIdx = buf[n + r] - 1;
        for (let pocket of comb_1.combinations(hand, npocket)) {
            hugeOccurBuffer[rankIdx + str2num.get(pocket.join(''))]++;
        }
    }
    return bigNToStrNumArr(str2num, hugeOccurBuffer);
}
function* bigNToStrNumArr(str2num, occurBuf) {
    let num2str = new Map();
    for (const [k, v] of str2num) {
        num2str.set(v, k);
    }
    let buflen = occurBuf.length;
    for (let i = 0; i < buflen; i += 10) {
        yield [num2str.get(i), Array.from(occurBuf.slice(i, i + 10))];
    }
}
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
        const r = 7;
        let buf = fs_1.readFileSync('handsScore-' + r + '.bin');
        {
            let occurrences = Array.from(Array(10 + 1), _ => 0);
            for (let n = r; n < buf.length; n += (r + 1)) {
                occurrences[buf[n]]++;
            }
            console.log(occurrences.map((n, i) => [n, i]));
        }
        for (let npocket of [6]) {
            let isNBig = npocket >= 6;
            // isNBig = true;
            const fname = `map-r-${r}-n-${npocket}-nbig-${isNBig}.ldjson`;
            fs_1.writeFileSync(fname, "");
            let strings = [];
            for (let kv of (isNBig ? searchBufBigN(buf, r, npocket, true) : searchBuf(buf, r, npocket, true))) {
                if (strings.length === 1000) {
                    yield appendFile(fname, strings.join('\n'));
                    strings = [];
                }
                strings.push(JSON.stringify(kv));
            }
            yield appendFile(fname, strings.join('\n'));
        }
    }))();
}
