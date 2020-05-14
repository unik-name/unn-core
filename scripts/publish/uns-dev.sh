#!/usr/bin/env bash

PUBLISH_OPTS=$1

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
fi

yarn publish:uns:dev --yes
