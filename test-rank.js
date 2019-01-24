const test = require('tape');
const {
  validate,
  bestHighCard,
  best2Pairs,
  bestPair,
  best3OfAKind,
  bestFullHouse,
  best4OfAKind,
  bestFlush,
  bestStraight,
  bestStraightFlush
} = require('./rank');

const SEP = '/';
const ss = s => {
  const arr = s.trim().split(' ').map(s => s.slice(0, -1) + SEP + s.slice(-1));
  if (validate(arr)) { return new Set(arr); }
  throw new Error('invalid');
};

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
  t.deepEqual(best4OfAKind(ss('3c 3d 3h 3s')), [3, 0]);
  t.deepEqual(best4OfAKind(ss('3s 3h 3d 3c')), [3, 0], 'shuffle does not matter');
  t.deepEqual(best4OfAKind(ss('3h 3c 3d 3s')), [3, 0], 'shuffle really does not matter');
  t.deepEqual(best4OfAKind(ss('3h 3c 3d 3s 4h 4c 4d 4s')), [4, 3], 'get highest');
  t.deepEqual(best4OfAKind(ss('3h 3c 3d 3s 4h 4c 4d 4s Ah Ac Ad As')), [14, 4], 'aces high');
  t.deepEqual(best4OfAKind(ss('3c 3d 3s')), [0, 0], '3 doesn\'t cut it');
  t.deepEqual(best4OfAKind(ss('3c 3d')), [0, 0], '2 doesn\'t cut it');
  t.deepEqual(best4OfAKind(ss('3c')), [0, 0], '1 doesn\'t cut it');
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
  t.deepEqual(bestFullHouse(ss('Kc Kh Kd 7s 7c Qs Qd Qh')), [13, 12], 'do not ignore second trips higher than pairs');
  t.end();
});

