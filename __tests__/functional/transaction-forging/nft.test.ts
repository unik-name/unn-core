import * as support from "./__support__";
import * as NftSupport from "./__support__/nft";

beforeAll(async () => NftSupport.setUp());
afterAll(async () => support.tearDown());

describe("Transaction Nft", () => {
    it("should mint new unik token with genesis property", async () => {
        const nftId = NftSupport.generateNftId();
        const nftMint = await NftSupport.mintAndWait(nftId);
        await expect(nftMint.id).toBeForged();
        await expect(nftMint).toHaveValidNftPersistanceState();
    });

    it("should add unik token property", async () => {
        const nftId = NftSupport.generateNftId();
        await NftSupport.mintAndWait(nftId);
        const nftUpdate = await NftSupport.addPropertiesAndWait(nftId, { foo: "foo" });
        await expect(nftUpdate.id).toBeForged();
        await expect(nftUpdate).toHaveValidNftPersistanceState();
    });

    it("should update unik token property", async () => {
        const nftId = NftSupport.generateNftId();
        await NftSupport.mintAndWait(nftId);
        await NftSupport.addPropertiesAndWait(nftId, { aKey: "aValue" });
        const nftUpdate = await NftSupport.addPropertiesAndWait(nftId, { aKey: "foo" });
        await expect(nftUpdate.id).toBeForged();
        await expect(nftUpdate).toHaveValidNftPersistanceState();
    });

    it("should remove unik token property", async () => {
        const nftId = NftSupport.generateNftId();
        await NftSupport.mintAndWait(nftId);
        await NftSupport.addPropertiesAndWait(nftId, { aKey: "aValue" });

        // tslint:disable-next-line
        const nftUpdate = await NftSupport.addPropertiesAndWait(nftId, { aKey: null });
        await expect(nftUpdate.id).toBeForged();
        await expect(nftUpdate).toHaveValidNftPersistanceState();
    });

    it("should not be accepted to delete nonexistent property", async () => {
        const nftId = NftSupport.generateNftId();
        await NftSupport.mintAndWait(nftId);

        // tslint:disable-next-line
        const nftUpdate = NftSupport.nftUpdateTransaction(nftId, { aKey: null })
            .withNetwork(NftSupport.network)
            .withPassphrase(NftSupport.defaultPassphrase)
            .createOne();

        // TODO: uns : replace by not to be accepted
        await expect(nftUpdate).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(nftUpdate.id).toBeForged();
        await expect(nftUpdate).toHaveValidNftPersistanceState();
    });

    it("should transfer unik token", async () => {
        const nftId = NftSupport.generateNftId();
        await NftSupport.mintAndWait(nftId);

        const nftTransfer = NftSupport.nftTransferTransaction(nftId, "DQJjUU21VM2tjoHLwupeegv57iX4k7wucx")
            .withNetwork(NftSupport.network)
            .withPassphrase(NftSupport.defaultPassphrase)
            .createOne();

        await expect(nftTransfer).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(nftTransfer.id).toBeForged();
        await expect(nftTransfer).toHaveValidNftPersistanceState();
    });
});
