FROM node:latest
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
RUN npm install -g nodemon
COPY app/package*.json ./
RUN npm install
COPY ./app ./
EXPOSE 8080