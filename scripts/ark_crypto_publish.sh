#!/usr/bin/env bash

#backup package.json
cp "$1/package.json" "$1/package.json.back"

uns_name="ark-crypto"
ark_crypto_version=$(sed -n 's/\"uns_version\": \"\(.*\)\"\,\?/\1/p' "$1/package.json" | tr -d '[:space:]')
echo "Publishing @uns/$uns_name $ark_crypto_version"
#replace name in package.json
sed -i "s/\"name\": \"\(.*\)\"/\"name\": \"@uns\/$uns_name\"/g" "$1/package.json"
#replace version
sed -i "s/\"version\": \"\(.*\)\"/\"version\": \"$ark_crypto_version\"/g" "$1/package.json"
