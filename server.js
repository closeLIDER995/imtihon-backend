const express = require('express');
const expressFileupload = require('express-fileupload');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const authRouter = require('./src/Router/authRouter');
const postRouter = require('./src/Router/postRouter');
const userRouter = require('./src/Router/userRouter');
const commentRouter = require('./src/Router/commentRouter');
const notlificationRouter = require('./src/Router/notlificationRouter');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

global._io = io;
const onlineUsers = new Map();
global.onlineUsers = onlineUsers;

app.use(express.json());
app.use(cors());
app.use(expressFileupload({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', authRouter);
app.use('/api/post', postRouter);
app.use('/api/user', userRouter);
app.use('/api/comment', commentRouter);
app.use('/api/notlification', notlificationRouter);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (let [key, value] of onlineUsers.entries()) {
      if (value === socket.id) {
        onlineUsers.delete(key);
        break;
      }
    }
    console.log('Socket disconnected:', socket.id);
  });
});

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 4000;


mongoose.connect(MONGO_URL).then(() => {server.listen(PORT, () => {console.log(`Server running on port ${PORT}`);});
  }).catch((error) => {console.error('MongoDB connection error:', error);});
