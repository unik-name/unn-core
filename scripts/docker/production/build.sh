#!/bin/sh

set -e

IMAGE="universalnamesystem/core"
COMMIT=$(git rev-parse --short HEAD)

docker build -t "$IMAGE":"$COMMIT" -f ./docker/Dockerfile .

echo "🎉 Successfully built UNS image : $IMAGE:$COMMIT"

# DOCKER_SIZE=$(docker image inspect uns:latest --format='{{.Size}}')
# echo "docker image size: $(($DOCKER_SIZE/1024/1024))Mo"