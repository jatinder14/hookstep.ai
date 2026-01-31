# Recognize server (node-shazam + ffmpeg) for Cloud Run
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
COPY recognize ./recognize
RUN npm ci

ENV NODE_ENV=production
EXPOSE 8080
ENV PORT=8080

CMD ["npm", "run", "recognize"]
