#!/usr/bin/env bash

set -e
ROOT_DIR="$1/../../../"

#backup package.json
cp "$1/package.json" "$1/package.json.back"

package_name=$(awk -F '"' '/name/{print $4}' "$1/package.json" | cut -d'/' -f2)
case $package_name in
    crypto|core-nft-crypto)
        echo "In module '$package_name', remapping '@arkecosystem/crypto' to '@uns/ark-crypto'"
        #replace @arkecosystem/crypto by @uns/ark-crypto in all .d.ts and .js of dist/
        find dist \( -name "*.js" -o -name "*.d.ts" \) -exec sed -i'' "s/@arkecosystem\/crypto/@uns\/ark-crypto/g" {} +
        #get @uns/ark-crypto version
        uns_version=$(awk -F '"' '/version/{print $4}' "$ROOT_DIR/plugins/uns/ark-crypto/package.json")
        if [ -n "$uns_version" ]
        then
            echo "Set @uns/ark-crypto dependency to version $uns_version"
            sed -i'' "s/\"@arkecosystem\/crypto\": \".*\"/\"@uns\/ark-crypto\": \"\^$uns_version\"/g" "$1/package.json"

            echo "update @uns/core-nft-crypto dependency version"
            sed -i'' "s/\"@uns\/core-nft-crypto\": \".*\"/\"@uns\/core-nft-crypto\": \"\^$uns_version\"/g" "$1/package.json"

            echo "set $package_name version to $uns_version"
            yarn version --no-git-tag-version --new-version $uns_version

        else
            echo "Unable to retrieve @uns/ark-crypto version"
            exit 1
        fi;;
    *)
        echo "Unknown UNS package $package_name"
        exit 1;;
esac

