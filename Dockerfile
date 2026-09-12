# ── Stage 1: Build the React frontend ──────────────────────────────
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend

# Build-time Vite env vars (baked into the static bundle)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_DEV_BYPASS_AUTH=false
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_DEV_BYPASS_AUTH=$VITE_DEV_BYPASS_AUTH

COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Backend runtime ────────────────────────────────────────
FROM node:20-slim AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/server.js ./server.js
COPY --from=frontend-build /app/frontend/dist ../frontend/dist

# Cloud Run injects PORT; server.js reads process.env.PORT
EXPOSE 8080
CMD ["node", "server.js"]
