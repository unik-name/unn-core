# Unikname Network Core

[![codecov](https://codecov.io/gh/unik-name/unn-core/branch/develop/graph/badge.svg?token=Zu9n8dftoq)](https://codecov.io/gh/unik-name/unn-core)
[![License: MIT](https://badgen.now.sh/badge/license/MIT/green)](https://opensource.org/licenses/MIT)

## Introduction

> This repository contains all plugins that make up the UNN Core. UNN Core is a fork from ARK Core blockchain framework.

Check our [dedicated documentation site](https://docs.unikname.network/) for information about UNN Network. Learn about all available ARK plugins and [How to write a Core Plugin
](https://learn.ark.dev/application-development/how-to-write-core-dapps) if you want to get started with developing your own plugins.

## Development setup

-   Build the node `yarn setup`
-   Start dockerized postgres `yarn docker:db $network` with \$network=livenet|sandbox
-   Run the node `cd packages/core && yarn $nodeType:$network` with \$nodeType=relay|forger

## Documentation

-   Development : https://docs.unikname.network/
-   Docker : https://docs.unikname.network/docker-configuration.html

## API Documentation

-   ARK Core API : https://api.ark.dev
-   Unikname API : https://docs.unikname.network/api.html

## Naming convention

⚠️ **universal-name-system, UNS, uns.network** are previous names of the **unikname.network blockchain**.

⚠️ **UNIK** is the previous name of the **UNIKNAME nft token**

⚠️ **UNS** is the previous name of the **UNIK protocol token**

_=> Renaming in codebase will be made progressively._

## GitHub Development Bounty

-   Get involved with the development and start earning \$UNIK : https://forum.unikname.com/t/community-bounty-program/452

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@unikname.com. All security vulnerabilities will be promptly addressed.

## Credits

This project exists thanks to all the people who [contribute](../../contributors).

## License

[MIT](LICENSE) © [Space Elephant SAS](https://www.spacelephant.org/)
