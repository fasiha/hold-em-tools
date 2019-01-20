const test = require('tape');
const {bestFlush, bestStraight, bestStraightFlush} = require('./rank');

const SEP = '/';
const ss = s => new Set(s.trim().split(' ').map(s => s.slice(0, -1) + SEP + s.slice(-1)));
test("bestFlush", t => {
  t.equal(bestFlush(ss('2d 8d 10d 6d Ad')), 14, 'aces high ok');
  t.equal(bestFlush(ss('2d 8d 10d 6d 9d')), 10);
  t.end();
});
test('bestStraight', t => {
  t.equal(bestStraight(ss('2s 3d 4c 5h 6h')), 6);
  t.equal(bestStraight(ss('2s 3d 4c 5h Ah')), 5, 'aces low');
  t.equal(bestStraight(ss('10s Jd Qc Kh Ah')), 14, 'aces hi');
  t.end();
});

test('bestStraightFlush', t => {
  t.equal(bestStraightFlush(ss('3c 4c 5c 6c 7c')), 7);
  t.equal(bestStraightFlush(ss('Ac 2c 3c 4c 5c')), 5, 'aces low');
  t.end();
});