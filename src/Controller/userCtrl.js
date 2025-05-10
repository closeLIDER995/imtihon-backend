const bcrypt = require('bcrypt');
const User = require('../Model/userModel');
const Post = require('../Model/postModel');
const Comment = require('../Model/commentsModel');
const Notification = require('../Model/notificatoinModel');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

const userCtrl = {

  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;

      if (req.user.role !== 101 && req.user._id.toString() !== userId) {
        return res.status(403).json({ message: 'Sizda bu foydalanuvchini o‘chirish huquqi yo‘q' });
      }

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User topilmadi' });

      const posts = await Post.find({ userId });

      for (let post of posts) {
        if (post.postImage && post.postImage.public_id) {
          await cloudinary.uploader.destroy(post.postImage.public_id);
        }

        await Comment.deleteMany({ postId: post._id });

        await Post.findByIdAndDelete(post._id);
      }

      await Comment.deleteMany({ userId });

      await Post.updateMany(
        { likes: userId },
        { $pull: { likes: userId } }
      );

      await User.updateMany(
        { follower: userId },
        { $pull: { follower: userId } }
      );
      await User.updateMany(
        { followed: userId },
        { $pull: { followed: userId } }
      );

      await Notification.deleteMany({
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      });

      if (user.profileImage && user.profileImage.includes('cloudinary')) {
        const publicId = user.profileImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }

      await User.findByIdAndDelete(userId);

      res.status(200).json({ message: 'User va unga tegishli barcha maʼlumotlar o‘chirildi' });

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const userId = req.params.id;

      if (req.user.role !== 101 && req.user._id.toString() !== userId) {
        return res.status(403).json({ message: "Sizda bu foydalanuvchini yangilash huquqi yo‘q" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User topilmadi' });
      }

      if (req.body.password) {
        if (req.body.password.length < 4) {
          return res.status(400).json({ message: "Parol kamida 4 ta belgidan iborat bo‘lishi kerak" });
        }
        req.body.password = await bcrypt.hash(req.body.password, 10);
      }

      if (req.body.profileImage && req.body.profileImage !== user.profileImage) {
        if (user.profileImage.includes('cloudinary')) {
          const publicId = user.profileImage.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }
      }

      const fieldsToUpdate = {};
      for (let key in req.body) {
        if (req.body[key] !== '' && req.body[key] !== null && req.body[key] !== undefined) {
          fieldsToUpdate[key] = req.body[key];
        }
      }

      const updatedUser = await User.findByIdAndUpdate(userId, fieldsToUpdate, { new: true });
      const { password, ...userData } = updatedUser._doc;

      res.status(200).json({ message: 'Foydalanuvchi muvaffaqiyatli yangilandi', user: userData });

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Serverda xatolik: ' + error.message });
    }
  },

  getOneUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User topilmadi' });
      }

      const { password, ...userData } = user._doc;
      res.status(200).json({ user: userData });

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

    getUsers: async (req, res) => {
      try {
        const users = await User.find();

        const usersData = users.map(user => {
          const { password, ...userData } = user._doc;
          return userData;
        });

        res.status(200).json({ users: usersData });

      } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
      }
    },

      followUser: async (req, res) => {
        try {
          const targetUserId = req.params.id;
          const currentUserId = req.user._id.toString();

          if (targetUserId === currentUserId) {
            return res.status(400).json({ message: "O'zingizni follow qilib bo'lmaydi" });
          }

          const targetUser = await User.findById(targetUserId);
          const currentUser = await User.findById(currentUserId);

          if (!targetUser || !currentUser) {
            return res.status(404).json({ message: "User topilmadi" });
          }

          const isFollowing = currentUser.followed.includes(targetUserId);

          if (isFollowing) {
            currentUser.followed = currentUser.followed.filter(id => id.toString() !== targetUserId);
            targetUser.follower = targetUser.follower.filter(id => id.toString() !== currentUserId);
            await currentUser.save();
            await targetUser.save();
            return res.status(200).json({ message: "Unfollow qilindi" });
          } else {
            currentUser.followed.push(targetUserId);
            targetUser.follower.push(currentUserId);
            await currentUser.save();
            await targetUser.save();
            return res.status(200).json({ message: "Follow qilindi" });
          }

        } catch (error) {
          console.log(error);
          res.status(500).json({ message: error.message });
        }
      }

};

module.exports = userCtrl;
