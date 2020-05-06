import { State } from "@arkecosystem/core-interfaces";
import { Wallet, WalletManager } from "@arkecosystem/core-state/dist/wallets";
import { Handlers } from "@arkecosystem/core-transactions";
import { Constants, Identities, Managers, Utils } from "@arkecosystem/crypto";
import { DIDTypes } from "@uns/crypto";
import { DelegateRegisterTransactionHandler } from "@uns/uns-transactions";
import { buildDelegatePool } from "../helpers";

// use sandbox to test with 23 delegates
Managers.configManager.setFromPreset("sandbox");
const height = Managers.configManager.getMilestones().find(milestone => !!milestone.nbDelegatesByType).height;
Managers.configManager.setHeight(height);
jest.spyOn(Managers.configManager, "getMilestone").mockReturnValue({
    ...Managers.configManager.getMilestone(),
    voterMaximumWeight: {
        individual: 1000000000000,
    },
});

Handlers.Registry.registerTransactionHandler(DelegateRegisterTransactionHandler);

const nbNetworks = Managers.configManager.getMilestone().nbDelegatesByType.network;
const nbIndividuals = Managers.configManager.getMilestone().nbDelegatesByType.individual;
const nbOrganizations = Managers.configManager.getMilestone().nbDelegatesByType.organization;
const firstOrganization = nbIndividuals + 1;
const firstNetwork = nbOrganizations + firstOrganization;

let walletManager: State.IWalletManager;
const { SATOSHI } = Constants;

beforeEach(() => {
    walletManager = new WalletManager();
});

