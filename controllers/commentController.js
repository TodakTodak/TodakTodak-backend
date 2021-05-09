const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");

module.exports.postComment = async (req, res, next) => {
  try {
    const { user, postId, content } = req.body;

    const currentPost = await Post.findById(postId);
    const currentUser = await User.findOne({ email: user.email }).lean();
    const newComment = await Comment.create({
      content,
      user: currentUser._id
    });

    currentPost.comments.push(newComment._id);
    await currentPost.save();

    res.json({ errorMessage: null });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({ errorMessage: "서버에 문제가 없습니다." });
  }
};
