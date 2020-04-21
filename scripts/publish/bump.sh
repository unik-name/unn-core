#!/usr/bin/env bash

version=$1
commit=$2

if [ -z "$version" ]
then
    echo "empty uns version"
    exit 1
fi

# set version and publish on npm
pushd plugins/uns/ark-crypto
yarn version --no-git-tag-version --new-version $version
npm publish --dry-run
popd

pushd plugins/nft/nft-crypto
yarn version --no-git-tag-version --new-version $version
npm publish --dry-run
popd

pushd plugins/uns/uns-crypto
yarn version --no-git-tag-version --new-version $version
npm publish --dry-run
yarn build
popd

# set version
pushd packages/core
yarn version --no-git-tag-version --new-version $version
popd

pushd plugins/nft/nft-transactions
yarn version --no-git-tag-version --new-version $version
popd

pushd plugins/uns/uns-transactions
yarn version --no-git-tag-version --new-version $version
popd

sed -i.bak "s/\"@uns\/core-nft-crypto\": \"\(.*\)\"/\"@uns\/core-nft-crypto\": \"^$version\"/g" "./plugins/nft/nft-transactions/package.json" "./packages/core-tester-cli/package.json" "./plugins/uns/uns-transactions/package.json" "plugins/uns/uns-crypto/package.json"
sed -i.bak "s/\"@uns\/core-nft\": \"\(.*\)\"/\"@uns\/core-nft\": \"^$version\"/g" "./plugins/uns/uns-transactions/package.json" "packages/core/package.json"
sed -i.bak "s/\"@uns\/crypto\": \"\(.*\)\"/\"@uns\/crypto\": \"^$version\"/g" "./plugins/uns/uns-transactions/package.json" "./plugins/nft/nft-transactions/package.json"
sed -i.bak "s/\"@uns\/uns-transactions\": \"\(.*\)\"/\"@uns\/uns-transactions\": \"^$version\"/g" "packages/core/package.json"

# remove all `.bak` files
find . -name "*.bak" -exec rm {} +

if [[ $commit == '--commit' ]];then
    git add packages/ plugins/
    git commit -m "release: $version"
    git tag $version
fi