const checkDelegateTypeAndVotes = (delegate: State.IWallet, idx: number, array: State.IWallet[], type: number) => {
    // check type
    expect(delegate.getAttribute<number>("delegate.type")).toEqual(type);
    // check vote balance
    if (idx) {
        expect(
            array[idx - 1]
                .getAttribute<Utils.BigNumber>("delegate.voteBalance")
                .minus(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance"))
                .isGreaterThanEqual(Utils.BigNumber.ZERO),
        ).toBeTrue();
        expect(
            array[idx - 1]
                .getAttribute<Utils.BigNumber>("delegate.weightedVoteBalance")
                .minus(delegate.getAttribute<Utils.BigNumber>("delegate.weightedVoteBalance"))
                .isGreaterThanEqual(Utils.BigNumber.ZERO),
        ).toBeTrue();
    }
};

describe("buildDelegateRanking", () => {
    it("should build ranking and sort delegates by vote balance", async () => {
        const delegates = buildDelegatePool(walletManager, 50);

        // assert nbIndividuals first delegates are individual delegates
        delegates
            .filter(delegate => delegate.getAttribute<number>("delegate.rank") <= nbIndividuals)
            .map((delegate, idx, array) => checkDelegateTypeAndVotes(delegate, idx, array, DIDTypes.INDIVIDUAL));

        // assert delegates 11-20 are organization delegates
        delegates
            .filter(delegate => {
                const rank = delegate.getAttribute<number>("delegate.rank");
                return rank >= firstOrganization && rank < firstNetwork;
            })
            .map((delegate, idx, array) => checkDelegateTypeAndVotes(delegate, idx, array, DIDTypes.ORGANIZATION));

        // assert first delegates 21-23 are network delegates
        delegates
            .filter(delegate => {
                const rank = delegate.getAttribute<number>("delegate.rank");
                return rank >= firstNetwork && rank <= nbIndividuals + nbOrganizations + nbNetworks;
            })
            .map((delegate, idx, array) => checkDelegateTypeAndVotes(delegate, idx, array, DIDTypes.NETWORK));
    });

    it("should build ranking with missing organization an network delegates", async () => {
        const NB_DELEGATES = 30;
        for (let i = 0; i < NB_DELEGATES; i++) {
            // Generate NB_DELEGATES -2 individual delegate wallet
            const delegatePassphrase = `delegate secret ${i}`;
            const delegateKey = Identities.PublicKey.fromPassphrase(delegatePassphrase);
            const delegate = new Wallet(Identities.Address.fromPassphrase(delegatePassphrase));
            delegate.publicKey = delegateKey;
            delegate.setAttribute("delegate.username", `delegate${i}`);
            delegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);
            if (i === 28) {
                // Generate one organization delegate
                delegate.setAttribute<number>("delegate.type", DIDTypes.ORGANIZATION);
            } else if (i === 29) {
                // Generate one network delegate
                delegate.setAttribute<number>("delegate.type", DIDTypes.NETWORK);
            } else {
                delegate.setAttribute<number>("delegate.type", DIDTypes.INDIVIDUAL);
            }

            // Generate NB_DELEGATES voters wallet.
            const voterPassphrase = `voter secret ${i}`;
            const voterKey = Identities.PublicKey.fromPassphrase(voterPassphrase);
            const voter = new Wallet(Identities.Address.fromPassphrase(voterPassphrase));
            voter.balance = Utils.BigNumber.make((NB_DELEGATES - i) * 1000 * SATOSHI);
            voter.publicKey = voterKey;
            voter.setAttribute("vote", delegateKey);

            walletManager.index([delegate, voter]);
        }

        walletManager.buildVoteBalances();
        const delegates = walletManager.buildDelegateRanking();

        // assert delegate 11 is organization
        expect(
            delegates.some(
                delegate =>
                    delegate.getAttribute<number>("delegate.rank") === firstOrganization &&
                    delegate.getAttribute<number>("delegate.type") === DIDTypes.ORGANIZATION,
            ),
        ).toBeTrue();

        // assert delegate 21 is network
        expect(
            delegates.some(
                delegate =>
                    delegate.getAttribute<number>("delegate.rank") === firstNetwork &&
                    delegate.getAttribute<number>("delegate.type") === DIDTypes.NETWORK,
            ),
        ).toBeTrue();
    });

    it("should build ranking with missing delegates and fills with genesis", async () => {
        buildDelegatePool(walletManager, 15);

        const NB_GENESIS = 15;
        for (let i = 0; i < NB_GENESIS; i++) {
            // Generate NB_GENESIS  wallets
            const delegatePassphrase = `genesis secret ${i}`;
            const delegateKey = Identities.PublicKey.fromPassphrase(delegatePassphrase);
            const delegate = new Wallet(Identities.Address.fromPassphrase(delegatePassphrase));
            delegate.publicKey = delegateKey;
            delegate.setAttribute("delegate.username", `genesis_${i}`);
            delegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

            walletManager.reindex(delegate);
        }
        walletManager.buildVoteBalances();
        const delegates = walletManager.buildDelegateRanking();

        // assert 5 first delegates are individual delegates
        delegates
            .filter(delegate => delegate.getAttribute<number>("delegate.rank") <= 5)
            .map((delegate, idx, array) => checkDelegateTypeAndVotes(delegate, idx, array, DIDTypes.INDIVIDUAL));

        // assert delegates 6-10 and 16-20 are genesis
        delegates
            .filter(delegate => {
                const rank = delegate.getAttribute<number>("delegate.rank");
                return (rank >= 6 && rank < firstOrganization) || (rank >= 16 && rank < firstNetwork);
            })
            .map((delegate, idx, array) => {
                expect(delegate.getAttribute<string>("delegate.username").match(/genesis_/)).toBeTruthy();
                checkDelegateTypeAndVotes(delegate, idx, array, undefined);
            });

        // assert delegates 11-15 are organization delegates
        delegates
            .filter(delegate => {
                const rank = delegate.getAttribute<number>("delegate.rank");
                return rank >= firstOrganization && rank <= 15;
            })
            .map((delegate, idx, array) => checkDelegateTypeAndVotes(delegate, idx, array, DIDTypes.ORGANIZATION));

        // assert delegates 20-23 are network delegates
        delegates
            .filter(delegate => {
                const rank = delegate.getAttribute<number>("delegate.rank");
                return rank >= firstNetwork && rank <= nbIndividuals + nbOrganizations + nbNetworks;
            })
            .map((delegate, idx, array) => checkDelegateTypeAndVotes(delegate, idx, array, DIDTypes.NETWORK));
    });

    it("should build ranking for individual delegates with voter balance over 10.000 UNS", async () => {
        const NB_DELEGATES = 3;
        for (let i = 0; i < NB_DELEGATES; i++) {
            const delegatePassphrase = `delegate secret ${i}`;
            const delegateKey = Identities.PublicKey.fromPassphrase(delegatePassphrase);
            const delegate = new Wallet(Identities.Address.fromPassphrase(delegatePassphrase));
            delegate.publicKey = delegateKey;
            delegate.setAttribute("delegate.username", `delegate${i}`);
            delegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);
            delegate.setAttribute<number>("delegate.type", DIDTypes.INDIVIDUAL);

            // Generate NB_DELEGATES voters wallet.
            const voterPassphrase = `voter secret ${i}`;
            const voterKey = Identities.PublicKey.fromPassphrase(voterPassphrase);
            const voter = new Wallet(Identities.Address.fromPassphrase(voterPassphrase));
            voter.balance = Utils.BigNumber.make((NB_DELEGATES - i) * 10000 * SATOSHI);
            voter.publicKey = voterKey;
            voter.setAttribute("vote", delegateKey);

            // Generate NB_DELEGATES voters wallet.
            const voter2Passphrase = `voter2 secret ${i}`;
            const voter2Key = Identities.PublicKey.fromPassphrase(voter2Passphrase);
            const voter2 = new Wallet(Identities.Address.fromPassphrase(voter2Passphrase));
            voter2.balance = Utils.BigNumber.make((i + 1) * 10000 * SATOSHI);
            voter2.publicKey = voter2Key;
            voter2.setAttribute("vote", delegateKey);

            walletManager.index([delegate, voter, voter2]);
        }
        walletManager.buildVoteBalances();
        const delegates = walletManager.buildDelegateRanking();

        const wallets = walletManager.allByAddress();

        expect(delegates.length).toEqual(NB_DELEGATES);
        // check delegate have same weighted balance
        for (const delegate of delegates) {
            const voters = wallets.filter(wallet => wallet.getAttribute<string>("vote") === delegate.publicKey);
            const weightedVoteBalance = delegate.getAttribute<Utils.BigNumber>("delegate.weightedVoteBalance");
            expect(weightedVoteBalance.isEqualTo(Utils.BigNumber.make(voters.length * 10000 * SATOSHI)));
        }
    });
});
