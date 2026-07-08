FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json vite.config.ts index.html ./
COPY public/ ./public/
RUN npm ci
COPY src/ ./src/
RUN npm run build

FROM nginx:alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
