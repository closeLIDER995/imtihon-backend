const Post = require('../Model/postModel');
const Comment = require('../Model/commentsModel');
const Notification = require('../Model/notificatoinModel');

const commentCtrl = {
  createComment: async (req, res) => {
    try {
      const { postId, text } = req.body;
      if (!postId || !text) {
        return res.status(400).json({ message: 'postId va text majburiy' });
      }

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post topilmadi' });
      }

      const newComment = await Comment.create({
        postId,
        userId: req.user._id,
        text,
      });

      await Post.findByIdAndUpdate(postId, {
        $push: { comments: newComment._id },
      });

      const populatedComment = await Comment.findById(newComment._id).populate(
        'userId',
        'username profileImage'
      );

      // Notification yaratish
      if (req.user._id.toString() !== post.userId.toString()) {
        await Notification.create({
          senderId: req.user._id,
          receiverId: post.userId,
          type: 'comment',
          message: `${req.user.username} sizning postingizga komment yozdi: "${post.content.substring(0, 20)}..."`,
          postId: postId,
          commentId: newComment._id,
        });

        const receiverSocketId = global.onlineUsers.get(post.userId.toString());
        if (receiverSocketId) {
          global._io.to(receiverSocketId).emit('newNotification', {
            senderId: req.user._id,
            receiverId: post.userId,
            type: 'comment',
            message: `${req.user.username} sizning postingizga komment yozdi: "${post.content.substring(0, 20)}..."`,
            postId: postId,
            commentId: newComment._id,
            createdAt: new Date(),
          });
        }
      }

      // Kommentni faqat bir marta yuborish
      global._io.emit('newComment', populatedComment);

      res.status(201).json(populatedComment);
    } catch (err) {
      console.error('createComment error:', err.message, err.stack);
      res.status(500).json({ message: 'Server xatosi: Komment yaratishda muammo' });
    }
  },

  getCommentsByPost: async (req, res) => {
    try {
      console.log('Fetching comments for post:', req.params.postId);
      const comments = await Comment.find({ postId: req.params.postId })
        .populate('userId', 'username profileImage')
        .sort({ createdAt: -1 });
      res.json(comments);
    } catch (err) {
      console.error('getCommentsByPost error:', err.message, err.stack);
      res.status(500).json({ message: 'Server xatosi: Kommentlarni olishda muammo' });
    }
  },

  updateComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: 'Text majburiy' });
      }

      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({ message: 'Komment topilmadi' });
      }

      if (comment.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Faqat o‘zingizning commentingizni yangilay olasiz' });
      }

      comment.text = text;
      await comment.save();

      const populatedComment = await Comment.findById(id).populate(
        'userId',
        'username profileImage'
      );
      res.json(populatedComment);
    } catch (err) {
      console.error('updateComment error:', err.message, err.stack);
      res.status(500).json({ message: 'Server xatosi: Komment yangilashda muammo' });
    }
  },

  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({ message: 'Komment topilmadi' });
      }

      if (comment.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Faqat o‘zingizning commentingizni o‘chira olasiz' });
      }

      await Comment.deleteOne({ _id: id });
      await Post.findByIdAndUpdate(comment.postId, {
        $pull: { comments: comment._id },
      });

      res.json({ message: 'Komment o‘chirildi' });
    } catch (err) {
      console.error('deleteComment error:', err.message, err.stack);
      res.status(500).json({ message: 'Server xatosi: Komment o‘chirishda muammo' });
    }
  },
};

module.exports = commentCtrl;