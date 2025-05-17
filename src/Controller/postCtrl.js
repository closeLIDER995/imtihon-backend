const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const Post = require('../Model/postModel');
const Comment = require('../Model/commentsModel');

const postCtrl = {
    createPost: async (req, res) => {
        try {
            const userId = req.user.id;
            const { content } = req.body;
            let postImage = {};

            if (req.files?.postImage) {
                const result = await cloudinary.uploader.upload(
                    req.files.postImage.tempFilePath,
                    { folder: 'posts' }
                );
                fs.unlinkSync(req.files.postImage.tempFilePath);
                postImage = {
                    url: result.secure_url,
                    public_id: result.public_id,
                };
            }

            const newPost = new Post({
                userId,
                content: content || '',
                ...(postImage.url && postImage.public_id ? { postImage } : {}),
            });

            await newPost.save();

            res.status(201).json({ message: 'Post muvaffaqiyatli yaratildi', post: newPost });
        } catch (error) {
            console.error('Post yaratishda xatolik:', error);
            res.status(500).json({ message: 'Post yaratishda xatolik yuz berdi' });
        }
    },

    deletePost: async (req, res) => {
        try {
            const { id } = req.params;
            const post = await Post.findById(id);
            if (!post) return res.status(404).json({ message: 'Post not found' });

            if (req.user.role === 101 || req.user.id.toString() === post.userId.toString()) {
                if (post.postImage?.public_id) {
                    await cloudinary.uploader.destroy(post.postImage.public_id);
                }
                await Post.findByIdAndDelete(id);
                await Comment.deleteMany({ postId: id });

                res.status(200).json({ message: 'Post deleted successfully' });
            } else {
                res.status(403).json({ message: 'Sizda ruxsat yo‘q' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: err.message });
        }
    },

    updatePost: async (req, res) => {
        try {
            const { id } = req.params;
            const post = await Post.findById(id);
            if (!post) return res.status(404).json({ message: 'Post not found' });

            if (req.user.role === 101 || req.user.id.toString() === post.userId.toString()) {
                const updateData = { content: req.body.content };

                if (req.files?.image) {
                    if (post.postImage?.public_id) {
                        await cloudinary.uploader.destroy(post.postImage.public_id);
                    }
                    const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, { folder: 'posts' });
                    fs.unlinkSync(req.files.image.tempFilePath);
                    updateData.postImage = {
                        url: result.secure_url,
                        public_id: result.public_id,
                    };
                }

                const updatedPost = await Post.findByIdAndUpdate(id, updateData, { new: true });
                res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
            } else {
                res.status(403).json({ message: 'Sizda bunga ruxsat yo‘q' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: err.message });
        }
    },

    getOnePost: async (req, res) => {
        try {
            const post = await Post.findById(req.params.id)
                .populate('userId', 'username profileImage')
                .populate({ path: 'comments', populate: { path: 'userId', select: 'username profileImage' } });

            if (!post) return res.status(404).json({ message: 'Post not found' });
            res.status(200).json(post);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: err.message });
        }
    },

    getAllPosts: async (req, res) => {
        try {
            const posts = await Post.find()
                .populate('userId', 'username profileImage')
                .populate({ path: 'comments', populate: { path: 'userId', select: 'username profileImage' } });

            const sortedPosts = posts
                .map(post => ({ ...post._doc, likesCount: post.likes?.length || 0 }))
                .sort((a, b) => b.likesCount - a.likesCount);

            res.status(200).json(sortedPosts);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: err.message });
        }
    },

    myPosts: async (req, res) => {
        try {
            const userId = req.user.id;

            const filter = req.user.role === 101 ? {} : { userId };

            const posts = await Post.find(filter)
                .populate('userId', 'username profileImage')
                .populate({ path: 'comments', populate: { path: 'userId', select: 'username profileImage' } });

            res.status(200).json({ message: 'Postlar ro‘yxati', posts });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: err.message });
        }
    },

    likePost: async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) return res.status(404).json({ message: 'Post topilmadi' });

            const userId = req.user.id;

            if (post.likes.includes(userId)) {
                post.likes.pull(userId);
            } else {
                post.likes.push(userId);
            }

            post.likesCount = post.likes.length;
            await post.save();

            res.status(200).json({ message: "Like status o'zgartirildi", post });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: err.message });
        }
    }
};

module.exports = postCtrl;
