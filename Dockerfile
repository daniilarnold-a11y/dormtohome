FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY . .

# Create data directory for SQLite persistence
RUN mkdir -p /data

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
  && chown -R appuser:appgroup /app /data
USER appuser

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/dormtohome.db

EXPOSE 3000

CMD ["node", "server.js"]
