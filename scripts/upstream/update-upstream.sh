#!/bin/bash

set -e

SOURCES_PATH=~/uns-core

wait_for_sync () {
  timeout_sec=300
  i=0
  until $SOURCES_PATH/scripts/check-sync/check-sync >/dev/null; do
    ((i=i+10))
    if [ $i -gt $timeout_sec ]; then
      echo "sync timeout reached"
      break
    fi
    sleep 10
  done
}

echo -e "\n["$(date --iso-8601=seconds)"]"
echo -e "\nFetching sources"
BRANCH=develop
pushd $SOURCES_PATH
git pull -s recursive -X theirs origin $BRANCH
popd

echo -e "\nFetching Docker image"
DOCKER_COMPOSE_FILE_PATH=$SOURCES_PATH/docker/integration/docker-compose.yml

docker-compose -f $DOCKER_COMPOSE_FILE_PATH down forger1
PULL=$(docker-compose -f $DOCKER_COMPOSE_FILE_PATH pull forger1)

if [[ $PULL != *"up to date"* ]]; then
    #upgrade forger 1
    echo upgrade forger 1
    docker-compose -f $DOCKER_COMPOSE_FILE_PATH up --build -d forger1

    #upgrade forger 2
    #echo upgrade forger 2
    #wait_for_sync
    #docker-compose -f $DOCKER_COMPOSE_FILE_PATH up --no-deps -d forger2

    #upgrade forger 3
    #echo upgrade forger 3
    #wait_for_sync
    #docker-compose -f $DOCKER_COMPOSE_FILE_PATH up --no-deps -d forger3

    docker image prune -f --filter "until=168h" # 7 days
fi

exit 0
