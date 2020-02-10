#!/bin/bash

set -e

wait_for_sync () {
  timeout_sec=300
  i=0
  until /home/ubuntu/uns-core/scripts/check-sync/check-sync >/dev/null; do
    ((i=i+10))
    if [ $i -gt $timeout_sec ]; then
      echo "sync timeout reached"
      break
    fi
    sleep 10
  done
}

WORKDIR=~
SOURCES_PATH=$WORKDIR/uns-core

BRANCH="develop"

cd $SOURCES_PATH

echo -e "\n["$(date --iso-8601=seconds)"]"

echo -e "\nFetching sources"
git fetch --prune
DIFF=$(git diff $BRANCH origin/$BRANCH --shortstat)

if [ -z "$DIFF" ]
then
    echo "--> no updates."
    exit 0
else
    git pull -s recursive -X theirs origin $BRANCH
    echo "--> source updated"
fi

cd $WORKDIR

DOCKER_COMPOSE_FILE_PATH=$SOURCES_PATH/docker/integration/docker-compose.yml
#upgrade forger 1
echo upgrade forger 1
docker-compose -f $DOCKER_COMPOSE_FILE_PATH up --build -d forger1

#upgrade forger 2
echo upgrade forger 2
wait_for_sync
docker-compose -f $DOCKER_COMPOSE_FILE_PATH up --build -d forger2

#upgrade forger 3
echo upgrade forger 3
wait_for_sync
docker-compose -f $DOCKER_COMPOSE_FILE_PATH up --build -d forger3

docker image prune -f --filter "until=168h" # 7 days

exit 0
