# ---- Builder Stage ----
# Installs all dependencies (including dev) and builds the TypeScript source.
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Production Stage ----
# Creates the final, smaller image with only production code and dependencies.
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copy the built code from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 5000
CMD ["npm", "start"]
