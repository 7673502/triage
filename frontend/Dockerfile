# Stage 1: Dev environment
FROM node:24.4.1-bookworm-slim AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# Stage 2: Build static files
FROM node:24.4.1-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Serve with nginx
FROM nginx:1.25-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
