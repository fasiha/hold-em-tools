import {readFileSync} from 'fs';
import fetch from 'node-fetch';

var shuffle = require('knuth-shuffle-seeded');
import {shortToReadable, shortToNumberAcesHigh, fastScore, compareHands, initCards} from './skinnyRank';
import {sum} from './utils';
const {shorts} = initCards();

const rankNames = 'roya,strf,quad,fuho,flus,str8,trip,twop,pair,hica'.split(',');
const score2string: Map<number, string> = new Map(rankNames.map((s, i) => [i + 1, s] as [number, string]));
function sortShorts(hand: string[], ascending: boolean = true): string[] {
  return hand.sort((a, b) => (ascending ? 1 : -1) * (shortToNumberAcesHigh(a) - shortToNumberAcesHigh(b)));
}
function string2readable(hand: string, sort: boolean = false, ascending: boolean = true): string {
  let a = hand.split('');
  if (sort) { sortShorts(a, ascending); }
  return a.map(shortToReadable).join('');
}
function fmt(n: number): string {
  if (n === 0) { return '0'; }
  if (n < .01) { return (n * 100).toExponential(0); }
  return (n * 100).toFixed(1);
}
function prefixScan<T>(arr: T[], init: number = 1): T[][] {
  return arr.slice(init).reduce((o, n) => o.concat([o[o.length - 1].concat(n)]), [arr.slice(0, init)]);
}
function leftpad(str: string, desiredLen: number, padChar: string = ' ') {
  return padChar.repeat(Math.max(0, desiredLen - str.length)) + str;
}
function markdownTable(arr: string[][], header: string[] = []): string {
  let cols = arr[0].length;
  let widths = Array.from(Array(cols), (_, n) => n).map(col => Math.max(...arr.map(v => v[col].length)));
  if (header.length) { arr = [header, header.map((_, col) => '-'.repeat(widths[col]))].concat(arr); }
  return arr.map(row => '| ' + row.map((elt, colidx) => leftpad(elt, widths[colidx], ' ')).join(' | ') + ' |')
      .join('\n');
}
if (module === require.main) {
  (async () => {
    let args = process.argv.slice(2);
    let seed = parseInt(args[0]) || 0;
    let players = parseInt(args[1]) || 4;
    let shuffled = shuffle(shorts.slice(), seed);
    let cards: string[][] = Array.from(Array(players), _ => []);
    for (let cid = 0; cid < 2; cid++) {
      for (let pid = 0; pid < players; pid++) { cards[pid].push(shuffled.pop()); }
    }
    for (let cid = 0; cid < 5; cid++) {
      const c = shuffled.pop();
      for (let pid = 0; pid < players; pid++) { cards[pid].push(c); }
    }

    let objects = cards.map((v, pid) => {
      const initial = sortShorts(v.slice(0, 2)).concat(v.slice(2));
      const hand = v.slice().sort().join('');
      return {pid, hand, initial};
    });
    objects.sort((a, b) => compareHands(a.hand, b.hand));
    for (const {pid, hand, initial} of objects) {
      const score = score2string.get(fastScore(hand));
      const readable =
          [string2readable(initial.slice(0, 2).join(''), true), string2readable(initial.slice(2).join(''), false)].join(
              ' | ');

      console.log(`\n### Seat ${pid + 1} :: ${readable} :: ${score}`);

      let cum = prefixScan(initial.slice(0, 6), 2);
      let table: string[][] = [];
      for (const subhand of cum) {
        const sortedHand = subhand.slice().sort().join('');
        try {
          let [_, arr]: [string, number[]] =
              await (fetch('http://localhost:3000/?hand=' + sortedHand).then(x => x.json()));
          let tot = sum(arr);
          table.push([string2readable(subhand.join(''))].concat(arr.map(n => fmt(n / tot))));
        } catch (e) {}
      }
      console.log(markdownTable(table, ['hand'].concat(rankNames)));
    }
  })();
}