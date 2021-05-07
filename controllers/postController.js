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
      isPublic,
      isAnonymous,
      contents: worryContents,
      category
    });

    currentUser.post.push(newPost._id);

    await currentUser.save();

    res.json({ errorMessage: null });
  } catch (error) {
    console.error(err.message);

    res.status(500).json({
      errorMessage: "서버에 문제가 발생했습니다"
    });
  }
};
