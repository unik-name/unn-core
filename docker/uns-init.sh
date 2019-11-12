#!/bin/sh

NETWORK=${UNS_NET:-devnet} # default devnet

echo "network : $NETWORK" #devnet, mainnet, testnet

CONFIG_DIR=~/.config/uns-core/$NETWORK

# publish default config (from sources) to $CONFIG_DIR
uns config:publish --network=$NETWORK

# warning: remove `.env` file otherwise external environment variables will be ignored.
rm $CONFIG_DIR/.env

# Backward compatibility (remove later)
if [[ -n "${DB_HOST}" ]]; then
  export CORE_DB_HOST=$DB_HOST
  echo $DB_HOST $CORE_DB_HOST
  echo "warning: 'DB_HOST' environment variable will be deprecated soon. Use 'CORE_DB_HOST' instead."
fi
if [[ -n "${DB_PORT}" ]]; then
  export CORE_DB_PORT=$DB_PORT
  echo "warning: 'DB_PORT' environment variable will be deprecated soon. Use 'CORE_DB_PORT' instead."
fi
if [[ -n "${DB_USER}" ]]; then
  export CORE_DB_USER=$DB_USER
  echo "warning: 'DB_USER' environment variable will be deprecated soon. Use 'CORE_DB_USER' instead."
fi
if [[ -n "${DB_PASSWORD}" ]]; then
  export CORE_DB_PASSWORD=$DB_PASSWORD
  echo "warning: 'DB_PASSWORD' environment variable will be deprecated soon. Use 'CORE_DB_PASSWORD' instead."
fi
if [[ -n "${DB_DATABASE}" ]]; then
  export CORE_DB_DATABASE=$DB_DATABASE
  echo "warning: 'DB_DATABASE' environment variable will be deprecated soon. Use 'CORE_DB_DATABASE' instead."
fi


if [[ -n "${BOOTSTRAP}" ]]; then
  echo "bootstrap mode"
  NETWORK_START="--networkStart"
fi

if [[ -n "${BOOTNODE}" ]]; then
  echo "uses bootnode : ${BOOTNODE}"
  IP=$(nslookup $BOOTNODE | cut -d ' ' -f 3)
  PEER_FILE=$CONFIG_DIR/peers.json
  echo $(jq --arg ip $IP '.list += [{"ip": $ip,"port":"4002"}]' $PEER_FILE ) > $PEER_FILE # warning 4002 port used
fi

FORGER=false # No forger by default

if [[ -n "${FORGERS_SECRET}" ]]; then
  echo "setting forgers secret from `FORGERS_SECRET` environment variable (MULTI FORGERS MODE)"
  echo "{\"secrets\": [$FORGERS_SECRET]}" > $CONFIG_DIR/delegates.json
  FORGER=true
elif [[ -n "${FORGER_SECRET}" ]]; then
  echo "setting forger secret from `FORGER_SECRET`environment variable (SINGLE FORGER MODE)"
  uns config:forger:bip39 --bip39 "$FORGER_SECRET"
  FORGER=true
else
  echo "No forger configured. Only relay node will be started."
fi

# Run
if [ "$FORGER" = true ] ; then
    echo "Starting forger"
    uns forger:run & 
fi
uns relay:run --network=$NETWORK $NETWORK_START 
