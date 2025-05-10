const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

const imageCtrl = {

  uploadImage: async (req, res) => {
    try {
      if (!req.files || !req.files.image) {
        return res.status(400).json({ message: "Rasm topilmadi" });
      }

      const file = req.files.image;

      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "Rasm hajmi 5MB dan oshmasligi kerak" });
      }

      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'posts',
      });

      fs.unlinkSync(file.tempFilePath);

      res.status(200).json({
        message: "Rasm muvaffaqiyatli yuklandi",
        url: result.secure_url,
        public_id: result.public_id
      });

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server xatosi" });
    }
  },

  deleteImage: async (req, res) => {
    try {
      const { public_id } = req.body;

      if (!public_id) {
        return res.status(400).json({ message: "public_id talab qilinadi" });
      }

      await cloudinary.uploader.destroy(public_id);

      res.status(200).json({ message: "Rasm o‘chirildi" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server xatosi" });
    }
  }

};

module.exports = imageCtrl;
