FROM node:18-alpine AS build

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package.json ./

# Clean install with legacy peer deps
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV NODE_ENV=production

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
