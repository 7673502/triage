FROM node:24.4.1-bookworm-slim AS build
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm ci
COPY ./frontend ./
RUN npm run build

FROM nginx:1.25-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
