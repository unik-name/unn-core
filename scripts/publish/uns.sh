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

    git fetch
    TAG=$(git tag --points-at HEAD)
    #publish release
    if [[ "$CIRCLE_BRANCH" != "develop" && "$TAG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "Publishing UNS packages to version $TAG"
        yarn publish:uns --yes $TAG
    else
        BUILD_SUFFIX=""
        if [ -n "$CIRCLE_BUILD_NUM" ]; then
            BUILD_SUFFIX=".$CIRCLE_BUILD_NUM"
        fi
        NPM_PRE_ID="dev$BUILD_SUFFIX" yarn publish:uns:dev --yes
    fi
fi
