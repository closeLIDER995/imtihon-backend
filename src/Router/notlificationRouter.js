const express = require('express');
const router = express.Router();
const NotificationCtrl = require('../Controller/notlificationCtrl');
const auth = require('../middleware/authMiddleware')

router.post('/', auth , NotificationCtrl.createNotification);
router.get('/:userId', auth , NotificationCtrl.getNotifications);
router.patch('/read/:notificationId', auth , NotificationCtrl.readNotification);
router.delete('/:notificationId', auth , NotificationCtrl.deleteNotification);
router.delete('/all/:userId', auth , NotificationCtrl.deleteAllNotifications);

module.exports = router;
