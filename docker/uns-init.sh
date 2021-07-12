#!/bin/sh

NETWORK=${UNS_NET:-livenet} # default livenet
TOKEN="uns"

echo "network : $NETWORK"
echo "token : $TOKEN"

CONFIG_DIR=~/.config/uns-core/$NETWORK

# publish default config (from sources) to $CONFIG_DIR
uns config:publish --network=$NETWORK --token $TOKEN

# Backward compatibility (remove later)
if [ -n "$DB_HOST" ]; then
  export CORE_DB_HOST=$DB_HOST
  echo "warning: 'DB_HOST' environment variable will be deprecated soon. Use 'CORE_DB_HOST' instead."
fi
if [ -n "$DB_PORT" ]; then
  export CORE_DB_PORT=$DB_PORT
  echo "warning: 'DB_PORT' environment variable will be deprecated soon. Use 'CORE_DB_PORT' instead."
fi
if [ -n "$DB_USER" ]; then
  export CORE_DB_USER=$DB_USER
  echo "warning: 'DB_USER' environment variable will be deprecated soon. Use 'CORE_DB_USER' instead."
fi
if [ -n "$DB_PASSWORD" ]; then
  export CORE_DB_PASSWORD=$DB_PASSWORD
  echo "warning: 'DB_PASSWORD' environment variable will be deprecated soon. Use 'CORE_DB_PASSWORD' instead."
fi
if [ -n "$DB_DATABASE" ]; then
  export CORE_DB_DATABASE=$DB_DATABASE
  echo "warning: 'DB_DATABASE' environment variable will be deprecated soon. Use 'CORE_DB_DATABASE' instead."
fi

# Parse file (first parameter) and replace in file environment variable value of already exported environment variables.
seek_and_replace(){
  while IFS= read -r line; do # Read each file line
    if [ ! ${#line} -eq "0" ]; then # Skip empty lines
      KEY=$(echo $line | sed 's/^\(.*\)=.*$/\1/') # Environment variable key to seek
      ENV_LINE=$(env | grep ^$KEY=) # Seek environment variable above in exported variables
      if [ ! -z $ENV_LINE ]; then # If current environment variable is exported
        VALUE=$(echo $ENV_LINE | sed 's/^'$KEY'=\(.*\)$/\1/') # Get value of exported environment variable
        sed -i "s/^\($KEY=\).*$/\1$VALUE/g" $1 # Replace in file, value of current variable by exported value
        echo "Found external variable $KEY. Replace in config file to value '$VALUE'"
      fi
    fi
  done < $1
}

seek_and_replace $CONFIG_DIR/.env

echo "using P2P port: $CORE_P2P_PORT"

if [[ -n "${BOOTSTRAP}" ]]; then
  echo "bootstrap mode"
  NETWORK_START="--networkStart"
fi

if [[ -n "${BOOTNODE}" ]]; then
  echo "uses bootnode : ${BOOTNODE}"
  IP=$(getent hosts  $BOOTNODE | cut -d ' ' -f 1)
  if [[ -n "${IP}" ]]; then
    PEER_FILE=$CONFIG_DIR/peers.json
    echo $(jq --arg ip $IP --arg port $CORE_P2P_PORT '.list += [{"ip": $ip,"port":"$port"}]' $PEER_FILE ) > $PEER_FILE
  fi
  echo "wait bootnode to be up and forging ($STARTING_DELAY)"
  sleep $STARTING_DELAY

fi

FORGER=false # No forger by default

if [[ -n "${FORGERS_SECRET}" ]]; then
  echo "setting forgers secret from `FORGERS_SECRET` environment variable (MULTI FORGERS MODE)"
  echo "{\"secrets\": [$FORGERS_SECRET]}" > $CONFIG_DIR/delegates.json
  FORGER=true
elif [[ -n "${FORGER_SECRET}" ]]; then
  echo "setting forger secret from `FORGER_SECRET`environment variable (SINGLE FORGER MODE)"
  uns config:forger:bip39 --bip39 "$FORGER_SECRET" --token $TOKEN
  FORGER=true
else
  echo "No forger configured. Only relay node will be started."
fi

# Run
if [ "$FORGER" = true ] ; then
  echo "Starting full node (relay + forger)"
  uns core:run --network=$NETWORK $NETWORK_START --token $TOKEN
else
  echo "Starting relay node"
  uns relay:run --network=$NETWORK $NETWORK_START --token $TOKEN
fi
