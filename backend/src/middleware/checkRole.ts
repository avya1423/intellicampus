import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        message: `Role (${req.user?.role || "unknown"}) is not allowed to access this resource`,
      });
      return;
    }
    next();
  };
};
