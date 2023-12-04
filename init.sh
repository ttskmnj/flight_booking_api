#!/bin/sh
npx prisma migrate dev --name init
npx prisma db seed
npx prisma generate
npm start