FROM node:9.4.0

RUN mkdir -p /opt/app

# set our node environment, either development or production
# defaults to production, compose overrides this to development on build and run
ARG NODE_ENV=development
ENV NODE_ENV $NODE_ENV

# port on which the node instance running
ARG PORT=3000
ENV PORT $PORT
EXPOSE $PORT

# check every 30s to ensure this service returns HTTP 200
# HEALTHCHECK CMD curl -fs http://localhost:$PORT/healthz || exit 1

RUN apt-get update && apt-get install -y g++ make python

# install dependencies first, in a different location for easier app bind mounting for local development
WORKDIR /opt
COPY package.json package-lock.json* ./
RUN npm install && npm cache clean --force
RUN npm install -g nodemon
RUN npm install -g node-gyp
ENV PATH /opt/node_modules/.bin:$PATH

# copy in our source code last, as it changes the most
WORKDIR /opt/app
COPY . /opt/app

# nodemon needs to be run with option -L in docker env
CMD ["nodemon", "-L", "."]
