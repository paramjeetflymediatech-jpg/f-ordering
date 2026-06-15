# Stage 1: Build dependencies and assets
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build next.js app
RUN npm run build

# Stage 2: Runtime image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/src ./src

# Install ts-node globally in runtime to execute typescript server files directly
RUN npm install -g ts-node typescript @types/node

EXPOSE 3000

CMD ["ts-node", "src/server.ts"]
