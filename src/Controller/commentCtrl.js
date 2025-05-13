const Comment = require('../Model/commentsModel');
const Post = require('../Model/postModel');

const commentCtrl = {
  createComment: async (req, res) => {
    try {
      const { postId, text } = req.body;

      const newComment = await Comment.create({
        postId,
        userId: req.user.id,
        text,
      });

      await Post.findByIdAndUpdate(postId, {
        $push: { comments: newComment._id },
      });

      res.status(201).json(newComment);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  getCommentsByPost: async (req, res) => {
    try {
      const comments = await Comment.find({ postId: req.params.postId })
        .populate('userId', 'username profileImage')
        .sort({ createdAt: -1 });

      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get comments' });
    }
  },

  updateComment: async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await Comment.findById(id);

      if (!comment)
        return res.status(404).json({ error: 'Comment not found' });

      if (String(comment.userId) !== String(req.user._id)) {
        return res.status(403).json({ error: 'Not authorized to update this comment' });
      }

      comment.text = req.body.text;
      await comment.save();

      res.json(comment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update comment' });
    }
  },

  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await Comment.findById(id);

      if (!comment)
        return res.status(404).json({ error: 'Comment not found' });

      if (String(comment.userId) !== String(req.user._id)) {
        return res.status(403).json({ error: 'Not authorized to delete this comment' });
      }

      await comment.remove();

      await Post.findByIdAndUpdate(comment.postId, {
        $pull: { comments: comment._id },
      });

      res.json({ message: 'Comment deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  }
};

module.exports = commentCtrl;
