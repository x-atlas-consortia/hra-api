FROM node:20
RUN npm install pm2 -g
ENV NODE_ENV production
ENV PORT 8080
USER node
WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
RUN npm ci --include=dev
COPY --chown=node:node . .
RUN mkdir file-cache && npm run build && npm prune --production

EXPOSE 8080
CMD [ "pm2-runtime", "./dist/server.js" ]
