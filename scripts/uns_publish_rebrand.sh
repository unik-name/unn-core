#!/usr/bin/env bash

set -e
ROOT_DIR="$1/../../../"

#backup package.json
cp "$1/package.json" "$1/package.json.back"

package_name=$(basename $1)
case $package_name in
    uns-crypto|core-nft-crypto)
        echo "In module '$package_name', remapping '@arkecosystem/crypto' to '@uns/$uns_name'"
        #replace @arkecosystem/crypto by @uns/$uns_name in all .d.ts and .js of dist/
        find dist \( -name "*.js" -o -name "*.d.ts" \) -exec sed -i'' "s/@arkecosystem\/crypto/@uns\/$uns_name/g" {} +
        #get @uns/ark-crypto version
        uns_version=$(awk -F '"' '/version/{print $4}' "$ROOT_DIR/plugins/uns/ark-crypto/package.json")
        if [ -n "$uns_version" ]
        then
            echo "Set @uns/$uns_name dependency to version $uns_version"
            sed -i.bak "s/\"@arkecosystem\/crypto\": \".*\"/\"@uns\/$uns_name\": \"\^$uns_version\"/g" "$1/package.json"
            sed -i.bak "s/\"@uns\/core-nft-crypto\": \".*\"/\"@uns\/core-nft-crypto\": \"\^$uns_version\"/g" "$1/package.json"
            #replace version
            sed -i.bak "s/\"version\": \"\(.*\)\"/\"version\": \"$uns_version\"/g" "$1/package.json"
        else
            echo "Unable to retrieve @uns/$uns_name version"
            exit 1
        fi;;
    *)
        echo "Unknown UNS package $package_name"
        exit 1;;
esac

