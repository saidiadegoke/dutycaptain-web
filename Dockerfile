# syntax=docker/dockerfile:1
# Multi-stage build for the DutyCaptain console (Next.js, standalone output).

FROM node:23-alpine AS base

# --- deps: install everything, including dev deps needed to build ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- builder: compile the standalone server ---
FROM base AS builder
WORKDIR /app
# NEXT_PUBLIC_* values are inlined into the client bundle at BUILD time, so they
# must be present here — not just at runtime. Supplied as build args; see
# docker-compose.yml, which sources them from .env.
# Defaults matter: a declared-but-unpassed ARG expands to an EMPTY STRING, and
# `ENV X=${ARG}` then sets X="" — which overrides .env and would survive a `??`
# fallback in application code. A real default means a bare `docker build` with
# no --build-arg still produces a working image.
ARG NEXT_PUBLIC_API_URL=https://api.dutycaptain.com
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# The site's own public address: canonical URLs, sitemap and link previews.
ARG NEXT_PUBLIC_SITE_URL=https://dutycaptain.com
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
# "true" keeps this build out of search results (staging).
ARG NEXT_PUBLIC_NOINDEX=false
ENV NEXT_PUBLIC_NOINDEX=${NEXT_PUBLIC_NOINDEX}
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runner: minimal production image ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG PORT=9821
ENV PORT=${PORT}
# Next's standalone server binds 127.0.0.1 unless told otherwise, which inside a
# container means nothing outside it can reach the port — the healthcheck fails
# and Dokploy reports a container that never becomes ready.
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone output plus the assets it does not bundle (static/, public/).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f "http://localhost:${PORT}/api/health" || exit 1

# `node server.js`, NOT `next start`. With output:'standalone' the two are not
# interchangeable: `next start` serves stale prerenders, so a deploy appears to
# succeed while the pages served come from an earlier build.
CMD ["node", "server.js"]
