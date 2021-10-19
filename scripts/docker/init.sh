#!/bin/bash

set -e

TAG=$(git tag --points-at HEAD)
if [[ "$CIRCLE_BRANCH" == "develop" ]];
then
    TARGET=integration
elif [[ "$TAG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]];
then
    TARGET=$TAG
fi

echo "Build & publish target: $TARGET"

ORG="universalnamesystem"
REPO="core"

if [ "$TARGET" == "integration" ]; then
    REPO="d"$REPO
fi

IMAGE="$ORG/$REPO"

arch=$(uname -m)

COMMIT=$(git rev-parse --short HEAD)
