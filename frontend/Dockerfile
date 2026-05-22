FROM node:22-alpine

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend /app/frontend

EXPOSE 5173
