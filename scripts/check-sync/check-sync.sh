#!/bin/bash

curl -fsS --retry 3 https://hc-ping.com/89a3c92a-8f7b-402b-b5dc-982101cf1fd4/start

set -e

ip1=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' uns_dalinet_forger1)
ip2=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' uns_dalinet_forger2)
ip3=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' uns_dalinet_forger3)

height1=$(curl -s $ip1:4003/api/node/status | jq '.data.now')
height2=$(curl -s $ip2:4003/api/node/status | jq '.data.now')
height3=$(curl -s $ip3:4003/api/node/status | jq '.data.now')

MAX_HEIGHT_DIFF=3

height_diff_1=$((height1-height2))
height_diff_2=$((height1-height3))

height_diff_1_abs=$(echo ${height_diff_1#-})
height_diff_2_abs=$(echo ${height_diff_2#-})

if ((  height_diff_1_abs > MAX_HEIGHT_DIFF || height_diff_2_abs > MAX_HEIGHT_DIFF ))
then
    curl -fsS --retry 3 https://hc-ping.com/89a3c92a-8f7b-402b-b5dc-982101cf1fd4/fail

    echo "Nodes sync error:"
    echo "height $ip1 : $height1"
    echo "height $ip2 : $height2"
    echo "height $ip3 : $height3"
else
    echo "Nodes are synced"
    curl -fsS --retry 3 https://hc-ping.com/89a3c92a-8f7b-402b-b5dc-982101cf1fd4
fi

echo "-------"


exit 0
