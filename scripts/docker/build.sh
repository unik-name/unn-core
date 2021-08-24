#!/bin/bash

set -e

echo "Build docker images for "$IMAGE":"$COMMIT"-"$arch
#The first . is intentional (to export variable)
. ./scripts/docker/init.sh

DOCKER_BUILDKIT=1 docker build \
        -t "$IMAGE":"$COMMIT"-"$arch" \
        --build-arg ARCH="$arch"/ \
        --build-arg VCS_REF="$COMMIT" \
        --build-arg BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"` \
        --build-arg VERSION="$TARGET" \
        -f ./docker/Dockerfile .

echo "🎉 Successfully built UNN image : $IMAGE:$COMMIT-$arch"

# DOCKER_SIZE=$(docker image inspect uns:latest --format='{{.Size}}')
# echo "docker image size: $(($DOCKER_SIZE/1024/1024))Mo"
