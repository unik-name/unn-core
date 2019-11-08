#!/bin/sh

NETWORK=${UNS_NET:-devnet} # default devnet

echo "network : $NETWORK" #devnet, mainnet, testnet

CONFIG_DIR=~/.config/uns-core/$NETWORK

# publish default config (from sources) to $CONFIG_DIR
uns config:publish --network=$NETWORK

# warning: remove `.env` file otherwise external environment variables will be ignored.
rm $CONFIG_DIR/.env

echo $CORE_DB_HOST

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
    nohup uns forger:run & 
fi
uns relay:run --network=$NETWORK $NETWORK_START 
