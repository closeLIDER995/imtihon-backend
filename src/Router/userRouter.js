const express = require('express');
const router = express.Router();
const userCtrl = require('../Controller/userCtrl');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/add', authMiddleware, userCtrl.addUser);
router.delete('/:id', authMiddleware, userCtrl.deleteUser);
router.put('/:id', authMiddleware, userCtrl.updateUser);
router.get('/:id', authMiddleware, userCtrl.getOneUser);
router.get('/', authMiddleware, userCtrl.getUsers);

module.exports = router;
