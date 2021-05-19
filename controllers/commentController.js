const createError = require("http-errors");

const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");

const { SERVER_MESSAGE } = require("../constants/errorComment");

module.exports.getComments = async (req, res, next) => {
  try {
    const { useremail } = req.headers;

    const fileredComment = await Comment.aggregate(
      [
        {
          $match: { "user": useremail }
        }
      ]
    );

    res.json({
      errorMessage: null,
      comments: fileredComment
    });
  } catch (err) {
    console.error(err.message);

    return next(createError(500, {
      errorMessage: SERVER_MESSAGE,
      comments: null
    }));
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

    return next(createError(500, { errorMessage: SERVER_MESSAGE }));
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

    return next(createError(500, { errorMessage: SERVER_MESSAGE }));
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

    return next(createError(500, { errorMessage: SERVER_MESSAGE }));
  }
};
