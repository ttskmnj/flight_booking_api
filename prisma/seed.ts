import { PrismaClient } from "@prisma/client";
import * as airportJson from "../data/airport-codes_json.json";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const main = async () => {

  console.log("##################################### \n add users");
  const wizzair = await prisma.user.upsert({
    where: {
      code: "W6",
    },
    update: {},
    create: {
      name: "Wizz Air",
      code: "W6",
      hashedPass: "$2b$12$uPwgrBoXGBQmo4OnYZoVIe.UYc6EocKno9JFs/tl.bqJHI5SVyueC",
    },
  });

  const ryanair = await prisma.user.upsert({
    where: {
      code: "FR",
    },
    update: {},
    create: {
      name: "Ryanair",
      code: "FR",
      hashedPass: "$2b$12$X5jpdivh.cb0GUI6HYBSz.DwNHhXt1ABmVqOX1zLO4JGqSiETYO82",
    },
  });

  console.log("# 2 users added\n", wizzair, ryanair);

  console.log("##################################### \n add airports");
  const airportData = Object.values(airportJson)
    .filter(
      (airport) =>
        airport.iata_code !== null && airport.iata_code !== undefined,
    )
    .map((airport) => {
      return {
        code: airport.iata_code,
        name: airport.name,
      };
    });

  await prisma.airport.createMany({
    data: airportData,
    skipDuplicates: true,
  });
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
