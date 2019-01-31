import {appendFile as appendFileCb, readFileSync, writeFileSync} from 'fs';
import pify from 'pify';

import {combinations} from './comb';
import {initCards} from './skinnyRank'

let appendFile = pify(appendFileCb);
const {shorts} = initCards();

/**
 * For when `npocket` is big and the str2num map can't store the 10-long numeric arrays
 */
function searchBufBigN(buf: Buffer, r: number, npocket: number, verbose: boolean = false) {
  let str2num: Map<string, number> = new Map();
  let i = 0;
  for (let pocket of combinations(shorts, npocket)) {
    str2num.set(pocket.join(''), i * 10);
    i++;
    if (verbose && i % 1e4 === 0) { console.log(i / 1e6); }
  }
  let hugeOccurBuffer = new Uint32Array(i * 10);
  i = 0;
  const buflen = buf.length;
  // console.log(hugeOccurBuffer.length, str2num.size, str2num.get('yz'));
  for (let n = 0; n < buflen; n += (r + 1)) {
    if (verbose && (++i) % 1e5 === 0) { console.log(i / 1e6); }
    const hand = buf.subarray(n, n + r).toString().split('');
    const rankIdx = buf[n + r] - 1;
    for (let pocket of combinations(hand, npocket)) {
      hugeOccurBuffer[rankIdx + (str2num.get(pocket.join('')) as number)]++;
    }
  }
  return bigNToStrNumArr(str2num, hugeOccurBuffer);
}

function* bigNToStrNumArr(str2num: Map<string, number>, occurBuf: Uint32Array): IterableIterator<[string, number[]]> {
  let num2str: Map<number, string> = new Map();
  for (const [k, v] of str2num) { num2str.set(v, k); }
  let buflen = occurBuf.length;
  for (let i = 0; i < buflen; i += 10) { yield [num2str.get(i) as string, Array.from(occurBuf.slice(i, i + 10))]; }
}

function searchBuf(buf: Buffer, r: number, npocket: number, verbose: boolean = false): Map<string, number[]> {
  let map: Map<string, number[]> = new Map();
  let z = Array.from(Array(10), _ => 0);
  for (let pocket of combinations(shorts, npocket)) { map.set(pocket.join(''), z.slice()); }
  const buflen = buf.length;
  let i = 0;
  for (let n = 0; n < buflen; n += (r + 1)) {
    if (verbose) {
      if ((++i) % 1e5 === 0) { console.log(i / 1e6); }
    }
    const hand = buf.subarray(n, n + r).toString().split('');
    const rankIdx = buf[n + r] - 1;
    for (let pocket of combinations(hand, npocket)) { (map.get(pocket.join('')) as number[])[rankIdx]++; }
  }
  return map;
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
    for (let npocket of [6]) {
      let isNBig = npocket >= 6;
      // isNBig = true;

      const fname = `map-r-${r}-n-${npocket}-nbig-${isNBig}.ldjson`;
      writeFileSync(fname, "");

      let strings: string[] = [];

      for (let kv of (isNBig ? searchBufBigN(buf, r, npocket, true) : searchBuf(buf, r, npocket, true))) {
        if (strings.length === 1000) {
          await appendFile(fname, strings.join('\n'));
          strings = [];
        }
        strings.push(JSON.stringify(kv))
      }
      await appendFile(fname, strings.join('\n'));
    }
  })();
}
