FROM node:16

WORKDIR /usr/app
COPY package.json src/  ./
COPY prisma ./prisma
COPY tsconfig.json ./
COPY init.sh  ./
COPY src/  ./src
COPY data/ ./data

RUN npm install 
RUN npm install -g typescript

RUN npx tsc

CMD ["/bin/sh", "./init.sh"]
