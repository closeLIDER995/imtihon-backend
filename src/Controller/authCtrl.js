const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');
const User = require('../Model/UserModel');

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "my_super_secret_key"

const authCtrl = {
  signup: async (req, res) => {
    try {
      const { username, email, password, surname, job, hobby, role = 'user' } = req.body;

      if (!username || !email || !password || !surname) {
        return res.status(400).json({ message: "Barcha qatorlarni to‘ldiring" });
      }

      const [emailExists, usernameExists] = await Promise.all([
        User.findOne({ email }),
        User.findOne({ username }),
      ]);

      if (emailExists) return res.status(403).json({ message: "Bu email allaqachon mavjud" });
      if (usernameExists) return res.status(403).json({ message: "Bu username allaqachon mavjud" });

      const newUser = new User({ username, email, password, surname, job, hobby, role });
      await newUser.save();

      const userData = newUser.toObject();
      delete userData.password;

      const token = JWT.sign(
        { id: newUser._id, role: newUser.role },
        process.env.JWT_SECRET_KEY || 'secret',
        { expiresIn: '12h' }
      );

      res.status(201).json({
        message: "Ro‘yxatdan o‘tish muvaffaqiyatli",
        userId: newUser._id.toString(),
        token,
        user: userData
      });
    } catch (error) {
      res.status(500).json({ message: "Serverda xatolik: " + error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(403).json({ message: "Please fill all fields" });
      }

      // passwordni olish uchun .select('+password') yozilishi kerak
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(400).json({ message: "Invalid email" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid password" });
      }

      // Parolni olib tashlaymiz
      const userData = user.toObject();
      delete userData.password;

      const token = JWT.sign(
        { id: user._id, role: user.role },
        JWT_SECRET_KEY,
        { expiresIn: "48h" }
      );

      res.status(200).json({
        message: "Login successful",
        user: userData,
        token,
        userId: user._id.toString()
      });
    } catch (error) {
      console.error("Login error:", error.message);
      res.status(500).json({ message: "Server error: " + error.message });
    }
  }
};


module.exports = authCtrl;
