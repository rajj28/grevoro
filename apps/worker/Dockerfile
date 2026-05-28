FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker
COPY infra/prisma ./infra/prisma
RUN pnpm --filter worker prisma generate
RUN pnpm --filter worker build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=builder /app/infra/prisma ./infra/prisma

CMD ["node", "dist/index.js"]
