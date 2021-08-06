#!/bin/bash

set -e

echo "Build docker images for $1"
#The first . is intentional (to export variable)
. ./scripts/docker/init.sh

DOCKER_BUILDKIT=1 docker build \
        -t "$IMAGE":"$COMMIT"-"$arch" \
        -t "$IMAGE":"$TARGET"-"$arch" \
        --build-arg ARCH="$arch"/ \
        --build-arg VCS_REF="$COMMIT" \
        --build-arg BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"` \
        --build-arg VERSION="$VERSION" \
        -f ./docker/Dockerfile .

echo "🎉 Successfully built UNN image : $IMAGE:$COMMIT-$arch"
# echo "🎉 Successfully built UNN image : $IMAGE:$TARGET-$arch"

# DOCKER_SIZE=$(docker image inspect uns:latest --format='{{.Size}}')
# echo "docker image size: $(($DOCKER_SIZE/1024/1024))Mo"
