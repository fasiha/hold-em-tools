"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const app = express_1.default();
app.use(require('compression')());
const port = process.env.PORT || 4000;
// app.get('/', async (req, res) => {});
app.use(express_1.default.static('.'));
const server = app.listen(port, () => console.log(`Server started, localhost:${port}`));
const io = new socket_io_1.default(server);
io.on('connection', s => {
    console.log('connected');
    s.on('play-hold-em', (data) => {
        const room = data.tableName;
        s.join(room, e => {
            if (!e) {
                console.log('received', data);
                io.in(room).emit(room, data);
            }
            else {
                console.error('ERROR', e);
            }
        });
    });
    // s.on('disconnect', () => {console.log('SOME ONE DISCONNECTED!!!')}) // we don't really handle this.
});
