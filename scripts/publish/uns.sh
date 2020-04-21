#!/usr/bin/env bash

pushd plugins/uns/ark-crypto
npm publish --dry-run
popd

pushd plugins/nft/nft-crypto
npm publish --dry-run
popd

pushd plugins/uns/uns-crypto
npm publish --dry-run
yarn build
popd


