import jwt from "jsonwebtoken";

/** Uses JWT_SECRET from .env; must match the secret used in auth middleware for verification. */
export default function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
}
