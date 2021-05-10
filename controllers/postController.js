const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");

module.exports.postWorryPost = async (req, res, next) => {
  try {
    const {
      postType,
      anonymousType,
      category,
      worryContents,
      postTitle,
      user: { email }
    } = req.body;

    const isPublic = postType === "Public" ? true : false;
    const isAnonymous = anonymousType === "anonymouns" ? true : false;

    if (
      !postType ||
      !anonymousType ||
      !category ||
      !worryContents
    ) {
      return res.status(400).json({
        errorMessage: "누락된 정보가 있습니다. 확인 부탁드립니다"
      });
    }

    const currentUser = await User.findOne({ email });
    const newPost = await Post.create({
      title: postTitle,
      owner: currentUser._id,
      ownerNickname: currentUser.nickname,
      isPublic,
      isAnonymous,
      contents: worryContents,
      category
    });

    currentUser.posts.push(newPost._id);
    await currentUser.save();

    res.json({ errorMessage: null });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      errorMessage: "서버에 문제가 발생했습니다"
    });
  }
};

module.exports.getMyPosts = async (req, res, next) => {
  try {
    const { userEmail } = req.params;

    User.findOne({ email: userEmail })
      .populate("posts")
      .exec((err, user) => {
        if (err) {
          console.error(err.message);

          return res.status(500).json({
            errorMessage: "게시물을 가져오는데 실패했습니다",
            posts: null
          });
        }

        Post.populate(
          user.posts,
          { path: "comments" },
          (err, populatedPost) => {
            if (err) {
              console.error(err.message);

              return res.status(500).json({
                errorMessage: "게시물을 가져오는데 실패했습니다",
                posts: null
              });
            }

            res.json({
              errorMessage: null,
              postsInfo: populatedPost
            });
          }
        )
      });
  } catch (err) {
    console.error(err.message);

    return res.status(500).json({
      errorMessage: "게시물을 가져오는데 실패했습니다",
      posts: null
    });
  }
};

module.exports.getCategoryPost = async (req, res, next) => {
  try {
    const { category } = req.params;

    await Post
      .aggregate(
        [
          {
            $match: { "category": category }
          },
          {
            $match: { "isPublic": true }
          }
        ]
      ).exec((err, posts) => {
        if (err) {
          return res.status(500).json({
            categoryPosts: null,
            highestLikesPost: null,
            errorMessage: "게시물을 가져오는데 실패했습니다"
          });
        }

        Post.populate(
          posts,
          { path: "comments" },
          (err, populatedPosts) => {
            if (err) {
              return res.status(500).json({
                categoryPosts: null,
                highestLikesPost: null,
                errorMessage: "게시물을 가져오는데 실패했습니다"
              });
            }

            const sortPostLikes = (prev, next) => {
              if (prev.likes.length > next.likes.length) {
                return -1;
              }

              return 1;
            };

            const bestPost = populatedPosts.sort(sortPostLikes)[0];

            res.json({
              errorMessage: null,
              highestLikesPost: bestPost,
              categoryPosts: populatedPosts
            });
          }
        );
      });
  } catch (err) {
    console.error(err.message);

    return res.status(500).json({
      categoryPosts: null,
      highestLikesPost: null,
      errorMessage: "게시물을 가져오는데 실패했습니다"
    });
  }
};

module.exports.patchPostLike = async (req, res, next) => {
  try {
    const { user, postId } = req.body;

    const targetPost = await Post.findById(postId);
    let targetPostLikes = targetPost.likes;
    const isLikedUser = targetPostLikes.includes(user);

    if (isLikedUser) {
      const removeIndex = targetPostLikes.indexOf(user);

      targetPostLikes.splice(removeIndex, 1);
    } else {
      targetPostLikes.push(user);
    }

    await targetPost.updateOne({
      "$set": { "likes": targetPostLikes }
    });

    res.json({ errorMessage: null });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      errorMessage: "서버에 문제가 있습니다. 다시 시도해 주세요"
    });
  }
};

module.exports.patchPostCommentLike = async (req, res, next) => {
  try {
    const { user, postId, commentId } = req.body;

    const targetUser = await User.findOne({ email: user });
    const targetComment = await Comment.findById(commentId);
    let commentLikeList = targetComment.likes;
    const isLikedUser = commentLikeList.includes(targetUser._id);

    if (isLikedUser) {
      const removeIndex = commentLikeList.indexOf(targetUser._id);

      commentLikeList.splice(removeIndex, 1);
    } else {
      commentLikeList.push(targetUser._id);
    }

    await targetComment.updateOne({
      "$set": { "likes": commentLikeList }
    });

    Post.findById(postId)
      .populate("comments")
      .exec((err, post) => {
        if (err) {
          console.error(err.message);

          return res.status(500).json({
            errorMessage: "서버에 문제가 있습니다. 다시 시도해 주세요",
            postComments: null
          });
        }

        res.json({
          errorMessage: null,
          postComments: post.comments
        });
      });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      errorMessage: "서버에 문제가 있습니다. 다시 시도해 주세요",
      postComments: null
    });
  }
};

module.exports.patchPostComments = async (req, res, next) => {
  try {
    const { user, postId, content } = req.body;

    const currentPost = await Post.findById(postId);
    const newComment = await Comment.create({
      content,
      post: postId,
      user: user.email
    });

    currentPost.comments.push(newComment._id);
    await currentPost.save();

    Post.findById(postId)
    .populate("comments")
    .exec((err, post) => {
      if (err) {
        console.error(err.message);

        return res.status(500).json({
          errorMessage: "서버에 문제가 있습니다. 다시 시도해 주세요",
          postComments: null
        });
      }

      res.json({
        errorMessage: null,
        postComments: post.comments
      });
    });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      errorMessage: "서버에 문제가 있습니다.",
      postComments: null
    });
  }
};
