#!/usr/bin/env bash

PUBLISH_OPTS=$1

set -e

if [[ -n "$CI" ]];then
    echo "Authenticate with registry."
    if [[ -z "$NPM_TOKEN" ]];then
        echo "Error: NPM_TOKEN is not set."
        exit 1
    fi

    set +x
    echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
    set -x
fi


pushd plugins/uns/ark-crypto
actual_uns_version=$(grep '"version":' package.json | cut -d\" -f4)
if [[ $actual_uns_version =~ "-" ]]; then
    echo "Version format is not X.Y.Z ($actual_uns_version)"
    exit 1
fi

echo "Bump package version..."
DATE=$(date -u +%Y%m%d%H%M%S)
new_version="${actual_uns_version}-dev.$DATE"
echo "New version: ${new_version}"

sed -i.bak "s/\"uns_version\": \"\(.*\)\"/\"uns_version\": \"$new_version\"/g" "./package.json"

echo
echo "Build and publish @uns/ark-crypto"
echo
npm publish --tag=dev $PUBLISH_OPTS
popd

echo
echo "Build and publish @uns/core-nft-crypto"
echo
pushd plugins/nft/nft-crypto
# It is mandatory to rebuild the module afterward to satisfy next modules dependency
npm publish --tag=dev $PUBLISH_OPTS && yarn build
popd

echo
echo "Build and publish @uns/uns-crypto"
echo
pushd plugins/uns/uns-crypto
npm publish --tag=dev $PUBLISH_OPTS
popd

rm -f packages/core-nft-crypto/package.json.bak \
    packages/crypto/package.json.bak \
    packages/uns-crypto/package.json.bak
