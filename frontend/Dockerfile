FROM node:20-alpine AS development-stage
WORKDIR /app

COPY package*.json ./
RUN npm install && npm cache clean --force

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:stable-alpine AS production-stage
WORKDIR /usr/share/nginx/html

COPY --from=development-stage /app/dist ./

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]