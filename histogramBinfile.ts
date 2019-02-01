import {appendFile as appendFileCb, readFileSync, writeFileSync} from 'fs';
import pify from 'pify';

import {combinations} from './comb';
import {initCards} from './skinnyRank'
import {enumerate} from './utils';

let appendFile = pify(appendFileCb);
const {shorts} = initCards();

function searchBuf3(buf: Buffer, r: number, npocket: number, verbose: boolean = false): Map<string, number[]>[] {
  let char2num: Map<string, number> = new Map();
  for (let [i, c] of enumerate(shorts)) { char2num.set(c, i); }
  let maps: Map<string, number[]>[] = Array.from(Array(shorts.length), _ => new Map());
  let z = Array.from(Array(10), _ => 0);
  {
    let i = 0;
    for (let pocket of combinations(shorts, npocket)) {
      if (verbose && (++i) % 1e5 === 0) { process.stdout.write((i / 1e6).toString() + ' '); }
      maps[(char2num.get(pocket[0]) || 0)].set(pocket.join(''), z.slice());
    }
  }
  console.log('Done creating all maps');
  const buflen = buf.length;
  let i = 0;
  for (let n = 0; n < buflen; n += (r + 1)) {
    if (verbose && (++i) % 1e5 === 0) { console.log(i / 1e6); }
    const hand = buf.subarray(n, n + r).toString().split('');
    const rankIdx = buf[n + r] - 1;
    for (let pocket of combinations(hand, npocket)) {
      (maps[(char2num.get(pocket[0]) || 0)].get(pocket.join('')) as number[])[rankIdx]++;
    }
  }
  return maps;
}

if (require.main === module) {
  (async () => {
    const r = 7;
    let buf = readFileSync('handsScore-' + r + '.bin');
    {
      let occurrences = Array.from(Array(10 + 1), _ => 0);
      for (let n = r; n < buf.length; n += (r + 1)) { occurrences[buf[n]]++; }
      console.log(occurrences.map((n, i) => [n, i]));
    }
    let args = process.argv.slice(2).map(parseInt);
    for (let npocket of args) {
      const fname = `map-r-${r}-n-${npocket}-search3.ldjson`;
      writeFileSync(fname, "");

      let strings: string[] = [];

      for (let map of searchBuf3(buf, r, npocket, true)) {
        for (let kv of map) {
          if (strings.length === 1000) {
            await appendFile(fname, strings.join('\n'));
            strings = [];
          }
          strings.push(JSON.stringify(kv))
        }
      }
      await appendFile(fname, strings.join('\n'));
    }
  })();
}
