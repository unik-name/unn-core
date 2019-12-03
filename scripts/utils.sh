#!/usr/bin/env bash

retrieve_uns_version() {
    echo $(awk -F '"' '/uns_version/{print $4}' "$1")
}

retrieve_uns_name() {
    echo $(awk -F '"' '/uns_name/{print $4}' "$1")
}
