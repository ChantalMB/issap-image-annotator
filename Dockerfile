FROM node:12-alpine

# install dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Copy all local files into the image.
COPY . ./

RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
