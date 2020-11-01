import {combinations} from './comb';
import * as pocket from './map-r-7-n-2.json';
import * as flop from './map-r-7-n-3.json';
import {fastScore, initCards, readableToShort, shortToReadable, validateShort} from './skinnyRank';

const {shorts} = initCards();

export function playerAnalysis(shortsSoFar: string[]): {my?: number[], rest?: number[]} {
  const len = shortsSoFar.length;
  if (len === 2) {
    const v: number[] = (pocket as Record<string, number[]>)[shortsSoFar.slice().sort().join('')];
    return {my: v};
  }
  const deckRemaining = shorts.filter(s => !shortsSoFar.includes(s));

  const myHistogram = Array.from(Array(11), _ => 0);
  let restHistogram = Array.from(Array(11), _ => 0);

  if (len < 7) {
    for (const newCards of combinations(deckRemaining, 7 - len)) {
      myHistogram[fastScore(shortsSoFar.concat(newCards).sort().join(''))]++;
    }
  }

  if (len >= 5) {
    const board = shortsSoFar.slice(2);
    if (board.length === 3) {
      restHistogram = [0].concat((flop as Record<string, number[]>)[shortsSoFar.slice().sort().join('')]);
    } else {
      for (const newCards of combinations(deckRemaining, 7 - board.length)) {
        restHistogram[fastScore(board.concat(newCards).sort().join(''))]++;
      }
    }
  }
  return len === 2   ? {my: myHistogram.slice(1)}
         : len === 7 ? {rest: restHistogram.slice(1)}
                     : {my: myHistogram.slice(1), rest: restHistogram.slice(1)};
}

function formatHistogram(v: number[]) {
  const sum = v.reduce((p, c) => p + c);
  return v.map(x => Math.round(x / sum * 1000) / 10);
}

function readablesToShorts(s: string): string[] {
  const arr = s.trim().split(' ').map(s => readableToShort(s));
  if (!arr.every(validateShort)) { throw new Error('invalid'); }
  return arr;
};

if (module === require.main) {
  const readable = 'As Qd Qh 6c Kh 7h 9c' || '2c 6s Qh 7c Js 4c 3d';
  const short = readablesToShorts(readable);
  console.log(readable, short, fastScore(short.slice().sort().join('')))

  for (const len of [2, 5, 6, 7]) {
    const soFar = short.slice(0, len);
    const {my, rest} = playerAnalysis(soFar);

    const summary = soFar.map(shortToReadable).join(' ') + ' '.repeat(4 * (7 - len));
    if (my) { console.log(`My   ${summary}: ${formatHistogram(my).join(' | ')}`); }
    if (rest) { console.log(`Rest ${summary}: ${formatHistogram(rest).join(' | ')}`); }
    console.log('')
  }
}