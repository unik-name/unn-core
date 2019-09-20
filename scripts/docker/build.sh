#!/bin/sh

set -e

ORG="universalnamesystem"
REPO="core"

if [ "${1}" == "integration" ]; then
    REPO="d"$REPO
fi

IMAGE=$ORG"/"$REPO

COMMIT=$(git rev-parse --short HEAD)

docker build -t "$IMAGE":"$COMMIT" -f ./docker/Dockerfile .

echo "🎉 Successfully built UNS image : $IMAGE:$COMMIT"

# DOCKER_SIZE=$(docker image inspect uns:latest --format='{{.Size}}')
# echo "docker image size: $(($DOCKER_SIZE/1024/1024))Mo"