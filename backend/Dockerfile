FROM node:18-bullseye-slim

WORKDIR /app

# Install OpenSSL and ca-certificates required by Prisma
RUN apt-get update && \
    apt-get install -y libssl1.1 ca-certificates --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Install all deps (including dev deps needed for prisma generate), generate Prisma client, then remove dev deps
RUN npm ci && npx prisma generate && npm prune --production

COPY . .

EXPOSE 3001

ENV NODE_ENV=production

CMD ["npm", "start"]
