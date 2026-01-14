# Build stage
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Production stage
# Switch to slim (Debian) for maximum compatibility with Prisma binaries
FROM node:20-slim AS production

# Install openssl and other mandatory libraries for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --only=production

# Copy Prisma schema
COPY prisma ./prisma/

# Re-generate Prisma client for production environment
RUN npx prisma generate

# Copy the built dist folder from builder
COPY --from=builder /app/dist ./dist

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Final Start Command
CMD ["sh", "-c", "if [ -f dist/main.js ]; then node dist/main.js; else node dist/src/main.js; fi"]
