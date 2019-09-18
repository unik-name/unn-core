#!/bin/sh

NETWORK=${UNS_NET:-devnet} # default devnet

echo "network : $NETWORK" #devnet, mainnet, testnet

# -> config
ENV_FILE=~/.config/uns-core/$NETWORK/.env
if [ ! -f "$ENV_FILE" ]; then
  echo "config doesn't exists for network $NETWORK, creating one in $ENV_FILE"
  uns config:publish --network=$NETWORK
  mkdir -p /etc/uns
  mv /root/.config/uns-core/$NETWORK/* /root/.config/uns-core/$NETWORK/.[!.]* /etc/uns
  rmdir /root/.config/uns-core/$NETWORK
  ln -s /etc/uns/. /root/.config/uns-core/$NETWORK
fi
if [[ -n "${DB_HOST}" ]]; then
  echo "updating DB HOST with $DB_HOST"
  sed -i -E "s/(CORE_DB_HOST=).*/\1$DB_HOST/" $ENV_FILE
fi
if [[ -n "${DB_PORT}" ]]; then
  echo "updating DB PORT with $DB_PORT"
  sed -i -E "s/(CORE_DB_PORT=).*/\1$DB_PORT/" $ENV_FILE
fi
if [[ -n "${DB_USER}" ]]; then
  echo "updating DB USER with $DB_USER"
  sed -i -E "s/(CORE_DB_USER=).*/\1$DB_USER/" $ENV_FILE
fi
if [[ -n "${DB_PASSWORD}" ]]; then
  echo "updating DB PASSWORD with $DB_PASSWORD"
  sed -i -E "s/(CORE_DB_PASSWORD=).*/\1$DB_PASSWORD/" $ENV_FILE
fi
if [[ -n "${DB_DATABASE}" ]]; then
  echo "updating DB DATABASE with $DB_DATABASE"
  sed -i -E "s/(CORE_DB_DATABASE=).*/\1$DB_DATABASE/" $ENV_FILE
fi

mkdir -p /etc/uns && cp $ENV_FILE /etc/uns/env #copy file to mount
FORGER=false

if [[ -n "${BOOTSTRAP}" ]]; then
  echo "bootstrap mode"
  NETWORK_START="--networkStart"
fi

if [[ -n "${FORGERS_SECRET}" ]]; then
  echo "setting forgers secret"
  echo "{\"secrets\": [$FORGERS_SECRET]}" > /etc/uns/delegates.json
  FORGER=true
elif [[ -n "${FORGER_SECRET}" ]]; then
  echo "setting forger secret"
  uns config:forger:bip39 --bip39 "$FORGER_SECRET"
  FORGER=true
fi

# -> run
mkdir -p /var/log/uns
if [ "$FORGER" = true ] ; then
    echo "Starting forger"
    nohup uns forger:run > /var/log/uns/uns-forger.log 2>&1 &
fi
uns relay:run --network=$NETWORK $NETWORK_START 2>&1 | tee -a /var/log/uns/uns-relay.log
