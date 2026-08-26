FROM node:20-slim AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

# Build arguments from Coolify. These must be declared explicitly here so they
# reach the build step. A build argument that the Dockerfile does not declare
# is silently dropped by Docker. lib/site.ts deliberately fails the build if
# NEXT_PUBLIC_SITE_URL is missing in production, rather than shipping localhost
# URLs in the sitemap and OG tags.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Promote build args to environment variables so npm run build sees them.
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
