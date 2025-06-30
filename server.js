const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const path = require('path');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// === FRONTEND URL ===
// const FRONTEND_URL = 'https://shimmering-tanuki-4438d1.netlify.app';

// === CORS SETUP ===
const allowedOrigins = ["https://odil-bobur-app-post.netlify.app", 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// === SOCKET.IO ===
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
global._io = io;
const onlineUsers = new Map();
global.onlineUsers = onlineUsers;

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      onlineUsers.set(userId.toString(), socket.id);
    }
  });

  socket.on('notificationRead', ({ notificationId, userId }) => {
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

// === MIDDLEWARE ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.use(express.static(path.join(__dirname, 'public')));

// === ROUTES ===
const authRouter = require('./src/Router/authRouter');
const adminRouter = require('./src/Router/adminRouter');
const postRouter = require('./src/Router/postRouter');
const userRouter = require('./src/Router/userRouter');
const commentRouter = require('./src/Router/commentRouter');
const notificationRouter = require('./src/Router/notlificationRouter');

app.use('/api', authRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/post', postRouter);
app.use('/api/comment', commentRouter);
app.use('/api/notifications', notificationRouter);

// === DATABASE CONNECTION ===
const PORT = process.env.PORT || 4000;
const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`✅ Server ishga tushdi: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB ulanishda xatolik:', err.message);
    process.exit(1);
  });

// === GLOBAL ERROR HANDLER ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
});
