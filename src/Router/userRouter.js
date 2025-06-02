const express = require('express');
const router = express.Router();
const userCtrl = require('../Controller/userCtrl');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware, userCtrl.getCurrentUser);
router.get('/', authMiddleware, userCtrl.searchOrGetUsers);
router.get('/:id', authMiddleware, userCtrl.getOneUser);
router.put('/:id', authMiddleware, userCtrl.updateUser);
router.delete('/:id', authMiddleware, userCtrl.deleteUser);
router.put('/follow/:id', authMiddleware, userCtrl.followUser);
router.put('/unfollow/:id', authMiddleware, userCtrl.unfollowUser);

module.exports = router;