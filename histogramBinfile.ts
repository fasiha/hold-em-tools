import {readFileSync, writeFileSync} from 'fs';
import pify from "pify";

import {combinations} from './comb';
import {initCards} from './skinnyRank'

var bindAll = require('bind-all');

const {shorts} = initCards();

export function search(buf: Buffer, r: number, key: string): number[] {
  let occurrences = Array.from(Array(10 + 1), _ => 0);
  let keybuf = Buffer.from(key);
  const keylen = key.length;
  outer: for (let n = 0; n < buf.length; n += (r + 1)) {
    let hand = buf.subarray(n, n + r);
    let targetIdx = 0;
    if (hand[r - 2] < keybuf[0]) { continue; }
    for (let c of hand) {
      if (c > keybuf[targetIdx]) {
        continue outer;
      } else if (c === keybuf[targetIdx]) {
        if (++targetIdx === keylen) {
          occurrences[buf[n + r]]++;
          continue outer;
        }
      }
    }
  }
  return occurrences.slice(1);
}

import sqlite3 from 'sqlite3';
if (require.main === module) {
  (async () => {
    const npocket = 3;
    const r = 7;
    let buf = readFileSync('handsScore-' + r + '.bin');
    {
      let occurrences = Array.from(Array(10 + 1), _ => 0);
      for (let n = r; n < buf.length; n += (r + 1)) { occurrences[buf[n]]++; }
      console.log(occurrences.map((n, i) => [n, i]));
    }

    let db: sqlite3.Database = pify(bindAll(new sqlite3.Database(`holdem-r-${r}-n-${npocket}.sqlite`)));
    await db.run(`CREATE TABLE IF NOT EXISTS holdem (
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

    for (let hand of combinations(shorts, npocket)) {
      let s = hand.join('');
      let dbhits: any = await db.get(`SELECT COUNT(1) as hits FROM holdem WHERE seen = ?`, [s]);
      if ('hits' in dbhits && dbhits.hits > 0) { continue; }
      let thisOccur = search(buf, r, s);
      console.log(hand, thisOccur);
      await db.run("INSERT INTO holdem VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [s, ...thisOccur]);
    }
    db.close();
  })();
}
