import {readFileSync, writeFileSync} from 'fs';

import {combinations} from './comb';
import {initCards} from './skinnyRank'

const {shorts} = initCards();

function searchBuf(buf: Buffer, r: number, npocket: number, verbose: boolean = false) {
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
    const npocket = 3;
    const r = 7;
    let buf = readFileSync('handsScore-' + r + '.bin');
    {
      let occurrences = Array.from(Array(10 + 1), _ => 0);
      for (let n = r; n < buf.length; n += (r + 1)) { occurrences[buf[n]]++; }
      console.log(occurrences.map((n, i) => [n, i]));
    }

    let map = searchBuf(buf, r, npocket, true);
    writeFileSync(`map-r-${r}-n-${npocket}.json`, JSON.stringify(Array.from(map)));
  })();
}
