import "jest-extended";

import "../mocks/core-container";

import { Database, State } from "@arkecosystem/core-interfaces";
import { INftsBusinessRepository } from "@arkecosystem/core-interfaces/dist/core-nft";
import { delegateCalculator } from "@arkecosystem/core-utils";
import { Utils } from "@arkecosystem/crypto";
import { WalletsBusinessRepository } from "../../../../packages/core-database/src";
import { DatabaseService } from "../../../../packages/core-database/src/database-service";
import { Wallet, WalletManager } from "../../../../packages/core-state/src/wallets";
import { Address } from "../../../../packages/crypto/src/identities";
import { genesisBlock } from "../../../utils/fixtures/testnet/block-model";

let walletsRepository: Database.IWalletsBusinessRepository;
let walletManager: State.IWalletManager;
let databaseService: Database.IDatabaseService;

beforeEach(async () => {
    walletManager = new WalletManager();

    walletsRepository = new WalletsBusinessRepository(() => databaseService);
    databaseService = new DatabaseService(
        undefined,
        undefined,
        walletManager,
        walletsRepository,
        undefined,
        undefined,
        undefined,
    );

    // UNS mocks
    const nftRewardsMock = jest.fn().mockResolvedValue(Utils.BigNumber.make("10000"));
    const approvalMock = jest.fn().mockResolvedValue(0.26);
    const totalVotesMock = jest.fn().mockReturnValue({
        individual: Utils.BigNumber.ZERO,
        organization: Utils.BigNumber.ZERO,
        network: Utils.BigNumber.ZERO,
    });
    databaseService.nftsBusinessRepository = ({
        getNftTotalRewards: nftRewardsMock,
        calculateDelegateApproval: approvalMock,
        getTotalVotesByType: totalVotesMock,
    } as any) as INftsBusinessRepository;
});

const generateWallets = (): Wallet[] => {
    return genesisBlock.transactions.map((transaction, index) => {
        // @TODO: switch to unitnet
        const address: string = Address.fromPublicKey(transaction.data.senderPublicKey, 23);

        return Object.assign(new Wallet(address), {
            balance: Utils.BigNumber.make(100),
            publicKey: `publicKey-${address}`,
            attributes: {
                secondPublicKey: `secondPublicKey-${address}`,
                vote: `vote-${address}`,
                delegate: {
                    username: `username-${address}`,
                    voteBalance: Utils.BigNumber.make(200),
                    rank: index + 1,
                },
            },
        });
    });
};

