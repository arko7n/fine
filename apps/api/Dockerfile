FROM public.ecr.aws/docker/library/node:22-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json yarn.lock ./
RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/" && \
    yarn install

COPY . .

RUN yarn build

EXPOSE 3001

CMD ["node", "dist/index.js"]
