# Ark Core - with Non fungible tokens

## Introduction

This repository is forked from [ArkEcosystem/core](https://github.com/ArkEcosystem/core).
It adds non fungible token management to Ark framework.

:warning: **_this project is experimental, do not use it in production_** :warning:
:warning: **_@arkecosystem dependencies paths are overridden to use @uns modules in packages core and core-tester-cli (module-aliases) for run step. Same thing in .tsconfig files for build step_** :warning:

## Documentation

For information about Ark framework features look into the [Readme](https://github.com/ArkEcosystem/core/blob/master/README.md)

For information about the non fungible token feature of Ark framework look at [discussion](https://github.com/ArkEcosystem/core/issues)

### How to test

In order to test the NFT feature, you must run a test network.

#### Setup environment

```
yarn
yarn setup
```

#### Run

##### Database

```
yarn docker uns
cd docker/development/testnet
docker-compose up -d postgres
```

##### Launch

Go to `packages/core` and launch testnet

```
cd ../../../packages/core
yarn full:testnet
```

Your testnet ark is launched!

Once your test network is up, you can use the `core-tester-cli` package to create NFT transactions.

_Note: in order to be able to broadcast transactions, wallets receive funds from the passphrase in `config.ts`._

#### 0: Generate a wallet

```bash
> yarn tester make:wallets --quantity 1 --write
```

It will create a new empty wallet and store its information into `$(pwd)/wallets.json` (passphrase, address, keys).

#### Mint a token:

```bash
> yarn tester send:nfttransfer --id $TOKEN_ID --owner $PASSPHRASE
```

_Note 1: `$TOKEN_ID` is the token identifier you want to mint_
_Note 2: `$PASSPHRASE` is the one in `$(pwd)/wallets.json`, the token owner_
_Note 3: instead of `--id`, you can use option `--unikname $UNIKNAME` to use unikname as token identifier_

This command will create a transaction minting the token identified by given number.
Then, it'll broadcast the transaction to your local node, which should forge a new block.
The command ends successfully after checking if token has been really minted (calling node API).

You can run `curl 127.0.0.1:4003/api/v2/nfts` to manually check your new token through node API.
You can run `curl 127.0.0.1:4003/api/v2/wallets/${owner_address}` to manually check if the wallet is the owner of the new token.

_Note: you can omit the `--id` or `--unikname` flag, command will generate an id for you._

#### Transfer a token :

_⚠️ work in progress_

```bash
> yarn tester send:nfttransfer --id $TOKEN_ID --recipient $RECIPIENT --owner $PASSPHRASE
```

_Note: `$RECIPIENT` is the new token owner address_

This command will create a transaction to transfer ownership of given token to given address.
The command ends successfully after checking if the new token owner is the given recipient (calling node API).

You can run `curl 127.0.0.1:4003/api/v2/wallets/${owner_address}` to manually check if the wallet is **not** the owner of the given token.
You can run `curl 127.0.0.1:4003/api/v2/wallets/${recipient_address}` to manually check if the wallet is **the new** owner of the given token.

#### Update a token:

_Coming soon_

### Clean for safe restart

Clean dependencies in each package: [Lerna/clean](https://github.com/lerna/lerna/tree/master/commands/clean#readme)

```
yarn clean
```

Remove docker containers and volumes:

```
docker stop uns-testnet-postgres && docker system prune -a && docker volume remove testnet_core testnet_postgres
```

Remove ark testnet caches:

```
rm -rf ~/.local/state/uns-core/testnet && rm -rf ~/.local/share/uns-core/testnet && rm -rf ~/.cache/uns-core/testnet
```

## TODOs

-   [ ] fix double transaction execution (in the pool **and** in the block processor). The branch `debug/nft` trace execution to visualize the bug.
-   [ ] persist in database. Currently, when you restart node, all tokens are erased.
-   [ ] implement a way to revert `update` transactions.
-   [ ] update token id to `Buffer` to fit with specifications
-   [ ] estimate and set default fees amount.
-   [x] rename `/nft` API to `/nfts`
-   [ ] fix old tests.

## Upgrade from upstream

1. Merge upstream into `feat/nft`

_NB: merge a release tag (from upstream/master)_

```
> git merge 2.3.22 feat/nft
```

2. Checkout to private/develop

```
> git checkout private/develop
```

3. Revert commit tagged with `rebrand`

```
> git revert rebrand
```

4. Merge `feat/nft`

```
> git merge feat/nft
```

5. Customize version

_NB: naming is UPSTREAM_VERSION-LOCAL_INCREMENT (e.g 2.3.22 -> 2.3.22-1)_

```
> yarn lerna version 2.3.22-1
```

6. Rebrand project

```
> yarn rebrand
```

7. Commit

```
> git add . && git commit -m "auto: release new UNS version 2.3.22-1"
```

8. Move tag `rebrand` and new version tag

```
> git tag -d rebrand
> git push private :rebrand
> git tag rebrand 2.3.22-1
```

9. Push

```
> git push private private/develop 2.3.22-1 rebrand
```

## Release version

A release must be made from `private/develop` branch.

```
> yarn lerna version --no-push --message "release new UNS version %v"
> git push ${remote} private/develop ${version-tag}
> cd packages/crypto
> npm publish
```
