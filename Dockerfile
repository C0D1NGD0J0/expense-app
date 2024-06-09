FROM node:21-alpine

WORKDIR /server

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

EXPOSE ${PORT:-5000}

CMD [ "npm", "run", "deploy" ]
