/**
 * utils/generateToken.js
 * --------------------------------------------------
 * Generates a signed JSON Web Token (JWT) for a
 * given user ID. The token expires in 30 days.
 *
 * The JWT_SECRET is read from the environment
 * variables defined in .env.
 * --------------------------------------------------
 */

import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export default generateToken;
