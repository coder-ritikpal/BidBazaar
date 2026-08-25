# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

# Runtime stage
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY package*.json ./

COPY src ./src
COPY server.js .

EXPOSE 3002

CMD ["node", "server.js"]
