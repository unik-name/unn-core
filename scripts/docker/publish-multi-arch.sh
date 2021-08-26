#!/bin/bash

set -ex

. ./scripts/docker/init.sh

echo "Docker publish multi arch for $COMMIT or $TARGET"
echo "IMAGE: $IMAGE"

DOCKER_BUILDKIT=1
docker manifest create "$IMAGE":"$TARGET" --amend "$IMAGE":"$COMMIT"-x86_64 --amend "$IMAGE":"$COMMIT"-aarch64
docker tag "$IMAGE":"$TARGET" "$IMAGE":latest
docker manifest push "$IMAGE":"$TARGET"
docker manifest push "$IMAGE":latest

# docker push "$IMAGE":"$COMMIT"

echo "🎉 Successfully published UNN image : $IMAGE:$TARGET"
