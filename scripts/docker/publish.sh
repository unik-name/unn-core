#!/bin/bash

set -e

docker push "$IMAGE":"$COMMIT"-"$arch"

echo "🎉 Successfully published UNN image : $IMAGE:$COMMIT-$arch"
