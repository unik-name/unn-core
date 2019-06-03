#!/bin/bash

set -e

CORE_PATH=~/unikname-core
CORE_DEPLOYER_PATH=~/unikname-deployer

echo -e "\n["$(date +%F_%H-%M-%S)"]"

echo -e "\nFetching sources"
cd $CORE_PATH
git fetch
DIFF=$(git diff origin/private/develop --summary)

if [ -z $DIFF ]
then
    echo "--> no updates."
    exit 0
else 
    git pull origin private/develop
    echo "--> source updated"
fi

cp ./scripts/upstream/check-uns-update /etc/cron.d/

echo -e "\nStopping node"
cd $CORE_DEPLOYER_PATH
./bridgechain.sh stop-core --config unikname.config.json --network devnet
echo "--> Node stopped"

echo -e "\nBuilding sources"
cd $CORE_PATH
rm -rf ./node_modules
yarn && yarn setup:clean
echo "--> sources built"

echo -e "\nStarting node"
cd $CORE_DEPLOYER_PATH
./bridgechain.sh start-core --config unikname.config.json --network devnet

exit 0
