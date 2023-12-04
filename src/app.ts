import express, { Request, Response } from "express";
import * as dotenv from "dotenv";
dotenv.config();
import { loginRouter } from "./controllers/login";
import { flightRouter } from "./controllers/flight";
import { bookingRouter } from "./controllers/booking";

const app = express();
const port = process.env.PORT || 3000;

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name: string;
        code: string;
      } | null;
    }
  }
}

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "ok" });
});

app.use("/login", loginRouter);
app.use("/flight", flightRouter);
app.use("/booking", bookingRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
