FROM node:12-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
