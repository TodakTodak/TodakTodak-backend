const Comment = require("../models/Comment");
const Post = require("../models/Post");

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
