FROM openjdk:8-bullseye

# Install Node 20
RUN apt-get update && apt-get install curl gpg -y && mkdir -p /etc/apt/keyrings; \
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; \
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list; \
  apt-get update && apt-get install -y nodejs

# Install redocly cli (for building the openapi spec) and PM2 runtime
RUN npm install @redocly/cli pm2 -g

# Blazegraph docker setup adapted from https://github.com/phenoscape/blazegraph-docker/tree/master
RUN mkdir /blazegraph \
  && cd /blazegraph \
  && curl -L -O 'https://github.com/blazegraph/database/releases/download/BLAZEGRAPH_RELEASE_2_1_5/blazegraph.jar' \
  && curl -L -O 'https://repo1.maven.org/maven2/org/eclipse/jetty/jetty-servlets/9.2.3.v20140905/jetty-servlets-9.2.3.v20140905.jar'

ADD ./blazegraph/readonly_cors.xml /blazegraph/readonly_cors.tmp.xml
ADD ./blazegraph/entrypoint.sh /blazegraph/entrypoint.sh
ADD ./blazegraph/setup-blazegraph-db.sh /blazegraph/setup-blazegraph-db.sh

# use --env on the docker run command line to override
ENV BLAZEGRAPH_MEMORY 12G
ENV BLAZEGRAPH_TIMEOUT 360000
ENV BLAZEGRAPH_READONLY false
ENV BLAZEGRAPH_PORT 8081
ENV NODE_ENV production
ENV PORT 8080

###### Add blazegraph-runner #####
# Code snippet from https://github.com/INCATools/ubergraph/blob/master/Dockerfile#L18C1-L23C53
ENV BR=1.7
ENV PATH "/tools/blazegraph-runner/bin:$PATH"
RUN wget -nv https://github.com/balhoff/blazegraph-runner/releases/download/v$BR/blazegraph-runner-$BR.tgz \
&& tar -zxvf blazegraph-runner-$BR.tgz \
&& mkdir -p /tools && mv blazegraph-runner-$BR /tools/blazegraph-runner

# Setup blazegraph db with default graphs pre-loaded
WORKDIR /data
RUN /blazegraph/setup-blazegraph-db.sh /data/blazegraph.jnl
ADD ./blazegraph/blazegraph.properties .

# Setup hra-api
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN mkdir -p file-cache && npm run build && npm prune --production

EXPOSE $PORT $BLAZEGRAPH_PORT
CMD [ "pm2-runtime", "start", "ecosystem.config.cjs" ]
