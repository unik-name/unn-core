#!/bin/bash

set -e

ORG="universalnamesystem"
REPO="core"

if [ "${1}" == "integration" ]; then
    REPO="d"$REPO
    TAG="latest"

# for tags such as core-4.2.6
elif [[ ${1} == core* ]]; then
    TAG=`echo "${1}" | cut -d- -f2` # keep only last part, the version we want to build

elif [ -z "${1}"]; then
    echo "Input tag is required."
    exit 1;
else
    echo "Unrecognized input tag, so publish this tag as-is: ${1}"
    TAG="${1}"
fi

echo "Tag to publish: ${TAG}"

IMAGE=$ORG"/"$REPO

COMMIT=$(git rev-parse --short HEAD)

docker tag "$IMAGE":"$COMMIT" "$IMAGE":"$TAG"

docker push "$IMAGE":"$TAG"
docker push "$IMAGE":"$COMMIT"

echo "🎉 Successfully published UNS image : $IMAGE:$TAG"
