"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
    return occurrences.slice(1);
}
exports.search = search;
const sqlite3_1 = __importDefault(require("sqlite3"));
if (require.main === module) {
    const npocket = 2;
    const r = 5;
    let buf = fs_1.readFileSync('handsScore-' + r + '.bin');
    {
        let occurrences = Array.from(Array(10 + 1), _ => 0);
        for (let n = r; n < buf.length; n += (r + 1)) {
            occurrences[buf[n]]++;
        }
        console.log(occurrences.map((n, i) => [n, i]));
    }
    let db = new sqlite3_1.default.Database('holdem-r-' + r + '.sqlite');
    // db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS holdem (
      seen TEXT UNIQUE NOT NULL,
      royalFlush NUMBER,
      straightFlush NUMBER,
      fourOak NUMBER,
      fullHouse NUMBER,
      flush NUMBER,
      straight NUMBER,
      threeOak NUMBER,
      twoPair NUMBER,
      pair NUMBER,
      high NUMBER
    )`);
    db.parallelize(() => {
        let i = 0;
        for (let hand of comb_1.combinations(shorts, npocket)) {
            if (++i === 10) {
                break;
            }
            let s = hand.join('');
            let thisOccur = search(buf, r, s);
            console.log(hand, thisOccur, 'writing');
            db.run("INSERT INTO holdem VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [s, ...thisOccur], e => {
                console.log('inserted');
                if (e) {
                    console.error('SQLITE error', e);
                    throw e;
                }
            });
        }
    });
    // });
    db.close();
}
