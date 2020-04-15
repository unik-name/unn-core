#!/usr/bin/env bash

version=$1

if [ -z "$version" ]
then
    echo "empty uns version"
    exit 1
fi

pushd plugins/uns/ark-crypto
yarn version --no-git-tag-version --new-version $version
popd

pushd plugins/nft/nft-crypto
yarn version --no-git-tag-version --new-version $version
popd

pushd plugins/nft/nft-transactions
yarn version --no-git-tag-version --new-version $version
popd

pushd plugins/uns/uns-crypto
yarn version --no-git-tag-version --new-version $version
popd

pushd plugins/uns/uns-transactions
yarn version --no-git-tag-version --new-version $version
popd

pushd packages/core
yarn version --no-git-tag-version --new-version $version
sed -i.bak "s/\"@uns\/core-nft\": \"\(.*\)\"/\"@uns\/core-nft\": \"^$version-dev\"/g" "package.json"
sed -i.bak "s/\"@uns\/uns-transactions\": \"\(.*\)\"/\"@uns\/uns-transactions\": \"^$version-dev\"/g" "package.json"
popd

sed -i.bak "s/\"@uns\/core-nft-crypto\": \"\(.*\)\"/\"@uns\/core-nft-crypto\": \"^$version-dev\"/g" "./plugins/nft/nft-transactions/package.json" "./packages/core-tester-cli/package.json" "./plugins/uns/uns-transactions/package.json" "plugins/uns/uns-badges/package.json"
sed -i.bak "s/\"@uns\/core-nft\": \"\(.*\)\"/\"@uns\/core-nft\": \"^$version-dev\"/g" "./plugins/uns/uns-transactions/package.json" "plugins/uns/uns-badges/package.json"
sed -i.bak "s/\"@uns\/crypto\": \"\(.*\)\"/\"@uns\/crypto\": \"^$version-dev\"/g" "./plugins/uns/uns-transactions/package.json" "./plugins/nft/nft-transactions/package.json" "plugins/uns/uns-badges/package.json"

# remove all `.bak` files
find . -name "*.bak" -exec rm {} +
