#!/bin/sh

set -e

ORG="universalnamesystem"
REPO="core"

if [ "${1}" == "integration" ]; then
    REPO="d"$REPO
    TAG="latest"
else
    TAG="${1}"
fi

IMAGE=$ORG"/"$REPO

COMMIT=$(git rev-parse --short HEAD)

docker tag "$IMAGE":"$COMMIT" "$IMAGE":"$TAG"

docker push "$IMAGE":"$TAG"

echo "🎉 Successfully published UNS image : $IMAGE:$TAG"
