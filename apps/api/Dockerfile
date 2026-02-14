FROM node:22-slim

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production=false

COPY tsconfig.json ./
COPY openclaw.json ./
COPY src/ ./src/

RUN yarn build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
