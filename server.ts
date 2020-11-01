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
  let tableName = '';
  console.log('connected');
  s.on('join-room', (room) => {
    console.log('asked to join ' + room);
    tableName = room;
    s.join(room);
    s.on(room, (data) => {
      console.log({room, data});
      io.in(room).emit(room, data);
    })
  });
  // s.on('disconnect', () => {console.log('SOME ONE DISCONNECTED!!!')}) // we don't really handle this.
});
// io.on('hello', })
