# Install production dependencies in an isolated build stage.
FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Run the notification consumer in a small production image.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY server.js ./

EXPOSE 3006

CMD ["node", "server.js"]
