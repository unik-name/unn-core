#!/usr/bin/env bash

# This script is called by "lerna version" juste before the release commit creation

version=$(awk -F '"' '/version/{print $4}' "lerna.json")
echo "Bumping UNS packages to version $version"

uns_packages_dirs="plugins/nft/nft-transactions plugins/uns/uns-transactions packages/core"
for dir in $uns_packages_dirs; do
 pushd $dir
 yarn version --no-git-tag-version --new-version $version
 popd
done

uns_repo="@uns"
uns_packages="core-nft-crypto core-nft crypto uns-transactions"
for package in $uns_packages; do
    for dir in `grep --include=package.json -rl packages plugins -e $uns_repo/$package`; do
        sed -i.bak "s/\"$uns_repo\/$package\": \"\(.*\)\"/\"$uns_repo\/$package\": \"^$version\"/g" $dir
    done
done

# remove all `.bak` files
find {packages,plugins} -name "*.bak" -exec rm {} +

# stage all modified packages.json
git add */package.json
