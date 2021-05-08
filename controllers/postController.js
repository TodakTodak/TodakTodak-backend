const Post = require("../models/Post");
const User = require("../models/User");

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

        res.json({
          errorMessage: null,
          postsInfo: user.posts,
        });
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

    const categoryPosts = await Post.aggregate(
      [
        {
          $match: { "category": category }
        },
        {
          $match: { "isPublic": true }
        }
      ]
    );

    res.json({
      errorMessage: null,
      categoryPosts: categoryPosts
    });
  } catch (err) {
    console.error(err.message);

    return res.status(500).json({
      errorMessage: "게시물을 가져오는데 실패했습니다",
      categoryPosts: null
    });
  }
};
