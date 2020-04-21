#!/usr/bin/env bash

PUBLISH_OPTS=$1

pushd plugins/uns/ark-crypto
npm publish $PUBLISH_OPTS
popd

pushd plugins/nft/nft-crypto
npm publish $PUBLISH_OPTS
popd

pushd plugins/uns/uns-crypto
npm publish $PUBLISH_OPTS
yarn build
popd


