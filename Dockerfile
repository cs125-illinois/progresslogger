FROM node:10-alpine

RUN apk --no-cache add g++ gcc libgcc libstdc++ linux-headers make python
RUN npm i --quiet node-gyp -g

COPY package.json ./
RUN npm i --quiet && \
    npm audit fix && \
    mkdir logs && \
    touch logs/progresslogger.log

COPY config.yaml server.js ./

ENTRYPOINT ["node", "./server.js"]
