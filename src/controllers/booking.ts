import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();
import { Router, Request, Response } from "express";

type AllConfirmNums = {
  confirmNum: number;
};

const prisma = new PrismaClient();

export const bookingRouter = Router();

/////////////////////////////////////////////////////////
// generate unique random 6 letter confirmation number //
/////////////////////////////////////////////////////////
const genConfirmNumber = async () => {
  // get all onfirmation number
  const allConfirmNums = (
    await prisma.booking.findMany({
      select: {
        confirmNum: true,
      },
    })
  ).map((booking: AllConfirmNums) => booking.confirmNum);

  // repeat confirmation number generation maximum 10 times
  for (let i = 0; i < 10; i++) {
    const confirmationNum = Math.floor(Math.random() * 1000000);

    if (!allConfirmNums.includes(confirmationNum)) {
      return confirmationNum;
    }
  }

  return null;
};

bookingRouter.post("/", async (req: Request, res: Response) => {
  const { flightId, firstName, lastName } = req.body;

  // check if flightId is number
  if (!Number(flightId)) {
    return res.status(400).json({ error: `invalid flight id` });
  }

  // get flight information
  const flight = await prisma.flight.findFirst({
    select: {
      numSeat: true,
      bookings: true,
    },
    where: {
      id: Number(flightId),
    },
  });

  // check flight exist and  booking availability
  if (!flight) {
    return res.status(400).json({ error: `flight id: ${flightId} not found` });
  } else if (flight.numSeat <= flight.bookings.length) {
    return res
      .status(400)
      .json({ error: `flight id: ${flightId} is fully booked` });
  }

  const confirmNum = await genConfirmNumber();

  if (!confirmNum) {
    console.error("failed to generate confirmation numnber");
    return res.status(500).json({
      error: `failed to book flight ${flightId}. failed to generate confirmation numnber`,
    });
  }

  // add booking
  try {
    const booking = await prisma.booking.create({
      data: {
        confirmNum,
        firstName,
        lastName,
        flightId,
      },
    });

    res.status(200).json(booking);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: `failed to book flight ${flightId}`,
    });
  }
});

bookingRouter.get(
  "/:confirmNum/:lastName/",
  async (req: Request, res: Response) => {
    const { confirmNum, lastName } = req.params;

    // check confirmation number is number
    if (!Number(confirmNum)) {
      return res.status(400).json({ error: "Invalid Confirmation Number" });
    }

    // find booking
    const booking = await prisma.booking.findFirst({
      select: {
        confirmNum: true,
        firstName: true,
        lastName: true,
        flight: true,
      },
      where: {
        confirmNum: Number(confirmNum),
        lastName,
      },
    });
    booking
      ? res.status(200).json(booking)
      : res
          .status(400)
          .json({ error: "Invalid Confirmation Number or last Name" });
  },
);
