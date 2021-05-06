const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

module.exports.postSignup = async (req, res, next) => {
  try {
    let { email, password, nickname } = req.body;

    if (
      email === "" ||
      password === "" ||
      nickname === ""
    ) {
      return res.status(400).json({
        errorMessage: "누락된 정보가 있습니다. 확인 부탁드립니다",
      });
    }

    const existEamil = await User.findOne({ email }).lean();

    if (existEamil) {
      return res.status(400).json({
        errorMessage: "이미 존재하는 이메일입니다. 다른 이메일을 입력해주세요",
      });
    }

    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        console.error(err.message);

        return res.status(500).json({
          errorMessage: "서버에 문제가 발생했습니다.",
        });
      }

      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          console.error(err.message);

          return res.status(500).json({
            errorMessage: "서버에 문제가 발생했습니다.",
          });
        }

        password = hash;

        const user = new User({
          email,
          password,
          nickname
        });

        await user.save();

        return res.status(201).json({
          errorMessage: null
        });
      });
    });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      errorMessage: "서버에 문제가 발생했습니다.",
    });
  }
};
