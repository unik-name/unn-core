#!/bin/bash

set -e

NETWORK=${1}

if [ -e $NETWORK ]; then
    echo "Missing network parameter"
    exit 1
fi

docker run \
    --name uns-$NETWORK-postgres \
    -v /tmp/uns-$NETWORK-pgdata:/var/lib/postgresql/data \
    -e POSTGRES_PASSWORD=password \
    -e POSTGRES_DB=uns_$NETWORK \
    -e POSTGRES_USER=uns \
    -p 127.0.0.1:5432:5432 \
    -d postgres:11-alpine

echo "🎉 Successfully started DB container for $NETWORK (see id above)"

echo "> Stop container with command 'docker stop uns-"$NETWORK"-postgres'"
echo "> Remove container with command 'docker rm uns-"$NETWORK"-postgres'"