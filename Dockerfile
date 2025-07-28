# Stage 1: Build the Angular app in a node environment
FROM node:22-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . ./

RUN npm run build:prod

# Stage 2: Serve the app with nginx
FROM caddy:alpine

ENV NODE_ENV production

COPY --from=build /app/dist/fuse/browser /dist

COPY Caddyfile /etc/caddy/Caddyfile

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]

