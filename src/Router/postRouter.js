const router = require("express").Router()
const postCtrl = require('../Controller/postCtrl');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, postCtrl.createPost);
router.get('/', authMiddleware, postCtrl.getAllPosts);
router.get('/:id', authMiddleware, postCtrl.getOnePost);
router.delete('/:id', authMiddleware, postCtrl.deletePost);
router.put('/:id', authMiddleware, postCtrl.updatePost);
router.get('/user/:id', authMiddleware, postCtrl.myPosts);
router.put('/:id', authMiddleware, postCtrl.likePost);

module.exports = router;
