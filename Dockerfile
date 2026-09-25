FROM node:22-bookworm-slim

# Install QLever (native binaries + qlever CLI) from the official apt repository
# See https://docs.qlever.dev/quickstart/
ARG QLEVER_VERSION=0.6.0
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl git gpg wget \
  && wget -qO - https://packages.qlever.dev/pub.asc | gpg --dearmor > /usr/share/keyrings/qlever.gpg \
  && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/qlever.gpg] https://packages.qlever.dev/ $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") main" > /etc/apt/sources.list.d/qlever.list \
  && apt-get update && apt-get install -y --no-install-recommends qlever=${QLEVER_VERSION} \
  && rm -rf /var/lib/apt/lists/*

# Install redocly cli (for building the openapi spec) and PM2 runtime
RUN npm install @redocly/cli pm2 -g

ADD ./qlever/Qleverfile /qlever/Qleverfile
ADD ./qlever/entrypoint.sh /qlever/entrypoint.sh
ADD ./qlever/setup-qlever-index.sh /qlever/setup-qlever-index.sh

# use --env on the docker run command line to override
ENV QLEVER_MEMORY=12G
ENV QLEVER_CACHE=4G
ENV QLEVER_TIMEOUT=360s
ENV QLEVER_READONLY=false
ENV QLEVER_PERSIST_UPDATES=false
ENV QLEVER_PORT=8081
ENV QLEVER_RUNTIME_PARAMETERS="enable-distributive-union=false"
ENV QLEVER_DIR=/data/qlever
ENV NODE_ENV=production
ENV PORT=8080

# Build-time argument to set the default CDN to use for grabbing graphs when building the qlever index
ARG CDN_URL=https://cdn.humanatlas.io/digital-objects/

# Setup qlever index with default graphs pre-loaded
RUN /qlever/setup-qlever-index.sh $QLEVER_DIR

# Setup hra-api
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN nohup bash -c "QLEVER_READONLY=true /qlever/entrypoint.sh &" \
  && timeout 120 bash -c 'until curl -sf "http://localhost:${QLEVER_PORT}/?query=ASK%7B%7D" > /dev/null; do sleep 1; done' \
  && mkdir -p file-cache \
  && SPARQL_ENDPOINT="http://localhost:${QLEVER_PORT}/" SPARQL_BACKEND=qlever npm run build \
  && npm prune --production

EXPOSE $PORT $QLEVER_PORT
CMD [ "pm2-runtime", "start", "ecosystem.config.cjs" ]
