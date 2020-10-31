import express from 'express';
import SocketIO from 'socket.io';

const app = express();
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
      s.to(room).emit(room, data);
    })
  })
});
// io.on('hello', })
