#!/usr/bin/env bash

set -e

. "$1/../../scripts/utils.sh"

if [ "$(basename $1)" == "crypto" ]
then
    #backup package.json
    cp "$1/package.json" "$1/package.json.back"

    uns_name=$(retrieve_uns_name "$1/package.json")
    if [ -z "$uns_name" ]
    then
        echo "Unable to retrieve uns package name"
        exit 1
    fi

    #get @uns/ark-crypto version
    uns_version=$(retrieve_uns_version "$1/package.json")

    if [ -n "$uns_version" ]
    then
        echo "Publishing @uns/$uns_name $uns_version"
        #replace name in package.json
        sed -i.bak "s/\"name\": \"\(.*\)\"/\"name\": \"@uns\/$uns_name\"/g" "$1/package.json"
        #replace version
        sed -i.bak "s/\"version\": \"\(.*\)\"/\"version\": \"$uns_version\"/g" "$1/package.json"
    else
        echo "Unable to retrieve @uns/$uns_base_package version"
        exit 1
    fi
else
    echo "package not handeled $(basename $1)"
    exit 1
fi


