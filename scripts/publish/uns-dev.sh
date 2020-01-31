#!/usr/bin/env bash

PUBLISH_OPTS=$1

# Check new commits since 24h
if [ $(git log --since="1 day" | wc -l) -eq 0 ]; then
    echo "Nothing to publish since 1 day.";
    exit 0;
fi

cd packages/crypto

actual_uns_version=$(grep '"uns_version":' package.json | cut -d\" -f4)
if [[ $actual_uns_version =~ "-" ]]; then
    echo "Version format is not X.Y.Z ($actual_uns_version)"
    exit 1
fi

echo "Bump package version."
DATE=$(date -u +%Y%m%d%H%M%S)
new_version="${actual_uns_version}-dev.$DATE"

sed -i.bak "s/\"uns_version\": \"\(.*\)\"/\"uns_version\": \"$new_version\"/g" "./package.json"
npm publish --tag=dev $PUBLISH_OPTS

cd ../core-nft-crypto
npm publish --tag=dev $PUBLISH_OPTS

cd ../uns-crypto
npm publish --tag=dev $PUBLISH_OPTS

cd ..

# remove all `.bak` files
git clean -f
