FROM node:20-bookworm-slim

WORKDIR /app

# Install OpenSSL and ca-certificates required by Prisma. Debian 12 ships
# OpenSSL 3 (there is no libssl1.1 package); Prisma detects the version when
# the client is generated, so no binaryTargets are pinned in the schema.
RUN apt-get update && \
    apt-get install -y openssl ca-certificates --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Install all deps (including dev deps needed for prisma generate), generate Prisma client, then remove dev deps
RUN npm ci && npx prisma generate && npm prune --production

COPY . .

EXPOSE 3001

ENV NODE_ENV=production

CMD ["sh", "-lc", "echo 'Running Prisma migrations'; npx prisma migrate deploy; echo 'Starting AdultEdu API'; exec node src/index.js"]
