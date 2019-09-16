#!/bin/sh

set -e

IMAGE="universalnamesystem/core"
RELEASE="${1}"
COMMIT=$(git rev-parse --short HEAD)

docker tag "$IMAGE":"$COMMIT" "$IMAGE":"$RELEASE"

docker push "$IMAGE":"$RELEASE"

echo "🎉 Successfully published UNS image : $IMAGE:$RELEASE"
