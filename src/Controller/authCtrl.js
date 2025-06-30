const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');
const User = require('../models/UserModel');

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
        return res.status(403).send({ message: "Please fill all fields" });
      }
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).send({ message: "Invalid email" });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).send({ message: "Invalid password" });
      }
      
      const { password: pw, ...userData } = user._doc;
      
      const token = JWT.sign(userData, JWT_SECRET_KEY, { expiresIn: "48h" });
      
      res.status(200).send({
        message: "Login successful",
        user: userData,
        token
      });
      
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  }
};

module.exports = authCtrl;
