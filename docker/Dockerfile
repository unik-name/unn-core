FROM node:10-alpine AS BUILDER
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh python make gcc g++
RUN mkdir -p /opt/build
WORKDIR /opt/build
COPY *.json ./
COPY *.lock ./
COPY packages ./packages
COPY plugins ./plugins
RUN yarn setup

FROM node:10-alpine AS RUNNER
RUN mkdir -p /opt/uns
COPY --from=BUILDER /opt/build /opt/uns
RUN rm -rf /opt/uns/packages/*/src 
ADD docker/uns-init.sh /opt/uns
RUN ln -s /opt/uns/packages/core/bin/run /usr/bin/uns
USER node
CMD [ "/opt/uns/uns-init.sh" ]