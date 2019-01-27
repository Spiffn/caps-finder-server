# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# production stage
EXPOSE 8081
CMD ["npm", "start"]