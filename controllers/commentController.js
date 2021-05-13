const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");

module.exports.getComments = async (req, res, next) => {
  try {
    const { userEmail } = req.params;

    await Comment
      .aggregate(
        [
          {
            $match: { "user": userEmail }
          }
        ]
      ).exec((err, comments) => {
        if (err) {
          return res.status(500).json({
            errorMessage: "서버에 문제가 있습니다.",
            comments: null
          });
        }

        Comment.populate(
          comments,
          { path: "post" },
          (err, populatedComments) => {
            if (err) {
              return res.status(500).json({
                errorMessage: "서버에 문제가 있습니다.",
                comments: null
              });
            }

            Comment.populate(
              populatedComments,
              { path: "post.comments" },
              (err, populatedPostComments) => {
                if (err) {
                  return res.status(500).json({
                    errorMessage: "서버에 문제가 있습니다.",
                    comments: null
                  });
                }

                res.json({
                  errorMessage: null,
                  commentsInfo: populatedPostComments
                });
              }
            );
          }
        );
      });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      errorMessage: "서버에 문제가 있습니다.",
      comments: null
    });
  }
};

module.exports.patchComment = async (req, res, next) => {
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
