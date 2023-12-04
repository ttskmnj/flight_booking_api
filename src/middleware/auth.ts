import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();

const getToken = (req: Request) => {
  const authorization = req.get("authorization");

  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "");
  }
  return null;
};

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = getToken(req);

  if (token) {
    try {
      const decodedToken: any = jwt.verify(token, process.env.SECRET as Secret);

      if (decodedToken.id && decodedToken.name && decodedToken.code) {
        req.user = {
          id: decodedToken.id,
          name: decodedToken.name,
          code: decodedToken.code,
        };
        return next();
      }
    } catch (err) {
      return res.status(401).json(err);
    }
  }

  return res.status(401).json({ error: "token invalid or expired" });
}
