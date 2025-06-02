const express = require('express');
const expressFileUpload = require('express-fileupload');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('./src/Model/notificatoinModel');

dotenv.config();

const authRouter = require('./src/Router/authRouter');
const postRouter = require('./src/Router/postRouter');
const userRouter = require('./src/Router/userRouter');
const commentRouter = require('./src/Router/commentRouter');
const notificationRouter = require('./src/Router/notlificationRouter');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
});

global._io = io;
const onlineUsers = new Map();
global.onlineUsers = onlineUsers;

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(expressFileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', authRouter);
app.use('/api/post', postRouter);
app.use('/api/user', userRouter);
app.use('/api/comment', commentRouter);
app.use('/api/notification', notificationRouter);

io.on('connection', (socket) => {

  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      onlineUsers.set(userId.toString(), socket.id);
    }
  });

  socket.on('newNotification', async (notificationData) => {
    try {
      const { receiverId, senderId, type, message, postId, post } = notificationData;

      const newNotification = await Notification.create({
        receiverId,
        senderId,
        type,
        message,
        postId: postId || null,
      });

      const populatedNotification = await Notification.findById(newNotification._id)
        .populate('senderId', 'username profileImage')
        .populate('postId', 'content postImage');

      const socketId = onlineUsers.get(receiverId.toString());
      if (socketId) {
        io.to(receiverId.toString()).emit('newNotification', {
          ...populatedNotification._doc,
          post: post || populatedNotification.postId,
        });
      }
    } catch (err) {
      console.error('Notification yuborishda xato:', err.message);
    }
  });

  socket.on('newComment', (comment) => {
    io.emit('newComment', comment);
  });

  socket.on('notificationRead', (data) => {
    const { notificationId, userId } = data;
    console.log('Notification read event received:', data);
    io.to(userId.toString()).emit('notificationUpdated', {
      notificationId,
      isRead: true,
    });
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 4000;

mongoose
  .connect(MONGO_URL)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB ulanish xatosi:', error.message);
    process.exit(1);
  });

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Serverda xato yuz berdi' });
});