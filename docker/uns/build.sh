#!/bin/sh

##run PGSQL
#docker run \
#    --name uns-postgresql \
#    -v /tmp/uns-devnet-pgdata:/var/lib/postgresql/data \
#    -e POSTGRES_USER=uns \
#    -e POSTGRES_PASSWORD=password \
#    -e POSTGRES_DB=uns_devnet \
#    -d postgres:12-alpine


docker build -t uns ../.. -f ./Dockerfile && docker tag uns:latest uns:`date +"%Y%d%m%-H%M%S"`
DOCKER_SIZE=$(docker image inspect uns:latest --format='{{.Size}}')
echo "docker image size: $(($DOCKER_SIZE/1024/1024))Mo"

docker run -itd \
    --name uns \
    -e UNS_NET=devnet \
    -e DB_HOST=172.17.0.2 \
    -e DB_PORT=5432 \
    -e DB_USER=uns \
    -e DB_PASSWORD=password \
    -e DB_DATABASE=uns_devnet \
    -e FORGER_SECRET="door argue snake afraid demise detect brass oyster little resource slice fiber" \
    -v /tmp/uns/log:/var/log/uns \
    -v /tmp/uns/cfg:/etc/uns \
    --rm \
    uns

#default file locations: https://github.com/ItsANameToo/ark-core-cheatsheet/blob/master/README.md#core-file-locations
#default ports: https://docs.ark.io/guidebook/core/configuration.html#environment-configuration