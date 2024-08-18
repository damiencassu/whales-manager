FROM node:current-alpine
ENV APP_HOME="/home/node/app"
WORKDIR ${APP_HOME}
RUN apk add git
RUN git clone https://github.com/damiencassu/whales-manager.git ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install
EXPOSE 8888
VOLUME /home/node/app/logs
VOLUME /home/node/app/conf
VOLUME /home/node/app/certs
CMD npm start
