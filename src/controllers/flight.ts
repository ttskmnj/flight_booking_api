import { PrismaClient } from "@prisma/client";
import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";

const prisma = new PrismaClient();

export const flightRouter = Router();

const getAirport = (code: string) => {
  return code
    ? prisma.airport.findFirst({
        select: {
          id: true,
        },
        where: {
          code: code as string,
        },
      })
    : null;
};

const checkValidAirport = async (origin: string, dest: string) => {
  const originAirport = await getAirport(origin);
  const destAirport = await getAirport(dest);

  if (!originAirport || !destAirport || origin == dest) {
    return null;
  }

  return { originId: originAirport.id, destId: destAirport.id };
};

const generateFlightNumber = async (code: string) => {
  const newestFlight = await prisma.flight.findFirst({
    select: {
      flightNum: true,
    },
    where: {
      flightNum: {
        startsWith: code,
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  const newFlightNum = newestFlight
    ? Number(newestFlight.flightNum.replace(code, "")) + 1
    : 0;

  return (code + newFlightNum) as string;
};

const checkValidDate = (date: string) => {
  return new Date(date).toString() === "Invalid Date" ? false : true;
};

flightRouter.post("/", authenticate, async (req: Request, res: Response) => {
  const { origin, dest, date, numSeat } = req.body;

  if (!checkValidDate(date)) {
    return res.status(401).json({
      error: "invalid date",
    });
  }

  const validAirport = await checkValidAirport(origin, dest);

  if (!validAirport) {
    return res.status(401).json({
      error: "invalid origin or destination",
    });
  }

  const { originId, destId } = validAirport;

  const flightNum = await generateFlightNumber(req.user!.code);

  try {
    const flight = await prisma.flight.create({
      data: {
        flightNum,
        numSeat: numSeat as number,
        originId,
        destId,
        date,
        airlineId: req.user!.id,
      },
    });

    res.status(200).send(flight);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: `failed to create flight` });
  }
});

flightRouter.delete("/", authenticate, async (req: Request, res: Response) => {
  const { flightNum } = req.body;

  if (flightNum.slice(0, 2) !== req.user!.code) {
    return res.status(400).json({
      error: "cannot delete other airline's flight",
    });
  }

  try {
    await prisma.flight.delete({
      where: {
        flightNum,
      },
    });

    res.status(200).json({
      message: `flight number: ${flightNum} is deleted`,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: `failed to delete flight number: ${flightNum}` });
  }
});

flightRouter.get(
  "/:origin/:dest/:date",
  async (req: Request, res: Response) => {
    const { origin, dest, date } = req.params;

    if (!checkValidDate(date)) {
      return res.status(401).json({
        error: "invalid date",
      });
    }

    const validAirport = await checkValidAirport(origin, dest);

    if (!validAirport) {
      return res.status(401).json({
        error: "invalid origin or destination",
      });
    }

    const { originId, destId } = validAirport;

    const flights = await prisma.flight.findMany({
      where: {
        origin: {
          id: originId,
        },
        dest: {
          id: destId,
        },
        date: {
          gte: `${date}T00:00:00.000Z`,
          lte: `${date}T23:59:59.999Z`,
        },
      },
    });

    res.status(200).json(flights);
  },
);
