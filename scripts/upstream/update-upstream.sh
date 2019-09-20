#!/bin/bash

set -e

cd /root/uns-core

echo -e "\n["$(date +%F_%H-%M-%S)"]"

echo -e "\nFetching sources"
git fetch
DIFF=$(git diff private/develop origin/private/develop --shortstat)

if [ -z $DIFF ]
then
    echo "--> no updates."
    exit 0
else 
    git pull -s recursive -X theirs origin private/develop
    echo "--> source updated"
fi

cd docker/integration

docker-compose down 

docker-compose up --build

exit 0
