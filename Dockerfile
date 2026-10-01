FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY . .
ENV GITHUB_PAGES=false
RUN pnpm --filter web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV STATIC_DIR=/app/public
COPY apps/api/package.json ./package.json
COPY apps/api/server.mjs ./server.mjs
RUN npm install --omit=dev
COPY --from=builder /app/apps/web/out ./public
EXPOSE 8080
CMD ["node", "server.mjs"]
