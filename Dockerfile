FROM node:22-slim

# Install system dependencies for Chromium
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libpango-1.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxkbcommon0 \
    libxrandr2 \
    libxshmfence1 \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (better cache)
COPY package.json package-lock.json* ./

# Install Node dependencies (including Playwright)
RUN npm install

# Force Playwright browsers into node_modules
ENV PLAYWRIGHT_BROWSERS_PATH=0

# Install Chromium for the LOCAL Playwright version
RUN npx playwright install chromium

# Copy application code
COPY . .

EXPOSE 8080
ENV PORT=8080

CMD ["node", "index.js"]
