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
    if (!decoded || (!decoded.id && !decoded._id)) {
      return res.status(401).json({ message: "Token is not valid" });
    }
    const userId = decoded.id || decoded._id;
    const user = await User.findById(userId).select('-password'); 
    if (!user) {
      return res.status(404).json({ message: "User not found in database" });
    }
    req.user = { id: user._id.toString(), _id: user._id.toString(), role: user.role };
    next(); 
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid or expired" });
  }
};

module.exports = authMiddleware;