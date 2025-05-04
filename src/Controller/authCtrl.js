const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const User = require('../Model/UserModel');

const authCtrl = {

    signup: async (req, res) => {
        try {
            const { username, surname, email, password, role } = req.body;

            if (!username || !surname || !email || !password) {
                return res.status(400).json({ message: "barcha qatorlarni toldiring" });
            }

            const userExists = await User.findOne({ $or: [{ email }, { username }] });
            if (userExists) {
                return res.status(403).json({ message: "Email or username already exsits" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                username,
                surname,
                email,
                password: hashedPassword,
                role: role,
                profileImage: req.body.profileImage || '',
                databirth: req.body.databirth || null
            });

            await newUser.save();

            const { password: _, ...userData } = newUser._doc;


            const token = JWT.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET_KEY, { expiresIn: '12h' });

            res.status(201).json({ message: "Signup sucssess", user: userData, token });

        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: "hamma qatorlarni toldiring" });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "Email is not found" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Parol noto‘g‘ri" });
            }

            const { password: _, ...userData } = newUser._doc;

            const token = JWT.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: '12h' });

            res.status(200).json({ message: "Login sucssess", user: userData, token });

        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    }

};

module.exports = authCtrl;
