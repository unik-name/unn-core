FROM node:12-alpine AS BUILDER
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh python make gcc g++
RUN mkdir -p /opt/build
WORKDIR /opt/build
COPY *.json ./
COPY *.lock ./
COPY packages ./packages
COPY plugins ./plugins
RUN yarn setup

FROM node:12-alpine AS RUNNER

# Add Tini and jq (used by `uns-init.sh` script) from Alpine packages
RUN apk add --no-cache tini jq 
ENTRYPOINT ["/sbin/tini", "--"]

# Prepare sources (copy build, remove sources, node permissions,...) as root user
RUN mkdir -p /opt/uns
COPY --from=BUILDER /opt/build /opt/uns
ADD docker/uns-init.sh /opt/uns
RUN rm -rf /opt/uns/packages/*/src 
RUN chown -R node:node /opt/uns/uns-init.sh /opt/uns/packages/core/bin/
RUN ln -s /opt/uns/packages/core/bin/run /usr/bin/uns

# replace sandbox config symlink by its source file
RUN unlink /opt/uns/packages/core/bin/config/livenet/sandbox-plugins.js
RUN cp /opt/uns/packages/core/bin/config/sandbox/plugins.js /opt/uns/packages/core/bin/config/livenet/sandbox-plugins.js

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.label-schema.schema-version="1.0" \
    org.label-schema.name="UNS Core" \
    org.label-schema.vendor="Unikname" \
    org.label-schema.url="https://uns.network" \
    org.label-schema.vcs-ref=$VCS_REF \
    org.label-schema.build-date=$BUILD_DATE\
    org.label-schema.version=$VERSION

USER node
CMD [ "/opt/uns/uns-init.sh" ]