const Joi = require("joi");

module.exports.validateSignupInfo = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    nickname: Joi.string().required()
  });

  validateRequest(req, next, schema);
};

const validateRequest = (req, next, schema) => {
  const options = {
    allowUnknown: true,
    stripUnknown: true
  };

  const { error, value } = schema.validate(req.body, options);

  if (error) {
    next(error.message);
  } else {
    req.body = value;
    next();
  }
};
