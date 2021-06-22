# UNS Core

[![Codecov](https://badgen.now.sh/codecov/c/github/unik-name/uns-core)](https://codecov.io/gh/unik-name/uns-core)
[![License: MIT](https://badgen.now.sh/badge/license/MIT/green)](https://opensource.org/licenses/MIT)

## Introduction

> This repository contains all plugins that make up the UNS Core. UNS Core is a fork from ARK Core blockchain framework.

Check our [dedicated documentation site](https://docs.uns.network/) for information about UNS Network. Learn about all available ARK plugins and [How to write a Core Plugin
](https://learn.ark.dev/application-development/how-to-write-core-dapps) if you want to get started with developing your own plugins.

## Development setup

-   Build the node `yarn setup`
-   Start dockerized postgres `yarn docker:db $network` with \$network=livenet|sandbox
-   Run the node `cd packages/core && yarn $nodeType:$network` with \$nodeType=relay|forger

## Documentation

-   Development : https://docs.uns.network/
-   Docker : https://docs.uns.network/docker-configuration.html

## API Documentation

-   ARK Core API : https://api.ark.dev
-   Unikname API : https://docs.uns.network/api.html

## GitHub Development Bounty

-   Get involved with the development and start earning UNS : https://forum.unikname.com/t/community-bounty-program/452

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@unikname.com. All security vulnerabilities will be promptly addressed.

## Credits

This project exists thanks to all the people who [contribute](../../contributors).

## License

[MIT](LICENSE) © [Space Elephant SAS](https://www.spacelephant.org/)
