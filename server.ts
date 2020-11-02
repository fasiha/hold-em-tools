import express from 'express';
import SocketIO from 'socket.io';

const app = express();
app.use(require('compression')())
const port = process.env.PORT || 4000;

// app.get('/', async (req, res) => {});
app.use(express.static('.'))
const server = app.listen(port, () => console.log(`Server started, localhost:${port}`));

const io = new SocketIO(server);
io.on('connection', s => {
  console.log('connected');
  s.on('play-hold-em', (data) => {
    const room = data.tableName;
    s.join(room, e => {
      if (!e) {
        console.log('received', data);
        io.in(room).emit(room, data)
      } else {
        console.error('ERROR', e);
      }
    });
  });
  // s.on('disconnect', () => {console.log('SOME ONE DISCONNECTED!!!')}) // we don't really handle this.
});
// io.on('hello', })
