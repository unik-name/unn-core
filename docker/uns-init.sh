#!/bin/sh

NETWORK=${UNS_NET:-devnet} # default devnet

echo "network : $NETWORK" #devnet, mainnet, testnet

replace_or_add () {
  KEY="${1}"
  VALUE="${2}"
  FILE="${3}"
  grep -q "^$KEY=.*$" $FILE && sed -i -E "s/($KEY=).*/\1$VALUE/" $FILE || echo "$KEY=$VALUE" >> $FILE
}

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
  replace_or_add "CORE_DB_HOST" "$DB_HOST" $ENV_FILE
fi
if [[ -n "${DB_PORT}" ]]; then
  echo "updating DB PORT with $DB_PORT"
  replace_or_add "CORE_DB_PORT" "$DB_PORT" $ENV_FILE
fi
if [[ -n "${DB_USER}" ]]; then
  echo "updating DB USER with $DB_USER"
  replace_or_add "CORE_DB_USER" "$DB_USER" $ENV_FILE
fi
if [[ -n "${DB_PASSWORD}" ]]; then
  echo "updating DB PASSWORD with $DB_PASSWORD"
  replace_or_add "CORE_DB_PASSWORD" "$DB_PASSWORD" $ENV_FILE
fi
if [[ -n "${DB_DATABASE}" ]]; then
  echo "updating DB DATABASE with $DB_DATABASE"
  replace_or_add "CORE_DB_DATABASE" "$DB_DATABASE" $ENV_FILE
fi

mkdir -p /etc/uns && cp $ENV_FILE /etc/uns/env #copy file to mount
FORGER=false

if [[ -n "${BOOTSTRAP}" ]]; then
  echo "bootstrap mode"
  NETWORK_START="--networkStart"
fi

if [[ -n "${BOOTNODE}" ]]; then
  echo "setting bootnode : ${BOOTNODE}"
  IP=$(nslookup $BOOTNODE | cut -d ' ' -f 3)
  PEER_FILE=/etc/uns/peers.json
  apk add jq
  echo $(jq --arg ip $IP '.list += [{"ip": $ip,"port":"4002"}]' $PEER_FILE) > $PEER_FILE
  apk del jq
fi

if [[ -n "${FORGERS_SECRET}" ]]; then
  echo "setting forgers secret from `FORGERS_SECRET` --> MULTI FORGERS MODE"
  echo "{\"secrets\": [$FORGERS_SECRET]}" > /etc/uns/delegates.json
  FORGER=true
elif [[ -n "${FORGER_SECRET}" ]]; then
  echo "setting forger secret from `FORGER_SECRET` --> SINGLE FORGER MODE"
  uns config:forger:bip39 --bip39 "$FORGER_SECRET"
  FORGER=true
else
  echo "No forger configured. Only relay node will be started."
fi

# -> run
mkdir -p /var/log/uns
if [ "$FORGER" = true ] ; then
    echo "Starting forger"
    nohup uns forger:run & # do not redirect `> /var/log/uns/uns-forger.log 2>&1 &`
fi
uns relay:run --network=$NETWORK $NETWORK_START # do not redirect `2>&1 | tee -a /var/log/uns/uns-relay.log`
