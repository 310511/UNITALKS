# --- PART 1: Build the React Frontend ---
FROM node:18-alpine as frontend-build

WORKDIR /app

# Copy entire client folder and install dependencies
COPY client ./client
RUN cd client && npm install
RUN cd client && npm run build

# --- PART 2: Setup the Server + Redis ---
FROM node:18-alpine

WORKDIR /app

# Install Redis (Required for scaling/state management)
RUN apk add --no-cache redis

# Install Backend Dependencies
COPY server ./server
RUN cd server && npm install

# Copy built frontend into backend
COPY --from=frontend-build /app/client/build ./server/client/build

# Hugging Face Settings
ENV NODE_ENV=production
ENV PORT=7860
ENV REDIS_HOST=127.0.0.1
ENV REDIS_PORT=6379
ENV TURN_SECRET_KEY=dummy_secret_for_testing

WORKDIR /app/server
EXPOSE 7860

# Start Redis in the background, then start Node
CMD redis-server --daemonize yes && node server.js