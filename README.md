# Ark Core - with Non fungible tokens

## Introduction

This repository is forked from [ArkEcosystem/core](https://github.com/ArkEcosystem/core).
It adds non fungible token management to Ark framework.

:warning: **_this project is experimental, do not use it in production_** :warning:

## Documentation

For information about Ark framework features look into the [Readme](https://github.com/ArkEcosystem/core/blob/master/README.md)

For information about the non fungible token feature of Ark framework look at [discussion](https://github.com/ArkEcosystem/core/issues)

### How to test

In order to test the NFT feature, you must run a [test network](https://docs.ark.io/guidebook/developer/setup-dev-environment.html#spinning-up-your-first-testnet).

Once your test network is up, you can use the `core-tester-cli` package to create NFT transactions.

_Note: transactions are signed by the wallet generated with passphrase in `config.ts`._

#### Mint a token:

```bash
> yarn tester nftmint --id 1
```

This command will create a transaction to mint the token number `1`.
Then, it'll broadcast the transaction to your local node, which should forge a new block.
The command ends successfully after checking if token has been really minted (calling node API).

You can run `curl 127.0.0.1:4003/api/v2/nft` to manually check your new token through node API.
You can run `curl 127.0.0.1:4003/api/v2/wallets/AJPicaX6vmokoK3x8abBMDpi8GMPc7rLiW` to manually check if the wallet is the owner of the new token.

_Note: you can omit the `--id` flag, command will generate an id for you and print it to the console._

#### Transfer a token:

_work in progress_

```bash
> yarn tester nfttransfer --recipient AUDpEnzTRxc8w7KgqeGVo4jzmjeTh2bmgB --id 1
```

This command will create a transaction to transfer ownership of token number `1` to address `AUDpEnzTRxc8w7KgqeGVo4jzmjeTh2bmgB`.
The command ends successfully after checking if the new token owner is the given recipient (calling node API).

You can run `curl 127.0.0.1:4003/api/v2/wallets/AJPicaX6vmokoK3x8abBMDpi8GMPc7rLiW` to manually check if the wallet is **not** the owner of the given token.
You can run `curl 127.0.0.1:4003/api/v2/wallets/AUDpEnzTRxc8w7KgqeGVo4jzmjeTh2bmgB` to manually check if the wallet is **the new** owner of the given token.

#### Update a token:

_Coming soon_

## TODOs

- [ ] fix double transaction execution (in the pool **and** in the block processor). The branch `debug/nft` trace execution to visualize the bug.
- [ ] persist in database. Currently, when you restart node, all tokens are erased.
- [ ] implement a way to revert `update` transactions.
- [ ] update token id to `Buffer` to fit with specifications
- [ ] estimate and set default fees amount.
- [ ] rename `/nft` API to `/nfts`
- [ ] fix old tests.
