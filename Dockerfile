FROM node:19.6
WORKDIR /home/node/app
RUN git clone https://github.com/damiencassu/whales-manager.git ./
RUN npm install
EXPOSE 8888
VOLUME /home/node/app/logs
VOLUME /home/node/app/conf
CMD npm start
