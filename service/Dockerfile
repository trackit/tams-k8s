FROM node:20-alpine

WORKDIR /app

COPY ./ ./

RUN npm install

RUN npm run build

ENTRYPOINT ["node", "dist/index.js"]
