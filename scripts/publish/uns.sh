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

    TAG=$(git tag --points-at HEAD)
    #publish release
    if [[ "$TAG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "Publishing UNS packages to version $TAG"
        yarn publish:uns --yes $TAG
    else
        yarn publish:uns:dev --yes
    fi
fi
