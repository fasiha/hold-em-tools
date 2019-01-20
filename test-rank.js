const test = require('tape');
const {best4OfAKind, bestFlush, bestStraight, bestStraightFlush} = require('./rank');

const SEP = '/';
const ss = s => new Set(s.trim().split(' ').map(s => s.slice(0, -1) + SEP + s.slice(-1)));

test("bestFlush", t => {
  t.equal(bestFlush(ss('2d 8d 10d 6d Ad')), 14, 'aces high ok');
  t.equal(bestFlush(ss('2d 3d 4d 5d 6d 7d 8d 9d 10d')), 10);
  t.end();
});

test('bestStraight', t => {
  t.equal(bestStraight(ss('2s 3d 4c 5h 6h')), 6);
  t.equal(bestStraight(ss('2s 3d 4c 5h Ah')), 5, 'aces low');
  t.equal(bestStraight(ss('10s Jd Qc Kh Ah')), 14, 'aces hi');
  t.equal(bestStraight(ss('2d 3d 4s 5c 6s 9h 10s Jd Qc')), 6, '4 is not straight, goes lower');
  t.equal(bestStraight(ss('2d 3d 4s 5c 6s 9h 10s Jd Qc Kh')), 13, 'highest in double straights');
  t.end();
});

test('bestStraightFlush', t => {
  t.equal(bestStraightFlush(ss('3c 4c 5c 6c 7c')), 7);
  t.equal(bestStraightFlush(ss('Ac 2c 3c 4c 5c')), 5, 'aces low');
  t.end();
});

test('4 of a kind', t => {
  t.equal(best4OfAKind(ss('3c 3d 3h 3s')), 3);
  t.equal(best4OfAKind(ss('3s 3h 3d 3c')), 3, 'shuffle does not matter');
  t.equal(best4OfAKind(ss('3h 3c 3d 3s')), 3, 'shuffle really does not matter');
  t.equal(best4OfAKind(ss('3h 3c 3d 3s 4h 4c 4d 4s')), 4, 'get highest');
  t.equal(best4OfAKind(ss('3h 3c 3d 3s 4h 4c 4d 4s Ah Ac Ad As')), 14, 'aces high');
  t.end();
});