test('3 of a kind', t => {
  t.deepEqual(best3OfAKind(ss('Ac Ah Ad 7s 7c')), [14, 7, 7], 'aces high');
  t.deepEqual(best3OfAKind(ss('Kc Kh Kd 7s 7c')), [13, 7, 7]);
  t.deepEqual(best3OfAKind(ss('Kc Kh Kd 7s 7c 7c')), [13, 7, 7], 'two trips ok');
  t.deepEqual(best3OfAKind(ss('Kc Kh Kd Ks 7s 7c 7d')), [13, 13, 7], 'quads and trips ok');
  t.deepEqual(best3OfAKind(ss('Kc Kh Kd Ks 7s 7c 7d 7h')), [13, 13, 7], 'quads and quads ok');
  t.deepEqual(best3OfAKind(ss('Kc Kh Kd Ks 7s 7d 2s 2c 2d 2h')), [13, 13, 7], 'quads quads high-pairs get pairs');
  t.deepEqual(best3OfAKind(ss('2c 2h 2d 2s 7s 7c 7d')), [7, 2, 2], 'low quad and high trips means trip');
  t.deepEqual(best3OfAKind(ss('2c 2h 2d 2s 7s 7c')), [2, 7, 7], 'low quad and high pairs means low');
  t.deepEqual(best3OfAKind(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7s 7c')), [4, 7, 7], 'many quads and high pair');
  t.deepEqual(best3OfAKind(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7c 7s 7h 6s 6d')), [7, 6, 6],
              'quads can be ignored');
  t.deepEqual(best3OfAKind(ss('Kc Kh 7s 7c')), [0, 0, 0], 'not full house');
  t.deepEqual(best3OfAKind(ss('Kc 7s 7d 7h')), [7, 13, 0], 'trip but no pair');
  t.deepEqual(best3OfAKind(ss('7s 7d 7h')), [7, 0, 0], 'trip and nothing else');
  t.deepEqual(best3OfAKind(ss('7s 7d')), [0, 0, 0], 'pair and nothing else');
  t.end();
});

test('best two pairs', t => {
  t.deepEqual(best2Pairs(ss('Kc Kh Kd 7s 7c')), [13, 7, 13]);
  t.deepEqual(best2Pairs(ss('Kc Kh Kd 7s 7c 7c')), [13, 7, 13], 'two trips ok');
  t.deepEqual(best2Pairs(ss('Kc Kh Kd Ks 7s 7c 7d')), [13, 13, 7], 'quads and trips ok');
  t.deepEqual(best2Pairs(ss('Kc Kh Kd Ks 7s 7c 7d 7h')), [13, 13, 7], 'quads and quads ok');
  t.deepEqual(best2Pairs(ss('Kc Kh Kd Ks 7s 7d 2s 2c 2d 2h')), [13, 13, 7], 'quads quads high-pairs get pairs');
  t.deepEqual(best2Pairs(ss('2c 2h 2d 2s 7s 7c 7d')), [7, 2, 7], 'low quad and high trips means trip');
  t.deepEqual(best2Pairs(ss('2c 2h 2d 2s 7s 7c')), [7, 2, 2], 'low quad and high pairs means low');
  t.deepEqual(best2Pairs(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7s 7c')), [7, 4, 4], 'many quads and high pair');
  t.deepEqual(best2Pairs(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7c 7s 7h 6s 6d')), [7, 6, 7], 'quads can be ignored');
  t.deepEqual(best2Pairs(ss('2c 2h 2d 2s 3s')), [2, 2, 3], 'quads can be 2 pairs'); // FIXME
  t.deepEqual(best2Pairs(ss('Kc Kh 7s 7c')), [13, 7, 0], 'not full house');
  t.deepEqual(best2Pairs(ss('Kc 7s 7d 7h')), [0, 0, 0], 'trip but no pair');
  t.deepEqual(best2Pairs(ss('7s 7d 7h')), [0, 0, 0], 'trip and nothing else');
  t.deepEqual(best2Pairs(ss('7s 7d')), [0, 0, 0], 'pair and nothing else');
  t.deepEqual(best2Pairs(ss('Ac Ah Ad 7s 7c')), [14, 7, 14], 'aces high');

  t.end();
});

test('best pair', t => {
  t.deepEqual(bestPair(ss('Kc Kh Kd 7s 7c')), [13, 13, 7, 7]);
  t.deepEqual(bestPair(ss('Kc Kh Kd 7s 7c 7c')), [13, 13, 7, 7], 'two trips ok, returns at most 4');
  t.deepEqual(bestPair(ss('Kc Kh Kd Ks 7s 7c 7d')), [13, 13, 13, 7], 'quads and trips ok');
  t.deepEqual(bestPair(ss('Kc Kh Kd Ks 7s 7c 7d 7h')), [13, 13, 13, 7], 'quads and quads ok');
  t.deepEqual(bestPair(ss('Kc Kh Kd Ks 7s 7d 2s 2c 2d 2h')), [13, 13, 13, 7], 'quads quads high-pairs get pairs');
  t.deepEqual(bestPair(ss('2c 2h 2d 2s 7s 7c 7d')), [7, 7, 2, 2], 'low quad and high trips means trip');
  t.deepEqual(bestPair(ss('2c 2h 2d 2s 7s 7c')), [7, 2, 2, 2], 'low quad and high pairs means low');
  t.deepEqual(bestPair(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7s 7c')), [7, 4, 4, 4], 'many quads and high pair');
  t.deepEqual(bestPair(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7c 7s 7h 6s 6d')), [7, 7, 6, 6], 'quads can be ignored');
  t.deepEqual(bestPair(ss('Kc Kh 7s 7c')), [13, 7, 7], 'not full house');
  t.deepEqual(bestPair(ss('Kc 7s 7d 7h')), [7, 13, 7], 'trip but no pair');
  t.deepEqual(bestPair(ss('7s 7d 7h')), [7, 7], 'trip and nothing else');
  t.deepEqual(bestPair(ss('7s 7d')), [7], 'pair and nothing else');
  t.deepEqual(bestPair(ss('7s')), [0, 0, 0, 0], 'single');
  t.deepEqual(bestPair(ss('7s 8s 9s 10s')), [0, 0, 0, 0], 'no pair => 4 zeros');
  t.deepEqual(bestPair(ss('7s 8s 9s 10s Js Qs Ks')), [0, 0, 0, 0], 'tons of no pair still has 4 zeros');
  t.deepEqual(bestPair(ss('Ac Ah Ad 7s 7c')), [14, 14, 7, 7], 'aces high');
  t.end();
});

test('best high card', t => {
  t.deepEqual(bestHighCard(ss('Kc Kh Qs Js 10s 9s 8s 7s')), [13, 13, 12, 11, 10], 'at most five returned');
  t.deepEqual(bestHighCard(ss('Kc Kh 7s 7c Kd')), [13, 13, 13, 7, 7]);
  t.deepEqual(bestHighCard(ss('Ac Kh Kd 7s 7c')), [14, 13, 13, 7, 7]);
  t.deepEqual(bestHighCard(ss('2c 3c 4c Ac')), [14, 4, 3, 2]);
  t.end();
});

test('validate', t => {
  t.ok(ss('Kc Kh 7s 7c Kd'));
  t.throws(() => ss('Xc Kh 7s 7c Kd'));
  t.throws(() => ss('Xq Kh 7s 7c Kd'));
  t.throws(() => ss('2q Kh 7s 7c Kd'));
  t.throws(() => ss('11h Kh 7s 7c Kd'), '11 is not ok');
  t.throws(() => ss('101h Kh 7s 7c Kd'));
  t.end();
});
