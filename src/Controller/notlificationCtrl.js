const Notification = require('../Model/notificatoinModel');
const User = require('../Model/userModel');

const notificationCtrl = {
  createNotification: async (req, res) => {
    try {
      const { type, senderId, receiverId, postId, commentId } = req.body;

      if (!type || !senderId || !receiverId) {
        return res.status(400).json({ message: 'Type, sender, and receiver are required.' });
      }

      if (senderId.toString() === receiverId.toString()) {
        return res.status(400).json({ message: 'You cannot notify yourself.' });
      }

      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);

      if (!sender || !receiver) {
        return res.status(404).json({ message: 'Sender or receiver not found.' });
      }

      if (type === 'follow') {
        const alreadyFollowing = receiver.follower.includes(senderId);

        if (!alreadyFollowing) {
          receiver.follower.push(senderId);
          sender.followed.push(receiverId);
        } else {
          receiver.follower = receiver.follower.filter(id => id.toString() !== senderId.toString());
          sender.followed = sender.followed.filter(id => id.toString() !== receiverId.toString());
        }

        await receiver.save();
        await sender.save();
      }

      const newNotification = new Notification({
        type,
        senderId,
        receiverId,
        postId: postId || null,
        commentId: commentId || null,
        isFollowing: type === 'follow' ? receiver.follower.includes(senderId) : false,
      });

      await newNotification.save();

      const populatedNotification = await Notification.findById(newNotification._id)
        .populate('senderId', 'username profileImage')
        .populate('postId', 'content postImage')
        .populate('commentId', 'content');

      const receiverSocketId = global.onlineUsers?.get(receiverId.toString());
      if (receiverSocketId) {
        global._io.to(receiverSocketId).emit('newNotification', populatedNotification);
      }

      res.status(201).json(populatedNotification);
    } catch (err) {
      console.error('Create Notification Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getNotifications: async (req, res) => {
    try {
      const userId = req.params.userId;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
      }

      const notifications = await Notification.find({ receiverId: userId })
        .populate('senderId', 'username profileImage follower followed')
        .populate('postId', 'content postImage')
        .populate('commentId', 'content')
        .sort({ createdAt: -1 });

      res.status(200).json(notifications);
    } catch (err) {
      console.error('Get Notifications Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  readNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;

      const notification = await Notification.findById(notificationId);

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      notification.isRead = true;
      await notification.save();

      const updated = await Notification.findById(notificationId)
        .populate('senderId', 'username profileImage follower followed')
        .populate('postId', 'content postImage')
        .populate('commentId', 'content');

      res.status(200).json(updated);
    } catch (err) {
      console.error('Mark Notification Read Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  deleteNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;

      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      await notification.deleteOne();

      res.status(200).json({ message: 'Notification deleted' });
    } catch (err) {
      console.error('Delete Notification Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  deleteAllNotifications: async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      await Notification.deleteMany({ receiverId: userId });

      res.status(200).json({ message: 'All notifications deleted' });
    } catch (err) {
      console.error('Delete All Notifications Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },
};

module.exports = notificationCtrl;
