const router = require('express').Router();
const imageCtrl = require('../Controller/imageCtrl');

router.post('/upload-image', imageCtrl.uploadImage);
router.post('/delete-image', imageCtrl.deleteImage);

module.exports = router;
