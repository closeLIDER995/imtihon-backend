const jwt = require('jsonwebtoken');
const User = require('../Model/userModel');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization; 

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "No token, authorization denied" });
        }

        const token = authHeader.split(' ')[1]; 
        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Token is not valid" });
        }

        const user = await User.findById(decoded.id).select('-password'); 
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user; 
        next(); 


    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: "Token is not valid or expired" });
    }
};

module.exports = authMiddleware;
