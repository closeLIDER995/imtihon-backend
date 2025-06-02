const Post = require('../Model/postModel');
const Comment = require('../Model/commentsModel');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Notification = require('../Model/notificatoinModel'); // Imlo to‘g‘irlandi
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const postCtrl = {
  getAllPosts: async (req, res) => {
    try {
      const userIdFilter = req.query.userId;
      let query = {};

      if (userIdFilter) {
        if (!mongoose.Types.ObjectId.isValid(userIdFilter)) {
          return res.status(400).json({ message: 'Noto‘g‘ri foydalanuvchi ID formati' });
        }
        query = { userId: new mongoose.Types.ObjectId(userIdFilter) };
      }

      const posts = await Post.find(query)
        .populate('userId', 'username profileImage')
        .populate({
          path: 'comments',
          populate: { path: 'userId', select: 'username profileImage' },
        })
        .sort({ createdAt: -1 });

      res.status(200).json(posts);
    } catch (err) {
      console.error('getAllPosts error:', err.message, err.stack);
      res.status(500).json({ message: 'Server xatosi: Postlarni olishda muammo' });
    }
  },

  myPosts: async (req, res) => {
    try {
      const targetUserId = req.params.userId || req.user._id;
      if (!targetUserId) {
        return res.status(401).json({ message: 'Foydalanuvchi autentifikatsiya qilinmagan' });
      }

      if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({ message: 'Noto‘g‘ri foydalanuvchi ID formati' });
      }

      const userId = new mongoose.Types.ObjectId(targetUserId);
      const posts = await Post.find({ userId })
        .populate('userId', 'username profileImage')
        .populate({
          path: 'comments',
          populate: { path: 'userId', select: 'username profileImage' },
        })
        .sort({ createdAt: -1});

      res.status(200).json(posts);
    } catch (err) {
      console.error('myPosts error:', err.message, err.stack);
      res.status(500).json({ message: 'Server xatosi: O‘z postlarini olishda muammo' });
    }
  },

  createPost: async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: 'Kontent majburiy' });
      }

      let postImage = null;
      if (req.files && req.files.postImage) {
        const file = req.files.postImage;
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: 'posts',
          resource_type: 'auto',
        });
        fs.unlinkSync(file.tempFilePath); // Vaqtinchalik faylni o‘chirish
        postImage = { url: result.secure_url, filename: result.public_id };
      } else {
        console.log('Rasm yuklanmadi:', req.files);
      }

      const newPost = await Post.create({
        userId: req.user._id,
        content,
        postImage,
      });

      const populatedPost = await Post.findById(newPost._id)
        .populate('userId', 'username profileImage')
        .populate({
          path: 'comments',
          populate: { path: 'userId', select: 'username profileImage' },
        });

      res.status(201).json({ post: populatedPost });
    } catch (err) {
      console.error('createPost error:', err.message, err.stack);
      res.status(500).json({ message: 'Server xatosi: Post yaratishda muammo', error: err.message });
    }
  },

  updatePost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: 'Post topilmadi' });
      }
      if (post.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Faqat o‘zingizning postingizni yangilay olasiz' });
      }

      post.content = req.body.content || post.content;
      if (req.files && req.files.postImage) {
        if (post.postImage && post.postImage.filename) {
          await cloudinary.uploader.destroy(post.postImage.filename);
        }
        const file = req.files.postImage;
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: 'posts',
          resource_type: 'auto',
        });
        fs.unlinkSync(file.tempFilePath);
        post.postImage = { url: result.secure_url, filename: result.public_id };
      }
      await post.save();

      const populatedPost = await Post.findById(req.params.id)
        .populate('userId', 'username profileImage')
        .populate({
          path: 'comments',
          populate: { path: 'userId', select: 'username profileImage' },
        });

      res.status(200).json({ post: populatedPost });
    } catch (err) {
      console.error('updatePost error:', err.message, err.stack);
      res.status(500).json({ message: 'Server xatosi: Post yangilashda muammo', error: err.message });
    }
  },

  deletePost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: 'Post topilmadi' });
      }
      if (post.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Faqat o‘zingizning postingizni o‘chira olasiz' });
      }
      if (post.postImage && post.postImage.filename) {
        await cloudinary.uploader.destroy(post.postImage.filename);
      }
      await Post.deleteOne({ _id: req.params.id });
      res.status(200).json({ message: 'Post o‘chirildi' });
    } catch (err) {
      console.error('deletePost error:', err.message, err.stack);
      res.status(500).json({ message: 'Server xatosi: Post o‘chirishda muammo' });
    }
  },

  getOnePost: async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Noto‘g‘ri post ID formati' });
      }

      const post = await Post.findById(req.params.id)
        .populate('userId', 'username profileImage')
        .populate({
          path: 'comments',
          populate: { path: 'userId', select: 'username profileImage' },
        });
      if (!post) {
        return res.status(404).json({ message: 'Post topilmadi' });
      }
      res.status(200).json(post);
    } catch (err) {
      console.error('getOnePost error:', err.message, err.stack);
      res.status(500).json({ message: 'Server xatosi: Post olishda muammo' });
    }
  },

  likePost: async (req, res) => {
    try {
      const postId = req.params.id;
      console.log('Attempting to like post with ID:', postId);
  
      const post = await Post.findById(postId);
      if (!post) {
        console.log('Post not found for ID:', postId);
        return res.status(404).json({ message: 'Post topilmadi' });
      }
  
      const userId = req.user?._id;
      if (!userId) {
        console.log('User ID not found in request:', req.user);
        return res.status(401).json({ message: 'Foydalanuvchi autentifikatsiyasi topilmadi' });
      }
      console.log('User ID:', userId);
  
      const isLiked = post.likes.includes(userId.toString());
      console.log('Is post liked by user?', isLiked);
  
      if (isLiked) {
        console.log('Removing like from post:', postId);
        post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      } else {
        console.log('Adding like to post:', postId);
        post.likes.push(userId);
  
        if (post.userId.toString() !== userId.toString()) {
          const existingNotification = await Notification.findOne({
            senderId: userId,
            receiverId: post.userId,
            type: 'like',
            postId: post._id,
          });
          if (!existingNotification) {
            console.log('Creating new notification for like');
            const newNotification = await Notification.create({
              senderId: userId,
              receiverId: post.userId,
              type: 'like',
              message: `${req.user.username} sizning postingizga like bosdi: "${post.content.substring(0, 20)}..."`,
              postId: post._id,
            });
  
            const populatedNotification = await Notification.findById(newNotification._id)
              .populate('senderId', 'username profileImage')
              .populate('postId', 'content postImage');
  
            const receiverSocketId = global.onlineUsers.get(post.userId.toString());
            if (receiverSocketId) {
              console.log('Emitting new notification to:', receiverSocketId);
              global._io.to(receiverSocketId).emit('newNotification', {
                ...populatedNotification._doc,
                createdAt: new Date(),
              });
            }
          } else {
            console.log('Existing notification found, skipping creation');
          }
        }
      }
  
      await post.save();
      console.log('Post saved successfully with likes:', post.likes);
  
      const populatedPost = await Post.findById(postId)
        .populate('userId', 'username profileImage')
        .populate({
          path: 'comments',
          populate: { path: 'userId', select: 'username profileImage' },
        });
  
      res.status(200).json({ post: populatedPost });
    } catch (err) {
      console.error('likePost error:', err.message, err.stack);
      res.status(500).json({ message: 'Server xatosi: Like qo‘yishda muammo', error: err.message });
    }
  },

  unlikePost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ msg: "Post topilmadi" });
  
      post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
      await post.save();
      res.status(200).json(post);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
};

module.exports = postCtrl;