import jwt from "jsonwebtoken";

export const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "intellicampus_secret_key_2026", {
    expiresIn: "7d",
  });
};
