# Use official Node.js LTS slim image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Install Playwright Chromium
RUN npx playwright install chromium

# Copy the rest of the app code
COPY . .

# Expose Cloud Run port
EXPOSE 8080

# Set environment variable for Cloud Run
ENV PORT=8080

# Start the Node.js app
CMD ["node", "index.js"]
