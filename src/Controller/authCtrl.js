const User = require('../Model/UserModel');
const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');

const authCtrl = {
  signup: async (req, res) => {
    try {
      const { username, surname, email, password } = req.body;

      if (!username || !surname || !email || !password) {
        return res.status(400).json({ message: "Barcha maydonlarni to‘ldiring" });
      }

      const userExists = await User.findOne({ email });
      if (userExists) return res.status(400).json({ message: "Bu email allaqachon mavjud" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, surname, email, password: hashedPassword });

      await newUser.save();

      const token = JWT.sign(
        { id: newUser._id, role: newUser.role },
        process.env.JWT_SECRET_KEY || 'secret',
        { expiresIn: '12h' }
      );

      const userData = newUser.toObject();
      delete userData.password;

      res.status(201).json({ message: 'Ro‘yxatdan o‘tildi', userId: newUser._id, token, user: userData });
    } catch (err) {
      res.status(500).json({ message: "Xatolik: " + err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Barcha maydonlarni to‘ldiring" });
      }

      const user = await User.findOne({ email }).select('+password');
      if (!user) return res.status(400).json({ message: "Email yoki parol noto‘g‘ri" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Email yoki parol noto‘g‘ri" });

      const token = JWT.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET_KEY || 'secret',
        { expiresIn: '12h' }
      );

      const userData = user.toObject();
      delete userData.password;

      res.status(200).json({ message: 'Kirish muvaffaqiyatli', userId: user._id, token, user: userData });
    } catch (err) {
      res.status(500).json({ message: "Xatolik: " + err.message });
    }
  }
};

module.exports = authCtrl;
