#!/bin/bash

address=$(forge create --json --private-key 91ab9a7e53c220e6210460b65a7a3bb2ca181412a8a7b43ff336b3df1737ce12 src/Counter.sol:Counter | jq .deployedTo | tr -d '"')

echo '{"address": "'$address'"}' > ./deployment.json
echo "deployed to $address"
