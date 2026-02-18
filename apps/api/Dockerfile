FROM public.ecr.aws/docker/library/node:22-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json yarn.lock ./
RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/" && \
    yarn install --frozen-lockfile --production=false

COPY tsconfig.json openclaw.json ./
COPY src/ ./src/
COPY openclaw-plugins/ ./openclaw-plugins/

RUN yarn build && yarn cache clean

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
