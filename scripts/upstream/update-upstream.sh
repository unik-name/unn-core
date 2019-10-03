#!/bin/bash

set -e

WORKDIR=~
SOURCES_PATH=$WORKDIR/uns-core

cd $SOURCES_PATH

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

cd $WORKDIR

DOCKER_COMPOSE_FILE_PATH=$SOURCES_PATH/docker/integration

docker-compose -f $DOCKER_COMPOSE_FILE_PATH down 

docker-compose -f $DOCKER_COMPOSE_FILE_PATH up --build

exit 0
