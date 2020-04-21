#!/usr/bin/env bash

version=$1
commit=$2
if [ -z "$version" ]
then
    echo "empty uns version"
    exit 1
fi

dev="-dev"
if [[ $commit == "--bump" ]]; then
    echo "bumping to version $version"
fi
if [[ $commit == "--release" ]]; then
    dev=""
    echo "releasing version $version"
fi

uns_packages="plugins/uns/ark-crypto plugins/nft/nft-crypto plugins/nft/nft-transactions plugins/uns/uns-crypto plugins/uns/uns-transactions packages/core"

for package in $uns_packages; do
 pushd $package
 yarn version --no-git-tag-version --new-version $version
 popd
done

for dir in `grep --include=package.json -rl {packages,plugins} -e @uns`; do
    sed -i.bak "s/\"@uns\/core-nft-crypto\": \"\(.*\)\"/\"@uns\/core-nft-crypto\": \"^$version$dev\"/g" $dir
    sed -i.bak "s/\"@uns\/core-nft\": \"\(.*\)\"/\"@uns\/core-nft\": \"^$version$dev\"/g" $dir
    sed -i.bak "s/\"@uns\/crypto\": \"\(.*\)\"/\"@uns\/crypto\": \"^$version$dev\"/g" $dir
    sed -i.bak "s/\"@uns\/uns-transactions\": \"\(.*\)\"/\"@uns\/uns-transactions\": \"^$version$dev\"/g" $dir
done

# remove all `.bak` files
find {packages,plugins} -name "*.bak" -exec rm {} +

if [[ $commit == '--bump' || $commit == "--release" ]]; then
    commit_msg="${commit:2}: $version$dev"
    git add packages/ plugins/
    git commit -m "$commit_msg"
    git tag $version
fi
