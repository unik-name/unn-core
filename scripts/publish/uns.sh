#!/usr/bin/env bash

version=$1
commit=$2

cd packages/crypto
sed -i.bak "s/\"uns_version\": \"\(.*\)\"/\"uns_version\": \"$version\"/g" "./package.json"
npm publish

pushd plugins/uns/ark-crypto
sed -i.bak "s/\"version\": \"\(.*\)\"/\"version\": \"$version\"/g" "./package.json"
npm publish --dry-run
popd

pushd plugins/nft/nft-crypto
yarn version --no-git-tag-version --new-version $version
npm publish

pushd plugins/uns/uns-crypto
yarn version --no-git-tag-version --new-version $version

cd ../..

sed -i.bak "s/\"@uns\/core-nft-crypto\": \"\(.*\)\"/\"@uns\/core-nft-crypto\": \"^$version\"/g" "./packages/core-nft/package.json"
sed -i.bak "s/\"@uns\/crypto\": \"\(.*\)\"/\"@uns\/crypto\": \"^$version\"/g" "./packages/uns-transactions/package.json"
sed -i.bak "s/\"@uns\/core-nft-crypto\": \"\(.*\)\"/\"@uns\/core-nft-crypto\": \"^$version\"/g" "./packages/core-tester-cli/package.json"

# remove all `.bak` files
git clean -f

if [[ $commit == '--commit' ]];then
    git add -u
    git commit -m "release: $version"
    git tag $version
fi

