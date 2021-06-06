const mongoose = require("mongoose");
const supertest = require("supertest");

const app = require("../app");
const request = supertest(app);
const User = require("../models/User");

require("dotenv").config();

describe("user signup & login test", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
      useCreateIndex: true
    });
  });

  describe("POST /auth", () => {
    it("should user signup", (done) => {
      request
        .post("/auth")
        .send({
          email: "test@test.com",
          password: "test123456",
          nickname: "testUser"
        })
        .expect(201)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          const { errorMessage } = res.body;

          expect(errorMessage).toBe(null);
          done();
        });
    });
  });

  describe("PUT /auth", () => {
    it("should user login", (done) => {
      request
        .put("/auth")
        .send({
          email: "test@test.com",
          password: "test123456"
        })
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);

          const { errorMessage, loginInfo, token } = res.body;

          await User.findOneAndDelete({ email: "test@test.com" });

          expect(errorMessage).toBe(null);
          expect(loginInfo).toBeTruthy();
          expect(token).toBeTruthy();
          done();
        });
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
});
