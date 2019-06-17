import {combinations} from './comb';
import {audiencePrintRealtime, handsToTableCombine, markdownTable, printRealtime, rankNames} from './deal';
import {initCards, readableToShort, validateShort} from './skinnyRank';

function parseRank(s: string): string {
  let res = parseInt(s.replace('A', '1'));
  return isNaN(res) ? s : '' + (res - 1);
};
function readablesToShorts(s: string): string[] {
  const arr = s.trim().split(' ').map(s => readableToShort(parseRank(s.slice(0, -1)), s.slice(-1)));
  if (!arr.every(validateShort)) { throw new Error('invalid'); }
  return arr;
};

function pocketsAndBoard(pockets: string[], board: string): string[][] {
  return pockets.map(pocket => readablesToShorts(pocket.trim() + ' ' + board.trim()));
}

if (module === require.main) {
  (async function() {
    { // watching analysis
      console.log('\n# Audience views');
      console.log('## Game 1');
      await audiencePrintRealtime(readablesToShorts('9d 8h 10d 9s 4s'));
      console.log('## Game 2');
      await audiencePrintRealtime(readablesToShorts('Jh Kc Kd 5c 3c'));
    }

    console.log('\n# Using `boardAndPockets` for a game');
    await printRealtime(pocketsAndBoard('3h 4h, 6d 8h, 7s Js, 10s 6h, 6c Jd'.split(', '), 'Kc 8c 8d Qc As'));
    console.log('\n# Using `readablesToShorts` for several unrelated cards');
    await printRealtime([
      readablesToShorts('Kd 4c 4d 7h 9h 8h 6d'),
      readablesToShorts('5h 5c 8c 4h 4s Qh Ah'),
      readablesToShorts('Qc 10d 10s 7d 10h 2c Jd'),
      readablesToShorts('Jh 3s Js 8s 5d Qd 7c'),
    ]);

    {
      // Pockets, suited and unsuited
      const {shorts} = initCards();
      let pockets = [];
      for (let first of shorts.slice(0, 13)) {
        for (let second of shorts.slice(13, 26)) { pockets.push([first, second]); }
      }
      console.log(markdownTable(await handsToTableCombine(pockets), [`Percents`].concat(rankNames)));

      pockets = [];
      for (let pocket of combinations(shorts.slice(0, 13), 2)) { pockets.push(pocket); }
      console.log(markdownTable(await handsToTableCombine(pockets), [`Percents`].concat(rankNames)));
    }
  })();
}