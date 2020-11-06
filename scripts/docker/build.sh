#!/bin/bash

set -e

ORG="universalnamesystem"
REPO="core"
VERSION="${1}"

if [ "$VERSION" == "integration" ]; then
    REPO="d"$REPO
fi

IMAGE=$ORG"/"$REPO

COMMIT=$(git rev-parse --short HEAD)

DOCKER_BUILDKIT=1 docker build -t "$IMAGE":"$COMMIT" \
        --build-arg VCS_REF="$COMMIT" \
        --build-arg BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"` \
        --build-arg VERSION="$VERSION" \
        -f ./docker/Dockerfile .

echo "🎉 Successfully built UNS image : $IMAGE:$COMMIT"

# DOCKER_SIZE=$(docker image inspect uns:latest --format='{{.Size}}')
# echo "docker image size: $(($DOCKER_SIZE/1024/1024))Mo"
