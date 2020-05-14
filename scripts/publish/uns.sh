#!/usr/bin/env bash

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

    #publish release
    if [[ "$CIRCLE_TAG" =~ '^\d+\.\d+\.\d+/$' ]]; then
        version=$(awk -F '"' '/version/{print $4}' "lerna.json")
        echo "Publishing UNS packages to version $version"
        yarn publish:uns --yes $version
    else
        yarn publish:uns:dev --yes
    fi

fi
