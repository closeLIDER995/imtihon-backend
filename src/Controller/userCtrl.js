const User = require('../Model/UserModel'); 
const bcrypt = require('bcrypt');

const userCtrl = {

  addUser: async (req, res) => {
    try {
      if (req.user.role !== 101) {
        return res.status(403).json({ message: "seni user qoshishga haqqing yoq ukaginam" });
      }
      
      const { email, username, surname, password } = req.body;
      if (!email || !username || !surname || !password) {
        return res.status(400).json({ message: 'hamma qatorlarni toldiring' });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'email is alrady exits' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ ...req.body, password: hashedPassword });
      await newUser.save();

      const { password: _, ...userData } = newUser._doc;
      res.status(201).json({ message: 'User add sucssess!', user: userData });

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User is not found' });
      }

      if (req.user.role === 101 || req.user._id.toString() === userId) {
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: 'User delete sucssess' });
      } else {
        res.status(403).json({ message: 'sani huquqing yoq ochirishga' });
      }

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      if (req.user.role !== 101) {
        return res.status(403).json({ message: "sani huquqing yoq" });
      }

      const userId = req.params.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updatedUser = await User.findByIdAndUpdate(userId, req.body, { new: true });
      const { password: _, ...userData } = updatedUser._doc;

      res.status(200).json({ message: 'User update sucssess', user: userData });

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
        return res.status(404).json({ message: 'User not found  ' });
      }

      const { password: _, ...userData } = user._doc;
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
        const { password: _, ...userData } = user._doc;
        return userData;
      });

      res.status(200).json({ users: usersData });

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = userCtrl;
