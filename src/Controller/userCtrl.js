const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../Model/userModel');
const Post = require('../Model/postModel');
const Comment = require('../Model/commentsModel');
const Notification = require('../Model/notificatoinModel');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const userCtrl = {
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;
      if (req.user.role !== 101 && req.user._id.toString() !== userId) {
        return res.status(403).json({ message: 'Sizda bu foydalanuvchini o‘chirish huquqi yo‘q' });
      }
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });

      const posts = await Post.find({ userId });
      for (let post of posts) {
        if (post.postImage && post.postImage.filename) {
          await cloudinary.uploader.destroy(post.postImage.filename).catch(err => {
            console.error('Cloudinary destroy error for post image:', err);
          });
        }
        await Comment.deleteMany({ postId: post._id }).catch(err => {
          console.error('Comment delete error:', err);
        });
        await Post.findByIdAndDelete(post._id).catch(err => {
          console.error('Post delete error:', err);
        });
      }

      await Comment.deleteMany({ userId }).catch(err => {
        console.error('User comments delete error:', err);
      });

      await Post.updateMany(
        { likes: userId },
        { $pull: { likes: userId } }
      ).catch(err => {
        console.error('Update posts likes error:', err);
      });

      await User.updateMany(
        { followers: userId },
        { $pull: { followers: userId } }
      ).catch(err => {
        console.error('Update followers error:', err);
      });

      await User.updateMany(
        { following: userId },
        { $pull: { following: userId } }
      ).catch(err => {
        console.error('Update following error:', err);
      });

      await Notification.deleteMany({
        $or: [
          { senderId: userId },
          { receiverId: userId },
        ],
      }).catch(err => {
        console.error('Notification delete error:', err);
      });

      if (user.profileImage && user.profileImage.url && user.profileImage.url.includes('cloudinary')) {
        const parts = user.profileImage.url.split('/');
        const last = parts[parts.length - 1];
        const publicId = last.split('.')[0];
        await cloudinary.uploader.destroy(publicId).catch(err => {
          console.error('Cloudinary destroy error for profile image:', err);
        });
      }

      await User.findByIdAndDelete(userId).catch(err => {
        console.error('User delete error:', err);
      });

      res.status(200).json({ message: 'Foydalanuvchi va unga tegishli barcha maʼlumotlar o‘chirildi' });
    } catch (error) {
      console.error('Delete User Error:', error.stack);
      res.status(500).json({ message: 'Serverda xatolik: ' + error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const userId = req.params.id;
      if (req.user.role !== 101 && req.user._id.toString() !== userId) {
        return res.status(403).json({ message: "Sizda bu foydalanuvchini yangilash huquqi yo‘q" });
      }
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
  
      // Parolni yangilash
      let newPassword = user.password;
      if (req.body.password) {
        if (req.body.password.length < 4) {
          return res.status(400).json({ message: "Parol kamida 4 ta belgidan iborat bo‘lishi kerak" });
        }
        newPassword = await bcrypt.hash(req.body.password, 10);
      }
  
      // ProfileImage yangilash
      let newProfileImage = user.profileImage;
      if (req.body.profileImage && req.body.profileImage.url) {
        // eski Cloudinary rasm bo‘lsa, o‘chirish (ixtiyoriy)
        if (user.profileImage?.url && user.profileImage.url.includes('cloudinary')) {
          try {
            const parts = user.profileImage.url.split('/');
            const last = parts[parts.length - 1];
            const publicId = last.split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (e) { }
        }
        newProfileImage = req.body.profileImage;
      }
  
      const updatedFields = {
        username: req.body.username || user.username,
        password: newPassword,
        profileImage: newProfileImage,
        job: req.body.job !== undefined ? req.body.job : user.job,
        hobby: req.body.hobby !== undefined ? req.body.hobby : user.hobby,
      };
  
      const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, { new: true }).select('-password');
      res.status(200).json({ message: 'Foydalanuvchi muvaffaqiyatli yangilandi', user: updatedUser });
    } catch (error) {
      console.error('Update User Error:', error.stack);
      res.status(500).json({ message: 'Serverda xatolik: ' + error.message });
    }
  },
  
  searchOrGetUsers: async (req, res) => {
    try {
      const q = req.query.q || '';
      let users;
      if (q) {
        users = await User.find({ username: { $regex: q, $options: 'i' } }).select('-password');
      } else {
        users = await User.find().select('-password');
      }
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ message: "Foydalanuvchilarni olishda xatolik" });
    }
  },

  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('-password');
      if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Serverda xatolik: ' + error.message });
    }
  },

  // GET any user info (for profile page)
  getOneUser: async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // FOLLOW
  followUser: async (req, res) => {
    try {
      const targetUserId = req.params.id;
      const myUserId = req.user._id.toString();

      if (!mongoose.Types.ObjectId.isValid(targetUserId) || !mongoose.Types.ObjectId.isValid(myUserId)) {
        return res.status(400).json({ message: 'Noto‘g‘ri ID formati' });
      }
      if (targetUserId === myUserId) {
        return res.status(400).json({ message: "O‘zingizni follow qilib bo‘lmaydi" });
      }

      const targetUser = await User.findById(targetUserId);
      const myUser = await User.findById(myUserId);

      // Agar allaqachon followingda yoki followersda bo‘lsa, push qilmaydi
      if (!myUser.following.map(String).includes(targetUserId)) {
        myUser.following.push(targetUserId);
        await myUser.save();
      }
      if (!targetUser.followers.map(String).includes(myUserId)) {
        targetUser.followers.push(myUserId);
        await targetUser.save();
      }

      const updatedTarget = await User.findById(targetUserId).select('-password');
      const updatedMe = await User.findById(myUserId).select('-password');
      return res.status(200).json({
        message: 'Follow qilindi',
        user: updatedTarget,
        currentUser: updatedMe
      });
    } catch (error) {
      res.status(500).json({ message: 'Serverda xatolik: ' + error.message });
    }
  },

  // UNFOLLOW
  unfollowUser: async (req, res) => {
    try {
      const targetUserId = req.params.id;
      const myUserId = req.user._id.toString();

      if (!mongoose.Types.ObjectId.isValid(targetUserId) || !mongoose.Types.ObjectId.isValid(myUserId)) {
        return res.status(400).json({ message: 'Noto‘g‘ri ID formati' });
      }

      const targetUser = await User.findById(targetUserId);
      const myUser = await User.findById(myUserId);

      myUser.following = myUser.following.filter(id => id.toString() !== targetUserId);
      await myUser.save();

      targetUser.followers = targetUser.followers.filter(id => id.toString() !== myUserId);
      await targetUser.save();

      const updatedTarget = await User.findById(targetUserId).select('-password');
      const updatedMe = await User.findById(myUserId).select('-password');
      return res.status(200).json({
        message: 'Unfollow qilindi',
        user: updatedTarget,
        currentUser: updatedMe
      });
    } catch (error) {
      res.status(500).json({ message: 'Serverda xatolik: ' + error.message });
    }
  },

  getProfile: async (req, res) => {
    try {
      const userId = req.params.userId;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Noto‘g‘ri foydalanuvchi ID formati' });
      }
      const user = await User.findById(userId)
        .select('username bio followers following profileImage')
        .lean();
      if (!user) {
        return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
      }
      user.followersCount = Array.isArray(user.followers) ? user.followers.length : 0;
      user.followingCount = Array.isArray(user.following) ? user.following.length : 0;
      user.followers = undefined;
      user.following = undefined;

      if (!req.user || !req.user._id) {
        user.isFollowed = false;
      } else {
        if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
          return res.status(400).json({ message: 'Noto‘g‘ri joriy foydalanuvchi ID formati' });
        }
        const currentUser = await User.findById(req.user._id).lean();
        if (!currentUser) {
          return res.status(404).json({ message: 'Joriy foydalanuvchi topilmadi' });
        }
        user.isFollowed = Array.isArray(currentUser.following) && currentUser.following.some(id => id.toString() === userId);
      }
      res.status(200).json(user);
    } catch (error) {
      console.error('Profil olishda xato:', error.stack);
      res.status(500).json({ message: 'Serverda xato yuz berdi: ' + error.message });
    }
  }
};

module.exports = userCtrl;