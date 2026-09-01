###############################################
################# Instructions ################
###############################################
#### To build image, go to project root directory and run:
###### docker build -t extendederp/nathalie-lopez:amd64-v1 .
#### To push image, run:
###### docker login --username=jackharmon
###### docker push extendederp/nathalie-lopez:amd64-v1

# ---- Stage 1: Build ----
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source and config files
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json eslint.config.js ./
COPY src/ src/
COPY public/ public/

# Build the application (VITE_BASE_PATH sets the URL prefix, default is /)
ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:1.27-alpine

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
