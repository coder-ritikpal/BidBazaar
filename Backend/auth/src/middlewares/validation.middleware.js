import { body, validationResult } from "express-validator";

async function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next();
}

export const registerUserValidationRules = [
  body("email").isEmail().withMessage("Invalid email addresss"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 character long"),
  body("fullName.firstName").notEmpty().withMessage("First name required."),
  body("fullName.lastName").notEmpty().withMessage("last name required."),
  validate
];
