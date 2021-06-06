const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const request = supertest(app);

const Post = require("../models/Post");
const User = require("../models/User");

require("dotenv").config();

describe("POST CRUD test", () => {
  let accessToken;
  let postId;

  beforeAll((done) => {
    mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
      useCreateIndex: true
    })
    .then(() => {
      request
        .post("/auth")
        .send({
          email: "test@test.com",
          password: "test123456",
          nickname: "testUser"
        })
        .end((err, res) => {
          if (err) return done(err);
          request
            .put("/auth")
            .send({
              email: "test@test.com",
              password: "test123456",
              nickname: "testUser"
            })
            .end((err, res) => {
              if (err) return done(err);

              accessToken = res.body.token;
              done();
            });
        });
    })
    .catch((err) => {
      done(err);
    });
  });

  describe("POST /post", () => {
    it("should create new Post", (done) => {
      request
        .post("/post")
        .set({ "Authorization": accessToken })
        .send({
          postType: "Public",
          category: "고통",
          postTitle: "test title",
          worryContents: "test contents",
          anonymousType: "nickname"
        })
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);

          const { errorMessage } = res.body;

          expect(errorMessage).toBe(null);
          done();
        });
    });
  });

  describe("GET /post/${postId}", () => {
    beforeEach(async () => {
      const testPost = await Post.findOne({ title: "test title" }).lean();

      postId = testPost._id;
    });

    it("should get detail post", (done) => {
      request
        .get(`/post/${postId}`)
        .set({ "Authorization": accessToken })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          const { errorMessage, post } = res.body;

          expect(errorMessage).toBe(null);
          expect(post.title).toBe("test title");
          expect(post.category).toBe("고통");
          expect(post.isPublic).toBe(true);
          expect(post.isAnonymous).toBe(false);
          done();
        });
    });
  });

  describe("PATCH /post", () => {
    it("should update post category", (done) => {
      request
        .patch("/post")
        .set({ "Authorization": accessToken })
        .send({
          postId,
          postType: "Public",
          category: "사랑",
          postTitle: "test title",
          worryContents: "test contents",
          anonymousType: "nickname"
        })
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);

          const { errorMessage } = res.body;
          const updatedPost = await Post.findById(postId).lean();

          expect(errorMessage).toBe(null);
          expect(updatedPost.category).toBe("사랑");
          done();
        });
    });
  });

  describe("DELETE /post/${postId}", () => {
    it("should delete post", (done) => {
      request
        .delete(`/post/${postId}`)
        .set({ "Authorization": accessToken })
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);

          const { errorMessage, posts } = res.body;

          expect(errorMessage).toBe(null);
          expect(posts).toStrictEqual([]);
          done();
        });
    });
  });

  afterAll(async () => {
    await User.findOneAndDelete({ email: "test@test.com" });
    await mongoose.disconnect();
  });
});
