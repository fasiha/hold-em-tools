const test = require('tape');
const {best2Pairs, bestPair, best3OfAKind, bestFullHouse, best4OfAKind, bestFlush, bestStraight, bestStraightFlush} =
    require('./rank');

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
  t.equal(best4OfAKind(ss('3c 3d 3s')), 0, '3 doesn\'t cut it');
  t.equal(best4OfAKind(ss('3c 3d')), 0, '2 doesn\'t cut it');
  t.equal(best4OfAKind(ss('3c')), 0, '1 doesn\'t cut it');

  t.end();
});

test('full house', t => {
  t.deepEqual(bestFullHouse(ss('Kc Kh Kd 7s 7c')), [13, 7]);
  t.deepEqual(bestFullHouse(ss('Kc Kh Kd 7s 7c 7c')), [13, 7], 'two trips ok');
  t.deepEqual(bestFullHouse(ss('Kc Kh Kd Ks 7s 7c 7d')), [13, 7], 'quads and trips ok');
  t.deepEqual(bestFullHouse(ss('Kc Kh Kd Ks 7s 7c 7d 7h')), [13, 7], 'quads and quads ok');
  t.deepEqual(bestFullHouse(ss('Kc Kh Kd Ks 7s 7d 2s 2c 2d 2h')), [13, 7], 'quads quads high-pairs get pairs');
  t.deepEqual(bestFullHouse(ss('2c 2h 2d 2s 7s 7c 7d')), [7, 2], 'low quad and high trips means trip');
  t.deepEqual(bestFullHouse(ss('2c 2h 2d 2s 7s 7c')), [2, 7], 'low quad and high pairs means low');
  t.deepEqual(bestFullHouse(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7s 7c')), [4, 7], 'many quads and high pair');
  t.deepEqual(bestFullHouse(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7c 7s 7h 6s 6d')), [7, 6], 'quads can be ignored');
  t.deepEqual(bestFullHouse(ss('Kc Kh 7s 7c')), [0, 0], 'not full house');
  t.deepEqual(bestFullHouse(ss('Kc 7s 7d 7h')), [0, 0], 'trip but no pair');
  t.deepEqual(bestFullHouse(ss('7s 7d 7h')), [0, 0], 'trip and nothing else');
  t.deepEqual(bestFullHouse(ss('7s 7d')), [0, 0], 'pair and nothing else');
  t.end();
});

test('3 of a kind', t => {
  t.equal(best3OfAKind(ss('Kc Kh Kd 7s 7c')), 13);
  t.equal(best3OfAKind(ss('Kc Kh Kd 7s 7c 7c')), 13, 'two trips ok');
  t.equal(best3OfAKind(ss('Kc Kh Kd Ks 7s 7c 7d')), 13, 'quads and trips ok');
  t.equal(best3OfAKind(ss('Kc Kh Kd Ks 7s 7c 7d 7h')), 13, 'quads and quads ok');
  t.equal(best3OfAKind(ss('Kc Kh Kd Ks 7s 7d 2s 2c 2d 2h')), 13, 'quads quads high-pairs get pairs');
  t.equal(best3OfAKind(ss('2c 2h 2d 2s 7s 7c 7d')), 7, 'low quad and high trips means trip');
  t.equal(best3OfAKind(ss('2c 2h 2d 2s 7s 7c')), 2, 'low quad and high pairs means low');
  t.equal(best3OfAKind(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7s 7c')), 4, 'many quads and high pair');
  t.equal(best3OfAKind(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7c 7s 7h 6s 6d')), 7, 'quads can be ignored');
  t.equal(best3OfAKind(ss('Kc Kh 7s 7c')), 0, 'not full house');
  t.equal(best3OfAKind(ss('Kc 7s 7d 7h')), 7, 'trip but no pair');
  t.equal(best3OfAKind(ss('7s 7d 7h')), 7, 'trip and nothing else');
  t.equal(best3OfAKind(ss('7s 7d')), 0, 'pair and nothing else');
  t.end();
});

test('best two pairs', t => {
  t.deepEqual(best2Pairs(ss('Kc Kh Kd 7s 7c')), [13, 7]);
  t.deepEqual(best2Pairs(ss('Kc Kh Kd 7s 7c 7c')), [13, 7], 'two trips ok');
  t.deepEqual(best2Pairs(ss('Kc Kh Kd Ks 7s 7c 7d')), [13, 7], 'quads and trips ok');
  t.deepEqual(best2Pairs(ss('Kc Kh Kd Ks 7s 7c 7d 7h')), [13, 7], 'quads and quads ok');
  t.deepEqual(best2Pairs(ss('Kc Kh Kd Ks 7s 7d 2s 2c 2d 2h')), [13, 7], 'quads quads high-pairs get pairs');
  t.deepEqual(best2Pairs(ss('2c 2h 2d 2s 7s 7c 7d')), [7, 2], 'low quad and high trips means trip');
  t.deepEqual(best2Pairs(ss('2c 2h 2d 2s 7s 7c')), [7, 2], 'low quad and high pairs means low');
  t.deepEqual(best2Pairs(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7s 7c')), [7, 4], 'many quads and high pair');
  t.deepEqual(best2Pairs(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7c 7s 7h 6s 6d')), [7, 6], 'quads can be ignored');
  t.deepEqual(best2Pairs(ss('Kc Kh 7s 7c')), [13, 7], 'not full house');
  t.deepEqual(best2Pairs(ss('Kc 7s 7d 7h')), [0, 0], 'trip but no pair');
  t.deepEqual(best2Pairs(ss('7s 7d 7h')), [0, 0], 'trip and nothing else');
  t.deepEqual(best2Pairs(ss('7s 7d')), [0, 0], 'pair and nothing else');
  t.end();
});

test('best pair', t => {
  t.equal(bestPair(ss('Kc Kh Kd 7s 7c')), 13);
  t.equal(bestPair(ss('Kc Kh Kd 7s 7c 7c')), 13, 'two trips ok');
  t.equal(bestPair(ss('Kc Kh Kd Ks 7s 7c 7d')), 13, 'quads and trips ok');
  t.equal(bestPair(ss('Kc Kh Kd Ks 7s 7c 7d 7h')), 13, 'quads and quads ok');
  t.equal(bestPair(ss('Kc Kh Kd Ks 7s 7d 2s 2c 2d 2h')), 13, 'quads quads high-pairs get pairs');
  t.equal(bestPair(ss('2c 2h 2d 2s 7s 7c 7d')), 7, 'low quad and high trips means trip');
  t.equal(bestPair(ss('2c 2h 2d 2s 7s 7c')), 7, 'low quad and high pairs means low');
  t.equal(bestPair(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7s 7c')), 7, 'many quads and high pair');
  t.equal(bestPair(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7c 7s 7h 6s 6d')), 7, 'quads can be ignored');
  t.equal(bestPair(ss('Kc Kh 7s 7c')), 13, 'not full house');
  t.equal(bestPair(ss('Kc 7s 7d 7h')), 7, 'trip but no pair');
  t.equal(bestPair(ss('7s 7d 7h')), 7, 'trip and nothing else');
  t.equal(bestPair(ss('7s 7d')), 7, 'pair and nothing else');
  t.equal(bestPair(ss('7s')), 0, 'single');
  t.end();
});