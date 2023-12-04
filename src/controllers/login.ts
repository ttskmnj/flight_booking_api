import jwt, { Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();
import { Router, Request, Response } from "express";

const prisma = new PrismaClient();
const LOGINLIMIT = 600;

export const loginRouter = Router();

loginRouter.post("/", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  // get user for given username
  const user = await prisma.user.findFirst({
    where: { name: username },
  });

  // check paasowrd
  const passwordCorrect = !user
    ? false
    : await bcrypt.compare(password, user.hashedPass);

  if (!(user && passwordCorrect)) {
    return res.status(401).json({
      error: "invalid username or password",
    });
  }

  // set user info for token
  const userForToken = {
    id: user.id,
    name: user.name,
    code: user.code,
  };

  try {
    // generate token with user info
    const token = jwt.sign(userForToken, process.env.SECRET as Secret, {
      expiresIn: LOGINLIMIT,
    });

    res.status(200).send({ token });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "failed to login. failed to generate token" });
  }
});
