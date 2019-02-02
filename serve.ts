import {createReadStream, existsSync} from 'fs';
import leveldown from 'leveldown';
import levelup from 'levelup';
var Linerstream = require('linerstream');

import express from 'express';
const app = express();
const port = 3000;

async function initdb() {
  let db = levelup(leveldown('./hands'));

  try {
    let check = await Promise.all('uvwxyz,vwxyz,wxyz,xyz,yz'.split(',').map(s => db.get(s)));
    if (check.every(b => b.length > 0)) { return db; }
  } catch (e) {}
  console.log('Initializing database, please wait');

  let nrows = 0;
  let maxbatch = 10000;
  let batch: {type: 'put', key: string, value: any}[] = [];
  for (let n = 2; n <= 6; n++) {
    const fname = `map-r-7-n-${n}.ldjson`;
    console.log(fname);
    if (existsSync(fname)) {
      let readStream = createReadStream(`map-r-7-n-${n}.ldjson`, 'utf8');
      let lineByLineStream: IterableIterator<string> = readStream.pipe(new Linerstream());
      for await (const line of lineByLineStream) {
        const str = line.substr(2, n);
        batch.push({type: 'put', key: str, value: line});
        if (batch.length >= maxbatch) {
          await db.batch(batch);
          batch = [];
        }
        nrows++;
        if (nrows % 1e5 === 0) { console.log(nrows / 1e6, str); }
      }
    }
  }
  await db.batch(batch);
  return db;
}

if (require.main === module) {
  (async () => {
    let db = await initdb();

    app.get('/', async (req, res) => {
      if ('hand' in req.query) {
        try {
          const hit = await db.get(req.query.hand);
          res.send(hit.toString());
        } catch (e) { res.status(404).end(); }
      } else {
        res.status(400).end();
      }
    });
    app.listen(port, () => console.log(`Server started. Try $ curl "localhost:${port}/?hand=abc"`));
  })();
}
