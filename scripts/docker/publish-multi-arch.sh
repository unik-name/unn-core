#!/bin/bash

set -e

echo $IMAGE" "$COMMIT
. ./scripts/docker/init.sh

echo "Docker publish multi arch for $COMMIT or $TARGET"
echo "IMAGE: $IMAGE"

DOCKER_BUILDKIT=1
docker manifest create "$IMAGE":"$COMMIT" --amend "$IMAGE":"$COMMIT"-x86_64 --amend "$IMAGE":"$COMMIT"-aarch64
docker manifest push "$IMAGE":"$COMMIT"

docker manifest create "$IMAGE":latest --amend "$IMAGE":"$COMMIT"-x86_64 --amend "$IMAGE":"$COMMIT"-aarch64
docker manifest push "$IMAGE":latest
