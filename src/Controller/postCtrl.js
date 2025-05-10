const Post = require('../Model/postModel');

const postCtrl = {
    createPost: async (req, res) => {
        try {
            const newPost = new Post({ userId: req.user._id, postImage: req.body.postImage || '' });

            const savedPost = await newPost.save();
            
            res.status(201).json({ message: "Post created sucssess", post: savedPost });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    deletePost: async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) return res.status(404).json({ message: "Post not found" });

            if (req.user.role === 101 || req.user._id.toString() === post.userId.toString()) {
                await Post.findByIdAndDelete(req.params.id);

                res.status(200).json({ message: "Post delete sucssess" });
            } else {
                res.status(403).json({ message: "sani bunga haqqing yoq" });
            }
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    updatePost: async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) return res.status(404).json({ message: "Post not found" });

            if (req.user.role === 101 || req.user._id.toString() === post.userId.toString()) {
                const updatedPost = await Post.findByIdAndUpdate(req.params.id, { postImage: req.body.postImage }, { new: true });
                res.status(200).json({ message: "Post updated sucssess", post: updatedPost });
            } else {
                res.status(403).json({ message: "sani bunga haqqing yoq " });
            }
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    getOnePost: async (req, res) => {
        try {
            const post = await Post.findById(req.params.id).populate("userId", "username profileImage").populate("comments");

            if (!post) return res.status(404).json({ message: "Post not found" });

            res.status(200).json(post);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    getAllPosts: async (req, res) => {
        try {
            const posts = await Post.find().sort({ createdAt: -1 }).populate("userId", "username profileImage").populate("comments");

            res.status(200).json(posts);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    myPosts: async (req, res) => {
        try {
            const { id } = req.params;

            const posts = await Post.find({ userId: id }).populate('userId', 'username profileImage').populate({ path: 'comments', populate: { path: 'userId', select: 'username profileImage', }, });

            res.status(200).json({ message: "My posts", posts });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    },
    likePost: async (req, res) => {
        try {
            const postId = req.params.id;
            const userId = req.user._id;
    
            const post = await Post.findById(postId);
            if (!post) return res.status(404).json({ message: "Post topilmadi" });
    
            if (post.likes.includes(userId)) {
                post.likes.pull(userId);
                await post.save();
                return res.status(200).json({ message: "Unlike qilindi", post });
            } else {
                post.likes.push(userId);
                await post.save();
                return res.status(200).json({ message: "Like qilindi", post });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    },
};

module.exports = postCtrl;
