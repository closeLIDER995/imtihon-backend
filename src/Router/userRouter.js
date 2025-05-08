const express = require('express');
const router = express.Router();
const userCtrl = require('../Controller/userCtrl');
const authMiddleware = require('../middleware/authMiddleware');

router.delete('/:id', authMiddleware, userCtrl.deleteUser);
router.put('/:id', authMiddleware, userCtrl.updateUser);
router.get('/:id', authMiddleware, userCtrl.getOneUser);
router.get('/', authMiddleware, userCtrl.getUsers);
router.put('/follow/:id', authMiddleware, userCtrl.followUser);

module.exports = router;
