#!/bin/bash

set -ex

. ./scripts/docker/init.sh

echo "Publish multi arch docker image $IMAGE:$TARGET"

DOCKER_BUILDKIT=1
docker manifest create "$IMAGE":"$TARGET" --amend "$IMAGE":"$COMMIT"-x86_64 --amend "$IMAGE":"$COMMIT"-aarch64
docker manifest push "$IMAGE":"$TARGET"

echo "🎉 Successfully published UNN image : $IMAGE:$TARGET"
