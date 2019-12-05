import * as support from "./__support__";
import * as NftSupport from "./__support__/nft";

beforeAll(NftSupport.setUp);
afterAll(support.tearDown);

describe("Transaction Nft - Mint", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        const nftMint = NftSupport.nftMintTransaction({ type: "1" })
            .withNetwork(NftSupport.network)
            .withPassphrase(NftSupport.walletPassphrase)
            .createOne();

        await expect(nftMint).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(nftMint.id).toBeForged();
    });
});