describe("Wallet Repository - Delegates", () => {
    describe("search", () => {
        const delegates = [
            { username: "delegate-0", forgedFees: Utils.BigNumber.make(10), forgedRewards: Utils.BigNumber.make(10) },
            { username: "delegate-1", forgedFees: Utils.BigNumber.make(20), forgedRewards: Utils.BigNumber.make(20) },
            { username: "delegate-2", forgedFees: Utils.BigNumber.make(30), forgedRewards: Utils.BigNumber.make(30) },
        ];

        const wallets = [delegates[0], {}, delegates[1], { username: "" }, delegates[2], {}].map(delegate => {
            const wallet = new Wallet("");
            return Object.assign(wallet, { attributes: { delegate } });
        });

        const search = async (params: Database.IParameters = {}): Promise<Database.IRowsPaginated<State.IWallet>> => {
            return await walletsRepository.search(Database.SearchScope.Delegates, params);
        };

        beforeEach(() => {
            const wallets = generateWallets();
            walletManager.index(wallets);
        });

        it("should return the local wallets of the connection that are delegates", async () => {
            jest.spyOn(walletManager, "allByUsername").mockReturnValue(wallets);

            const { rows } = await search();

            expect(rows).toEqual(expect.arrayContaining(wallets));
            expect(walletManager.allByUsername).toHaveBeenCalled();
        });

        it("should be ok with params (forgedTotal)", async () => {
            // @ts-ignore
            jest.spyOn(walletManager, "allByUsername").mockReturnValue(wallets);

            const { rows } = await search({ forgedTotal: undefined });

            for (const delegate of rows) {
                expect(delegate.hasAttribute("delegate.forgedTotal")).toBeTrue();
                expect(delegate.getAttribute("delegate.forgedTotal")).toBe(
                    delegateCalculator.calculateForgedTotal(delegate),
                );
            }
        });

        it("should be ok without params", async () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = await search({});

            expect(count).toBe(52);
            expect(rows).toHaveLength(52);
            expect(
                (rows as any).sort((a, b) => a.getAttribute("delegate.rank") < b.getAttribute("delegate.rank")),
            ).toEqual(rows);
        });

        it("should be ok with params", async () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = await search({ offset: 10, limit: 10, orderBy: "rate:desc" });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
            expect((rows as any).sort((a, b) => a.rate > b.rate)).toEqual(rows);
        });

        it("should be ok with params (no offset)", async () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = await search({ limit: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (offset = 0)", async () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = await search({ offset: 0, limit: 12 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(12);
        });

        it("should be ok with params (no limit)", async () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = await search({ offset: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(42);
        });

        describe("by `username`", () => {
            it("should search by exact match", async () => {
                const username = "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn";
                const { count, rows } = await search({ username });

                expect(count).toBe(1);
                expect(rows).toHaveLength(1);
                expect(rows[0].getAttribute("delegate.username")).toEqual(username);
            });

            it("should search that username contains the string", async () => {
                const { count, rows } = await search({ username: "username" });

                expect(count).toBe(52);
                expect(rows).toHaveLength(52);
            });

            describe('when a username is "undefined"', () => {
                it("should return it", async () => {
                    // Index a wallet with username "undefined"
                    walletManager.allByAddress()[0].setAttribute("delegate", { username: "undefined" });

                    const username = "undefined";
                    const { count, rows } = await search({ username });

                    expect(count).toBe(1);
                    expect(rows).toHaveLength(1);
                    expect(rows[0].getAttribute("delegate.username")).toEqual(username);
                });
            });

            describe("when the username does not exist", () => {
                it("should return no results", async () => {
                    const { count, rows } = await search({
                        username: "unknown-dummy-username",
                    });

                    expect(count).toBe(0);
                    expect(rows).toHaveLength(0);
                });
            });

            it("should be ok with params", async () => {
                const { count, rows } = await search({
                    username: "username",
                    offset: 10,
                    limit: 10,
                });
                expect(count).toBe(52);
                expect(rows).toHaveLength(10);
            });

            it("should be ok with params (no offset)", async () => {
                const { count, rows } = await search({
                    username: "username",
                    limit: 10,
                });
                expect(count).toBe(52);
                expect(rows).toHaveLength(10);
            });

            it("should be ok with params (offset = 0)", async () => {
                const { count, rows } = await search({
                    username: "username",
                    offset: 0,
                    limit: 12,
                });
                expect(count).toBe(52);
                expect(rows).toHaveLength(12);
            });

            it("should be ok with params (no limit)", async () => {
                const { count, rows } = await search({
                    username: "username",
                    offset: 10,
                });
                expect(count).toBe(52);
                expect(rows).toHaveLength(42);
            });
        });

        describe("by `usernames`", () => {
            it("should search by exact match", async () => {
                const usernames = [
                    "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                    "username-AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
                    "username-AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri",
                ];
                const { count, rows } = await search({ usernames });

                expect(count).toBe(3);
                expect(rows).toHaveLength(3);

                for (const row of rows) {
                    expect(usernames.includes(row.getAttribute("delegate.username"))).toBeTrue();
                }
            });

            describe('when a username is "undefined"', () => {
                it("should return it", async () => {
                    // Index a wallet with username "undefined"
                    walletManager.allByAddress()[0].setAttribute("delegate", { username: "undefined" });

                    const usernames = ["undefined"];
                    const { count, rows } = await search({ usernames });

                    expect(count).toBe(1);
                    expect(rows).toHaveLength(1);
                    expect(rows[0].getAttribute("delegate.username")).toEqual(usernames[0]);
                });
            });

            describe("when the username does not exist", () => {
                it("should return no results", async () => {
                    const { count, rows } = await search({
                        usernames: ["unknown-dummy-username"],
                    });

                    expect(count).toBe(0);
                    expect(rows).toHaveLength(0);
                });
            });

            it("should be ok with params", async () => {
                const { count, rows } = await search({
                    usernames: [
                        "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                        "username-AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
                    ],
                    offset: 1,
                    limit: 10,
                });
                expect(count).toBe(2);
                expect(rows).toHaveLength(1);
            });

            it("should be ok with params (no offset)", async () => {
                const { count, rows } = await search({
                    usernames: [
                        "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                        "username-AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
                    ],
                    limit: 1,
                });
                expect(count).toBe(2);
                expect(rows).toHaveLength(1);
            });

            it("should be ok with params (offset = 0)", async () => {
                const { count, rows } = await search({
                    usernames: [
                        "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                        "username-AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
                    ],
                    offset: 0,
                    limit: 2,
                });
                expect(count).toBe(2);
                expect(rows).toHaveLength(2);
            });

            it("should be ok with params (no limit)", async () => {
                const { count, rows } = await search({
                    usernames: [
                        "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                        "username-AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
                    ],
                    offset: 1,
                });
                expect(count).toBe(2);
                expect(rows).toHaveLength(1);
            });
        });

        describe("when searching by `username` and `usernames`", () => {
            it("should search delegates only by `username`", async () => {
                const username = "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn";
                const usernames = [
                    "username-AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
                    "username-AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri",
                ];

                const { count, rows } = await search({ username, usernames });

                expect(count).toBe(1);
                expect(rows).toHaveLength(1);
            });
        });

        describe("when searching without params", () => {
            it("should return all results", async () => {
                const { count, rows } = await search({});

                expect(count).toBe(52);
                expect(rows).toHaveLength(52);
            });

            describe('when a username is "undefined"', () => {
                it("should return all results", async () => {
                    // Index a wallet with username "undefined"
                    walletManager.allByAddress()[0].setAttribute("delegate", { username: "undefined" });

                    const { count, rows } = await search({});
                    expect(count).toBe(52);
                    expect(rows).toHaveLength(52);
                });
            });
        });
    });

    describe("findById", () => {
        const expectWallet = key => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const id: string = key === "username" ? wallets[0].getAttribute("delegate.username") : wallets[0][key];

            const wallet = walletsRepository.findById(Database.SearchScope.Delegates, id);
            expect(wallet).toBeObject();
            expect(wallet.address).toBe(wallets[0].address);
            expect(wallet.publicKey).toBe(wallets[0].publicKey);
            expect(wallet.getAttribute("delegate.username")).toBe(wallets[0].getAttribute("delegate.username"));
        };

        it("should be ok with an address", () => {
            expectWallet("address");
        });

        it("should be ok with a publicKey", () => {
            expectWallet("publicKey");
        });

        it("should be ok with a username", () => {
            expectWallet("username");
        });
    });
});
