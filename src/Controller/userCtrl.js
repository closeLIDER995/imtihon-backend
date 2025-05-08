const bcrypt = require('bcrypt');
const User = require('../Model/userModel');

const userCtrl = {

  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User topilmadi' });
      }

      if (req.user.role === 101 || req.user._id.toString() === userId) {
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: 'User o‘chirildi' });
      } else {
        res.status(403).json({ message: 'Sizda bu foydalanuvchini o‘chirish huquqi yo‘q' });
      }

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const userId = req.params.id;

      if (req.user.role !== 101 && req.user._id.toString() !== userId) {
        return res.status(403).json({ message: "Sizda huquq yo‘q" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User topilmadi' });
      }

      if (req.body.password && req.body.password.length > 0) {
        req.body.password = await bcrypt.hash(req.body.password, 10);
      }

      const updatedUser = await User.findByIdAndUpdate(userId, req.body, { new: true });
      const { password, ...userData } = updatedUser._doc;

      res.status(200).json({ message: 'User yangilandi', user: userData });

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
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
