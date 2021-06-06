const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const request = supertest(app);

const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");

require("dotenv").config();

describe("COMMENT CRUD test", () => {
  let postId;
  let accessToken;
  let testCommentId;
  let deletedCommentId;

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

  describe("POST /post/comments", () => {
    beforeEach((done) => {
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
        .end(async (err, res) => {
          if (err) return done(err);

          const testPost = await Post.findOne({ title: "test title" }).lean();

          postId = testPost._id;
          done();
        });
    });

    it("should add new comment to the test post", (done) => {
      request
        .patch("/post/comments")
        .set({ "Authorization": accessToken })
        .send({
          postId,
          content: "test comment content"
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          const { errorMessage, postComments } = res.body;

          expect(errorMessage).toBe(null);
          expect(postComments.length).toBe(1);
          expect(postComments[0].nickname).toBe("testUser");
          expect(postComments[0].user).toBe("test@test.com");
          expect(postComments[0].content).toBe("test comment content");
          done();
        });
    });
  });

  describe("GET /comment", () => {
    it("should get my comments", (done) => {
      request
        .get("/comment")
        .set({ "Authorization": accessToken })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          const { errorMessage, comments } = res.body;

          expect(errorMessage).toBe(null);
          expect(comments.length).toBe(1);
          expect(comments[0].nickname).toBe("testUser");
          expect(comments[0].user).toBe("test@test.com");
          expect(comments[0].content).toBe("test comment content");

          request
            .patch("/post/comments")
            .set({ "Authorization": accessToken })
            .send({
              postId,
              content: "test comment content 2"
            })
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);

              const { errorMessage, postComments } = res.body;

              expect(errorMessage).toBe(null);
              expect(postComments.length).toBe(2);
              expect(postComments[1].content).toBe("test comment content 2");
              done();
          });
        });
    });

    describe("PATCH /comment", () => {
      beforeEach(async () => {
        const testComment = await Comment
          .findOne({ content: "test comment content" })
          .lean();

        testCommentId = testComment._id;
      });

      it("should update comment", (done) => {
        request
          .patch("/comment")
          .set({ "Authorization": accessToken })
          .send({
            commentId: testCommentId,
            comment: "update test comment content"
          })
          .expect(200)
          .end(async (err, res) => {
            if (err) return done(err);

            const updatedComment = await Comment
              .findById(testCommentId)
              .lean();

            const { errorMessage } = res.body;

            expect(errorMessage).toBe(null);
            expect(updatedComment.content).toBe("update test comment content");
            done();
          });
        });
    });

    describe("DELETE /comment/:commentId", () => {
      beforeEach(async () => {
        const targetComment = await Comment
          .findOne({ content: "test comment content 2" })
          .lean();

        deletedCommentId = targetComment._id;
      });

      it("should delete comment", (done) => {
        request
          .delete(`/comment/${deletedCommentId}`)
          .set({ "Authorization": accessToken })
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);

            const { errorMessage, comments } = res.body;

            expect(errorMessage).toBe(null);
            expect(comments.length).toBe(1);
            expect(comments[0].content).toBe("update test comment content");
            done();
          });
        });
    });
  });

  afterAll(async () => {
    await Comment.findByIdAndDelete(testCommentId);
    await Post.findOneAndDelete({ title: "test title" });
    await User.findOneAndDelete({ email: "test@test.com" });
    await mongoose.disconnect();
  });
});
