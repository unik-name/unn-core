#!/bin/bash

set -e

ORG="universalnamesystem"
REPO="core"

if [ "${1}" == "integration" ]; then
    REPO="d"$REPO
    TAG="latest"
    echo 1
else
    TAG="${1}"
    echo 2
fi

IMAGE=$ORG"/"$REPO

COMMIT=$(git rev-parse --short HEAD)

arch=$2

#docker tag "$IMAGE":"$COMMIT"-"$arch" "$IMAGE":"$TAG"

# docker push "$IMAGE":"$TAG"-"$arch"
docker push "$IMAGE":"$COMMIT"-"$arch"

# echo "🎉 Successfully published UNN image : $IMAGE:$TAG"
echo "🎉 Successfully published UNN image : $IMAGE:$COMMIT-$arch"
