import { Database } from "@arkecosystem/core-interfaces";
import { NftsBusinessRepository } from "../../../../packages/core-database/src/repositories/nfts-business-repository";
import { INft } from "../../../../packages/uns-crypto/";
import { DatabaseConnectionStub } from "../__fixtures__/database-connection-stub";
import { MockDatabaseModel } from "../__fixtures__/mock-database-model";

describe("Transactions Business Repository", () => {
    let nftsBusinessRepository: Database.INftsBusinessRepository;
    let databaseService: Database.IDatabaseService;

    beforeEach(() => {
        nftsBusinessRepository = new NftsBusinessRepository(() => databaseService);
        databaseService = {
            connection: new DatabaseConnectionStub(),
        } as Database.IDatabaseService;
    });

    describe("findById", () => {
        it("should invoke findById on db repository", async () => {
            databaseService.connection.nftsRepository = {
                findById: async args => args,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.nftsRepository, "findById").mockImplementation(
                async () =>
                    ({
                        id: "TokenId",
                        ownerId: "OwnerId",
                    } as INft),
            );

            await nftsBusinessRepository.findById("id");

            expect(databaseService.connection.nftsRepository.findById).toHaveBeenCalledWith("id");
        });
    });

    describe("findProperties", () => {
        it("should invoke findProperties on db repository", async () => {
            databaseService.connection.nftsRepository = {
                findProperties: async args => args,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.nftsRepository, "findProperties").mockImplementation(
                async () => [] as any,
            );
            await nftsBusinessRepository.findProperties("id");

            expect(databaseService.connection.nftsRepository.findProperties).toHaveBeenCalledWith("id");
        });
    });

    describe("findProperty", () => {
        it("should invoke findProperty on db repository", async () => {
            const key = "propKey";
            databaseService.connection.nftsRepository = {
                findPropertyByKey: async args => args,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.nftsRepository, "findPropertyByKey").mockImplementation(
                async () => "value" as string,
            );
            await nftsBusinessRepository.findProperty("id", key);

            expect(databaseService.connection.nftsRepository.findPropertyByKey).toHaveBeenCalledWith("id", key);
        });
    });

    describe("search", () => {
        it("should invoke search on db repository", async () => {
            databaseService.connection.nftsRepository = {
                search: async args => args,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.nftsRepository, "search").mockImplementation(async () => ({
                rows: [],
                count: 0,
            }));

            await nftsBusinessRepository.search({
                id: "id",
                offset: 10,
                limit: 1000,
                orderBy: "id:asc",
            });

            expect(databaseService.connection.nftsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "id",
                            operator: expect.anything(),
                            value: "id",
                        },
                    ],
                    paginate: {
                        offset: 10,
                        limit: 1000,
                    },
                    orderBy: expect.arrayContaining([
                        {
                            field: "id",
                            direction: "asc",
                        },
                    ]),
                }),
            );
        });
    });
});
