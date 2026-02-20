FROM public.ecr.aws/docker/library/node:22-slim

RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY apps/api/package.json apps/api/yarn.lock ./
RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/" && \
    yarn install

COPY apps/api/ .

RUN yarn build

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/index.js"]
