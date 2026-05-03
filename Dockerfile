FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Install tailwindcss CLI for build step
RUN npm install --save-dev @tailwindcss/cli tailwindcss

COPY . .

# Build CSS
RUN node_modules/.bin/tailwindcss -i src/css/input.css -o public/css/app.css --minify

# Remove dev deps after CSS build
RUN npm prune --omit=dev

EXPOSE 3000
CMD ["node", "src/index.js"]
