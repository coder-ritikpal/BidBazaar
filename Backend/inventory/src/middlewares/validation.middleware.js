import { body, validationResult } from "express-validator";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  PRODUCT_SIZE_UNITS,
  PRODUCT_DURATION_UNITS,
  PRODUCT_WEIGHT_UNITS,
} from "../constants/product.constants.js";
import config from "../config/config.js";

const REVIEW_WINDOW_MS = (config.REVIEW_WINDOW_MINUTES || 30) * 60 * 1000;
const MIN_AUCTION_DURATION_MS = (config.MIN_AUCTION_DURATION_MINUTES || 5) * 60 * 1000;

function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next();
}

export const createProductValidationRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required."),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required."),

  body("price")
    .notEmpty()
    .withMessage("Price is required.")
    .bail()
    .isFloat({ gt: 0 })
    .withMessage("Price must be a number greater than 0."),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required.")
    .bail()
    .isIn(PRODUCT_CATEGORIES)
    .withMessage(`Category must be one of: ${PRODUCT_CATEGORIES.join(", ")}.`),

  body("size")
    .trim()
    .notEmpty()
    .withMessage("Size is required.")
    .bail()
    .matches(/^\d+(\.\d+)?\*\d+(\.\d+)?$/)
    .withMessage("Size must be in a*b format, for example 10*20."),

  body("sizeUnit")
    .trim()
    .notEmpty()
    .withMessage("Size unit is required.")
    .bail()
    .isIn(PRODUCT_SIZE_UNITS)
    .withMessage(`Size unit must be one of: ${PRODUCT_SIZE_UNITS.join(", ")}.`),

  body("weight")
    .notEmpty()
    .withMessage("Weight is required.")
    .bail()
    .isFloat({ gt: 0 })
    .withMessage("Weight must be a number greater than 0."),

  body("weightUnit")
    .trim()
    .notEmpty()
    .withMessage("Weight unit is required.")
    .bail()
    .isIn(PRODUCT_WEIGHT_UNITS)
    .withMessage(`Weight unit must be one of: ${PRODUCT_WEIGHT_UNITS.join(", ")}.`),

  body("color")
    .trim()
    .notEmpty()
    .withMessage("Color is required."),

  body("material")
    .trim()
    .notEmpty()
    .withMessage("Material is required."),

  body("brand")
    .optional({ values: "falsy" })
    .trim()
    .isString()
    .withMessage("Brand must be a valid string."),

  body("condition")
    .trim()
    .notEmpty()
    .withMessage("Condition is required.")
    .bail()
    .isIn(PRODUCT_CONDITIONS)
    .withMessage(`Condition must be one of: ${PRODUCT_CONDITIONS.join(", ")}.`),

  body("auctionDuration")
    .notEmpty()
    .withMessage("Auction duration is required.")
    .bail()
    .isInt({ gt: 0 })
    .withMessage("Auction duration must be an integer greater than 0.")
    .bail()
    .custom((value, { req }) => {
      const duration = Number(value);
      const unit = req.body.auctionDurationUnit;
      let durationInMs;

      switch (unit) {
        case "minutes":
          durationInMs = duration * 60 * 1000;
          break;
        case "hours":
          durationInMs = duration * 60 * 60 * 1000;
          break;
        default: // days
          durationInMs = duration * 24 * 60 * 60 * 1000;
      }

      if (durationInMs < MIN_AUCTION_DURATION_MS) {
        throw new Error(`Auction duration must be at least ${config.MIN_AUCTION_DURATION_MINUTES || 5} minutes.`);
      }

      return true;
    }),

  body("auctionDurationUnit")
    .trim()
    .notEmpty()
    .withMessage("Auction duration unit is required.")
    .bail()
    .isIn(PRODUCT_DURATION_UNITS)
    .withMessage(`Auction duration unit must be one of: ${PRODUCT_DURATION_UNITS.join(", ")}.`),
  validate,
];

export const updateProductValidationRules = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty."),

  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Description cannot be empty."),

  body("price")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Price must be a number greater than 0."),

  body("category")
    .optional()
    .trim()
    .isIn(PRODUCT_CATEGORIES)
    .withMessage(`Category must be one of: ${PRODUCT_CATEGORIES.join(", ")}.`),

  body("size")
    .optional()
    .trim()
    .matches(/^\d+(\.\d+)?\*\d+(\.\d+)?$/)
    .withMessage("Size must be in a*b format, for example 10*20."),

  body("sizeUnit")
    .optional()
    .trim()
    .isIn(PRODUCT_SIZE_UNITS)
    .withMessage(`Size unit must be one of: ${PRODUCT_SIZE_UNITS.join(", ")}.`),

  body("weight")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Weight must be a number greater than 0."),

  body("weightUnit")
    .optional()
    .trim()
    .isIn(PRODUCT_WEIGHT_UNITS)
    .withMessage(`Weight unit must be one of: ${PRODUCT_WEIGHT_UNITS.join(", ")}.`),

  body("color")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Color cannot be empty."),

  body("material")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Material cannot be empty."),

  body("brand")
    .optional({ values: "falsy" })
    .trim()
    .isString()
    .withMessage("Brand must be a valid string."),

  body("condition")
    .optional()
    .trim()
    .isIn(PRODUCT_CONDITIONS)
    .withMessage(`Condition must be one of: ${PRODUCT_CONDITIONS.join(", ")}.`),

  body("auctionDuration")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Auction duration must be an integer greater than 0.")
    .bail()
    .custom((value, { req }) => {
      if (req.body.auctionDurationUnit === undefined) {
        return true;
      }

      const duration = Number(value);
      const unit = req.body.auctionDurationUnit;
      let durationInMs;

      switch (unit) {
        case "minutes":
          durationInMs = duration * 60 * 1000;
          break;
        case "hours":
          durationInMs = duration * 60 * 60 * 1000;
          break;
        default: // days
          durationInMs = duration * 24 * 60 * 60 * 1000;
      }

      if (durationInMs < MIN_AUCTION_DURATION_MS) {
        throw new Error(`Auction duration must be at least ${config.MIN_AUCTION_DURATION_MINUTES || 5} minutes.`);
      }

      return true;
    }),

  body("auctionDurationUnit")
    .optional()
    .trim()
    .isIn(PRODUCT_DURATION_UNITS)
    .withMessage(`Auction duration unit must be one of: ${PRODUCT_DURATION_UNITS.join(", ")}.`),

  validate,
];
