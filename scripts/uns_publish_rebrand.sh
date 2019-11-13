#!/usr/bin/env bash
uns_base_package="$uns_base_package"
echo "Remaping @arkecosystem/crypto to @uns/$uns_base_package"

#backup package.json
cp "$1/package.json" "$1/package.json.back"

package_name=$(basename $1)
case $package_name in
    uns-crypto|core-nft-crypto)
        for file in $(grep -r '@arkecosystem/crypto' "$1/dist" | cut -d':' -f1)
        do
            if [[ ( $file == *.js ) || ( $file == *.d.ts ) ]]
            then
                sed -i 's/@arkecosystem\/crypto/@uns\/$uns_base_package/g' $file
            fi
        done

        ark_crypto_version=$(sed -n 's/\"uns_version\": \"\(.*\)\"\,\?/\1/p' "$1/../crypto/package.json" | tr -d '[:space:]')
        if [ -n "$ark_crypto_version" ]
        then
            echo "Set @uns/$uns_base_package dependency to version $ark_crypto_version"
            sed -i "s/\"@arkecosystem\/crypto\": \".*\"/\"@uns\/$uns_base_package\": \"\^$ark_crypto_version\"/g" "$1/package.json"
        else
            echo "Unable to retrieve @uns/$uns_base_package version"
            exit 1
        fi;;
    *)
        echo "Unknown UNS package $package_name"
        exit 1;;
esac

