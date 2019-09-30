# uns-cli

uns CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/uns-cli.svg)](https://npmjs.org/package/@uns/uns-cli)
[![Downloads/week](https://img.shields.io/npm/dw/uns-cli.svg)](https://npmjs.org/package/@uns/uns-cli)

<!-- toc -->

-   [uns-cli](#uns-cli)
-   [Install](#install)
-   [Usage](#usage)
-   [Commands](#commands)
-   [Developers](#developers)
-   [Release / Publish](#release-and-publish-uns-cli)

<!-- tocstop -->

# Install

-   via npm

```
$ npm install -g @uns/uns-cli
```

-   via yarn

```
yarn global add @uns/uns-cli
```

🤖 _Tested with Ubuntu 18.04 and macOS Mojave_

# Usage

<!-- usage -->

```sh-session
$ uns COMMAND
running command...
$ uns (-v|--version|version)
@uns/uns-cli/0.0.0 linux-x64 node-v8.11.1
$ uns --help [COMMAND]
USAGE
  $ uns COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

-   [`uns hello [FILE]`](#uns-hello-file)
-   [`uns help [COMMAND]`](#uns-help-command)

## `uns create-unik [FILE]`

describe the command here

```
Create UNIK token

USAGE
  $ uns create-unik

OPTIONS
  -f, --format=json|yaml                  [default: json] Specify how to format the output [json|yaml].
  -h, --help                              show CLI help
  --explicitValue=explicitValue           (required) UNIK nft token explicit value
  --network=devnet|local                  (required) Network used to create UNIK nft token (local are for development only)
  --passphrase=passphrase                 The passphrase of the owner of UNIK. If you do not enter a passphrase you will be prompted for it.
  --type=individual|organization|network  (required) UNIK nft type
  --verbose                               Detailed logs

EXAMPLE
  $ uns create-unik --explicitValue {explicitValue} --type [individual|organization|network] --network [devnet|local] --format {json|yaml}
```

## `uns create-wallet [FILE]`

describe the command here

```
Create UNS wallet

USAGE
  $ uns create-wallet

OPTIONS
  -f, --format=json|yaml  [default: json] Specify how to format the output [json|yaml].
  -h, --help              show CLI help
  --network=devnet|local  (required) Network used to create UNIK nft token (local are for development only)
  --verbose               Detailed logs

EXAMPLE
  $ uns create-wallet --network [devnet|local]
           --format {json|yaml} --verbose
```

## `uns get-properties [FILE]`

describe the command here

```
Get properties of UNIK token.

USAGE
  $ uns get-properties

OPTIONS
  -f, --format=json|yaml|table|raw  [default: json] Specify how to format the output [json|yaml|table|raw].
  -h, --help                        show CLI help
  --confirmed=confirmed             [default: 3] Minimum number of confirmation since the last update of the UNIK required to return the value.
  --network=devnet|local            (required) Network used to create UNIK nft token (local are for development only)
  --unikid=unikid                   (required) The UNIK token on which to get the properties.
  --verbose                         Detailed logs

EXAMPLE
  $ uns get-properties --unikid {unikId} [--confirmed {number of confirmations}]
           --network [devnet|local] --format {json|yaml|table|raw}
```

## `uns read-unik [FILE]`

describe the command here

```
Display UNIK token informations

USAGE
  $ uns read-unik

OPTIONS
  -f, --format=json|yaml  [default: json] Specify how to format the output [json|yaml].
  -h, --help              show CLI help
  --chainmeta             Retrieve chain meta data
  --network=devnet|local  (required) Network used to create UNIK nft token (local are for development only)
  --unikid=unikid         (required) Token id to read
  --verbose               Detailed logs

EXAMPLE
  $ uns read-unik --unikid {unikId} --network [devnet|local] --format {json|yaml}
```

## `uns read-wallet [FILE]`

describe the command here

```
Read current data of a specified wallet, ic. balance

USAGE
  $ uns read-wallet WALLETID

ARGUMENTS
  WALLETID  The ID of the wallet. Can be either the publicKey or the address of the wallet.

OPTIONS
  -f, --format=json|yaml  [default: json] Specify how to format the output [json|yaml].
  -h, --help              show CLI help
  --chainmeta             Retrieve chain meta data
  --listunik              List UNIK tokens owned by the wallet, if any.
  --network=devnet|local  (required) Network used to create UNIK nft token (local are for development only)
  --verbose               Detailed logs

EXAMPLE
  $ uns read-wallet {publicKey|address} --listunik --network [devnet|local] --format {json|yaml}
```

## `uns set-properties [FILE]`

describe the command here

```
Set (add or update) properties of UNIK token.

USAGE
  $ uns set-properties

OPTIONS
  -f, --format=json|yaml         [default: json] Specify how to format the output [json|yaml].
  -h, --help                     show CLI help

  --await=await                  [default: 3] Number of blocks to wait to get confirmed for the success. Default to 3.
                                                 0 for immediate return.
                                                 Needs to be strictly greater than --confirmation flag

  --confirmations=confirmations  [default: 1] Number of confirmations to wait to get confirmed for the success. Default to 1.
                                 	Needs to be strictly lower than --await flag

  --fee=fee                      [default: 100000000] Specify a dynamic fee in satoUNS. Defaults to 100000000 satoUNS = 1 UNS.

  --network=devnet|local         (required) Network used to create UNIK nft token (local are for development only)

  --passphrase=passphrase        The passphrase of the owner of UNIK. If you do not enter a passphrase you will be prompted for it.

  --properties=properties        (required) Array of properties to set: "key1:value1"
                                                 "key3:" Sets "value1" to "key1" and empty string to "key3"

  --unikid=unikid                (required) The UNIK token on which to set the properties.

  --verbose                      Detailed logs

EXAMPLE
  $ uns set-properties --network [devnet|local] --unkid {unikId}
           --properties "{key}:{value}" --format {json|yaml} --verbose
```

## `uns did-resolve [DID]`

describe the command here

```
Resolve a decentralized identifier.

USAGE
  $ uns did-resolve [DID]

ARGUMENTS
  DID  The identifier to resolve. Expected format : '@[unik:][type,1]/expliciteValue[?propertyKey|?*]'

OPTIONS
  -f, --format=json|yaml|raw  [default: raw] Specify how to format the output [json|yaml|raw].
  -h, --help                  show CLI help
  -n, --network=devnet|local  (required) Network used to create UNIK nft token (local are for development only)
  -v, --verbose               Detailed logs
  --confirmed=confirmed       [default: 3] Minimum number of confirmation since the last update of the UNIK required to return the value.

EXAMPLE
  $ uns did-resolve --confirmed {number of confirmations}
           --network [devnet|local] --format {json|yaml|table|raw}
```

## `uns status [FILE]`

describe the command here

```
Display blockchain status

USAGE
  $ uns status

OPTIONS
  -f, --format=json|yaml|table  [default: json] Specify how to format the output [json|yaml|table].
  -h, --help                    show CLI help
  --network=devnet|local        (required) Network used to create UNIK nft token (local are for development only)
  --verbose                     Detailed logs

EXAMPLE
  $ uns status --network [devnet|local]
```

## `uns version [FILE]`

describe the command here

```
@uns/uns-cli/0.2.0-alpha linux-x64 node-v10.13.0
```

## `uns help [COMMAND]`

display help for uns

```
uns CLI

VERSION
  @uns/uns-cli/0.2.0-alpha linux-x64 node-v10.13.0

USAGE
  $ uns [COMMAND]

COMMANDS
  create-unik     Create UNIK token
  create-wallet   Create UNS wallet
  get-properties  Get properties of UNIK token.
  help            display help for uns
  read-unik       Display UNIK token informations
  read-wallet     Read current data of a specified wallet, ic. balance
  set-properties  Set (add or update) properties of UNIK token.
  status          Display blockchain status
  version         UNS CLI Version
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_

<!-- commandsstop -->

# Developers

## Build

```bash
yarn build
```

## Uglify

```bash
yarn uglify
```

## Run locally

```bash
./bin/run COMMAND ...
```

# Release and Publish UNS CLI

```bash
yarn publishLib
```
