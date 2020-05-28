#!/usr/bin/env bash

set -e
echo "CIRCLE_TAG is ! $CIRCLE_TAG"
TAG=$(git tag --points-at HEAD)
echo "TAG is ! '$TAG'"

if [[ "$CIRCLE_TAG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "$CIRCLE_TAG match !"
fi

if [[ "$TAG" =~ "^[0-9]+\.[0-9]+\.[0-9]+$" ]]; then
  echo "$TAG match !"
fi

