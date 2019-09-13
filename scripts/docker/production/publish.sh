#!/bin/sh

set -e

IMAGE="universalnamesystem/core"
RELEASE="${1}"
COMMIT=$(git rev-parse --short HEAD)

docker tag "$IMAGE":"$COMMIT" "$IMAGE":"$RELEASE"
docker tag "$IMAGE":"$COMMIT" "$IMAGE":latest

docker push "$IMAGE":"$RELEASE"
docker push "$IMAGE":latest

echo "🎉 Successfully published UNS image : $IMAGE:$RELEASE"
