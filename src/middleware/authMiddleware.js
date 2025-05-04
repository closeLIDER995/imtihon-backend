const JWT = require('jsonwebtoken');
const User = require('../Model/UserModel');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; 
        if (!token) {
            return res.status(401).json({ message: "No token, authorization denied" });
        }

        const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded; 

        next();  
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: "Token is not valid" });
    }
};

module.exports = authMiddleware;
