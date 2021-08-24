#!/bin/bash

set -e

#docker tag "$IMAGE":"$COMMIT"-"$arch" "$IMAGE":"$TAG"

# docker push "$IMAGE":"$TAG"-"$arch"
docker push "$IMAGE":"$COMMIT"-"$arch"

# echo "🎉 Successfully published UNN image : $IMAGE:$TAG"
echo "🎉 Successfully published UNN image : $IMAGE:$COMMIT-$arch"
