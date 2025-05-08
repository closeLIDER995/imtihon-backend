const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 30,
    },
    surname: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
    },
    profileImage: {
      type: String,
      default: '',
    },
    follower: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    followed: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    databirth: {
      type: Date,
      default: null,
    },
    role: {
      type: Number,
      enum: [100, 101], // 100 = user , 101 = admin
      default: 100
    },
    job: {
      type: String,
      default: ''
    },
    hobby: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
