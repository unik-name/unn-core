#!/bin/bash

set -e

cd /home/unikname/core

echo -e "\n["$(date +%F_%H-%M-%S)"]"

echo -e "\nFetching sources"
git fetch
DIFF=$(git diff origin/private/develop --summary)

if [ -z $DIFF ]
then
    echo "--> no updates."
    exit 0
else 
    git pull -s recursive -X theirs origin private/develop
    echo "--> source updated"
fi

cp ./scripts/upstream/check-uns-update /etc/cron.d/

echo -e "\nStopping node"
uns relay:stop 
uns forger:stop
echo "--> Node stopped"

echo -e "\nBuilding sources"
rm -rf ./node_modules
yarn && yarn setup:clean
echo "--> sources built"

echo -e "\nStarting node"
uns relay:start --network=devnet --ignoreMinimumNetworkReach
uns forger:start --network=devnet

exit 0
