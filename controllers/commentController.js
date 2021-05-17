const Comment = require("../models/Comment");
const User = require("../models/User");
const Post = require("../models/Post");

module.exports.getComments = async (req, res, next) => {
  try {
    const { userEmail } = req.params;

    const fileredComment = await Comment.aggregate(
      [
        {
          $match: { "user": userEmail }
        }
      ]
    );

    res.json({
      errorMessage: null,
      comments: fileredComment
    });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      errorMessage: "서버에 문제가 있습니다.",
      comments: null
    });
  }
};

module.exports.patchCommentLike = async (req, res, next) => {
  try {
    const { user, commentId } = req.body;

    const targetUser = await User.findOne({ email: user }).lean();
    const targetComment = await Comment.findById(commentId);
    let commentLikeList = targetComment.likes;
    const isLikedUser = commentLikeList.includes(targetUser.email);

    if (isLikedUser) {
      const removeIndex = commentLikeList.indexOf(targetUser.email);

      commentLikeList.splice(removeIndex, 1);
    } else {
      commentLikeList.push(targetUser.email);
    }

    await targetComment.updateOne({
      "$set": { "likes": commentLikeList }
    });

    res.json({ errorMessage: null });

  } catch (err) {
    console.error(err.message);

    res.status(500).json({ errorMessage: "서버에 문제가 있습니다." });
  }
};

module.exports.patchComment = async (req, res, next) => {
  try {
    const {
      comment,
      commentId
    } = req.body;

    const targetComment = await Comment.findById(commentId);

    await targetComment.updateOne({
      "$set": { content: comment }
    });

    res.json({ errorMessage: null });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({ errorMessage: "서버에 문제가 있습니다." });
  }
};

module.exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const targetComment = await Comment.findById(commentId).lean();
    const CommentPost = await Post.findById(targetComment.post);
    const deletedPostComments = CommentPost.comments.filter((comment) =>
      String(comment) !== String(commentId)
    );

    await CommentPost.update({ "$set": { "comments": deletedPostComments } });
    await Comment.findByIdAndDelete(commentId);

    const myComments = await Comment.aggregate(
      [
        {
          $match: { "user": targetComment.user }
        }
      ]
    );

    res.json({
      errorMessage: null,
      comments: myComments
    });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({ errorMessage: "서버에 문제가 있습니다." });
  }
};
