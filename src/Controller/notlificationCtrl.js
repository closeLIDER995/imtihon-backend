const Notification = require('../Model/notificatoinModel');
const User = require('../Model/userModel');

const notificationCtrl = {
    createNotification: async (req, res) => {
        try {
            const { type, senderId, receiverId, postId, commentId } = req.body;

            if (!type || !senderId || !receiverId) {
                return res.status(400).json({ message: 'Type, sender, and receiver are required.' });
            }

            if (senderId === receiverId) {
                return res.status(400).json({ message: 'You cannot notify yourself.' });
            }

            const sender = await User.findById(senderId);
            const receiver = await User.findById(receiverId);

            if (!sender || !receiver) {
                return res.status(404).json({ message: 'Sender or receiver not found.' });
            }

            if (type === 'follow') {
                if (!receiver.follower.includes(senderId)) {
                    receiver.follower.push(senderId);
                }
                if (!sender.followed.includes(receiverId)) {
                    sender.followed.push(receiverId);
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
            });

            await newNotification.save();

            const receiverSocketId = global.onlineUsers?.get(receiverId);
            if (receiverSocketId) {
                global._io.to(receiverSocketId).emit("newNotification", newNotification);
            }

            res.status(201).json(newNotification);
        } catch (err) {
            console.error('Create Notification Error:', err);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getNotifications: async (req, res) => {
        try {
            const userId = req.params.userId;
            const notifications = await Notification.find({ receiverId: userId })
                .populate('senderId', 'username profileImage')
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

            const notification = await Notification.findByIdAndUpdate(
                notificationId,
                { isRead: true },
                { new: true }
            );

            if (!notification) {
                return res.status(404).json({ message: 'Notification not found' });
            }

            res.status(200).json(notification);
        } catch (err) {
            console.error('Mark Notification Read Error:', err);
            res.status(500).json({ message: 'Server error' });
        }
    },

    deleteNotification: async (req, res) => {
        try {
            const { notificationId } = req.params;

            const deleted = await Notification.findByIdAndDelete(notificationId);

            if (!deleted) {
                return res.status(404).json({ message: 'Notification not found' });
            }

            res.status(200).json({ message: 'Notification deleted' });
        } catch (err) {
            console.error('Delete Notification Error:', err);
            res.status(500).json({ message: 'Server error' });
        }
    },

    deleteAllNotifications: async (req, res) => {
        try {
            const { userId } = req.params;

            await Notification.deleteMany({ receiverId: userId });

            res.status(200).json({ message: 'All notifications deleted' });
        } catch (err) {
            console.error('Delete All Notifications Error:', err);
            res.status(500).json({ message: 'Server error' });
        }
    },
};

module.exports = notificationCtrl;