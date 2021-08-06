#!/bin/bash

set -e

TAG=$(git tag --points-at HEAD)
if [[ "$CIRCLE_BRANCH" != "develop" && "$TAG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]];
then
    TARGET=$TAG
else
    TARGET=integration
fi

echo $TARGET

ORG="qsvtr"
REPO="core"

if [ "$TARGET" == "integration" ]; then
    REPO="d"$REPO
fi

IMAGE=$ORG"/"$REPO

arch=$(uname -m)

COMMIT=$(git rev-parse --short HEAD)