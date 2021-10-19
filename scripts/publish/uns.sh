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
    if [[ "$CIRCLE_BRANCH" == "develop" ]]; then
        BUILD_SUFFIX=""
        if [ -n "$CIRCLE_BUILD_NUM" ]; then
            BUILD_SUFFIX=".$CIRCLE_BUILD_NUM"
        fi
        NPM_PRE_ID="dev$BUILD_SUFFIX" yarn publish:uns:dev --yes
    elif [[ "$TAG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        #publish release
        echo "Publishing UNN packages to version $TAG"
        yarn publish:uns --yes $TAG
    fi
fi
