import { Database, NFT } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import pgPromise = require("pg-promise");
import { isArray } from "util";
import { Repository } from "../../repositories/repository";
import { INftStatus } from "../models";
import { Nft } from "../models/nft";
import { queries } from "../queries";

const { nfts: sql } = queries;
const DEFAULT_UNIK_PROPERTIES = ["type", "explicitValues"];

export class NftsRepository extends Repository implements NFT.INftsRepository {
    // Arguments with types is a protection!
    constructor(protected db: pgPromise.IDatabase<any>, pgp: pgPromise.IMain, options) {
        super(db, pgp, { ...options, estimateTotalCount: false });
    }

    /**
     * Find a nft by its ID.
     * @param  {String} id
     * @return {Promise}
     */
    public async findById(id: string, nftName?: string): Promise<any> {
        if (nftName === "unik") {
            const uniks = await this.getNftsWithProperties([
                { field: "id", operator: Database.SearchOperator.OP_LIKE, value: id },
            ]);
            return uniks.length ? uniks[0] : undefined;
        } else {
            return this.db.oneOrNone(sql.findById, { id });
        }
    }

    /* copy of block-repository search method */
    public async search(parameters: Database.ISearchParameters): Promise<any> {
        if (!parameters.paginate) {
            parameters.paginate = {
                limit: 100,
                offset: 0,
            };
        }

        // Blocks repo atm, doesn't search using any custom parameters
        const parameterList = parameters.parameters.filter(o => o.operator !== Database.SearchOperator.OP_CUSTOM);

        const isUnikRequest: boolean =
            parameters.parameters.filter(
                o => o.operator === Database.SearchOperator.OP_CUSTOM && o.field === "nftName" && o.value === "unik",
            ).length > 0;

        const selectQuery = this.query.select().from(this.query);

        const selectQueryCount = this.query.select(this.query.count().as("cnt")).from(this.query);

        if (isUnikRequest) {
            const nftList = await this.getNftsWithProperties(
                this.getWhereStatementParams(parameterList),
                parameters.paginate,
            );

            const countRow = await this.find(selectQueryCount);
            return {
                rows: nftList,
                count: Number(countRow.cnt),
                countIsEstimate: false,
            };
        }

        this.getWhereStatementParams(parameterList).reduce((sQuery, param, index) => {
            const query: any = this.query[this.propToColumnName(param.field)][param.operator](param.value);
            return index === 0 ? sQuery.where(query) : sQuery.and(query);
        }, selectQuery);

        return this.findManyWithCount(selectQuery, selectQueryCount, parameters.paginate, parameters.orderBy);
    }

    public async status(nftName: string): Promise<INftStatus | undefined> {
        return {
            nftName,
            ...(await this.db.oneOrNone(sql[`${nftName.toLowerCase()}Status`], {})),
        };
    }

    public delete(id: string): Promise<any> {
        return this.db.tx(t => {
            t.batch([t.none(sql.delete, { id }), t.none(sql.deleteProperties, { id })]);
        });
    }

    public updateOwnerId(id: string, newOwnerId: string): Promise<any> {
        return this.db.none(sql.updateOwnerId, { id, newOwnerId });
    }

    /**
     * Add property on nft token
     * @param nftid
     * @param propertyKey
     * @param propertyValue
     */
    public insertProperty(nftid: string, propertyKey: string, propertyValue: string): Promise<any> {
        return this.db.none(sql.insertKey, { nftid, key: propertyKey, value: propertyValue });
    }

    /**
     * Remove property from nft token
     * @param nftid
     * @param propertyKey
     */
    public deletePropertyByKey(nftid: string, propertyKey): Promise<void> {
        return this.db.none(sql.deleteByKey, { nftid, key: propertyKey });
    }

    /**
     * Update nft token property
     * @param nftid
     * @param propertyKey
     * @param propertyValue
     */
    public updateProperty(nftid: string, propertyKey: string, propertyValue: string): Promise<void> {
        return this.db.none(sql.updateProperty, { nftid, key: propertyKey, value: propertyValue });
    }

    /**
     * Inert or update nft token property
     * @param nftid
     * @param propertyKey
     * @param propertyValue
     */
    public insertOrUpdateProperty(nftid: string, propertyKey: string, propertyValue: string): Promise<any> {
        return this.db.none(sql.insertOrUpdateProperty, { nftid, key: propertyKey, value: propertyValue });
    }

    /**
     * Find nft token property by key
     * @param nftid
     * @param propertyKey
     */
    public findPropertyByKey(nftid: string, propertyKey: string): Promise<any> {
        return this.db.oneOrNone(sql.findByKey, { nftid, key: propertyKey });
    }

    public findPropertyBatch(nftids: string[], key: string): Promise<any> {
        return this.db.many(sql.findPropertyBatch, { nftids, key });
    }

    public findProperties(nftid: string): Promise<any> {
        return this.db.any(sql.findProperties, { nftid });
    }

    public async findEdgeTransactions(id: string, nftName: string): Promise<any> {
        return {
            first: {
                ...(await this.db.any(sql.findFirstTransaction, { id, nftName }))[0],
            },
            last: {
                ...(await this.db.any(sql.findLastTransaction, { id, nftName }))[0],
            },
        };
    }

    /**
     * Overrides Repository `truncate` method because this repository manipulates 2 tables (nfts and nftproperties).
     * It's a bad implementation but it works for our needs.
     * Limitations: we can't use Repositories methods (like `insert`, `update`, `query`, `propToColumnName`)
     * because they use `this.model`, which isn't correct for `nftproperties` table requests.
     * TODO: uns : split this repository in two -> NftsRepository and NftPropertiesRepository.
     * Each must implement `getModel` method with their respective models.
     * Then, we won't have to override `truncate` method.
     */
    public async truncate(): Promise<void> {
        await super.truncate();
        await this.db.none(`TRUNCATE nftproperties RESTART IDENTITY`);
    }

    /**
     * Get the model related to this repository.
     * @return {Nft}
     */
    public getModel() {
        return new Nft(this.pgp);
    }

    /**
     * Find all transactions of specified type/group corresponding to a given asset.
     * @param {string} id
     * @param {any} asset
     * @param {string[]} types
     * @param {string} groupType
     * @return {ITransactionData}
     */
    public async findTransactionsByAsset(
        asset: any,
        types: number[],
        typeGroups: number[],
        order: string = "asc",
    ): Promise<Interfaces.ITransactionData[]> {
        return await this.db.manyOrNone(sql.findTransactionsByAsset, {
            asset: JSON.stringify(asset),
            types,
            typeGroups,
            order: order.toUpperCase(),
        });
    }

    private getWhereStatementParams(parameterList: Database.ISearchParameter[]): Database.ISearchParameter[] {
        let whereParams: Database.ISearchParameter[] = [];
        if (parameterList.length) {
            let first;
            do {
                first = parameterList.shift();
                // ignore params whose operator is unknown
            } while (!first.operator && parameterList.length);

            if (first) {
                whereParams = [first, ...parameterList];
            }
        }
        return whereParams;
    }

    private async getNftsWithProperties(
        wheres: Database.ISearchParameter[],
        paginate?: Database.ISearchPaginate,
    ): Promise<any[]> {
        const offset = paginate?.offset || 0;
        const limit = paginate?.limit || 100;

        const queryWheres = wheres.reduce((sQuery, param, index) => {
            const query: any = this.query[this.propToColumnName(param.field)][param.operator](param.value);
            return `${sQuery}${index === 0 ? "where " : " and "}${query.left.property} ${query.operator ||
                param.operator} ${
                isArray(param.value) ? `(${param.value.map(p => `'${p}'`).join(",")})` : `'${param.value}'`
            }`;
        }, "");

        const nftsRows = await this.db.manyOrNone(sql.searchNftsWithProperties, {
            wheres: queryWheres,
            properties: [...DEFAULT_UNIK_PROPERTIES],
            offset,
            limit,
        });
        return this.mapNftsWithProperties(nftsRows);
    }

    private mapNftsWithProperties(nftsRows: any[]): any[] {
        return Object.values(
            nftsRows.reduce((nfts, row) => {
                if (!nfts[row.id]) {
                    nfts[row.id] = {
                        id: row.id,
                        ownerId: row.ownerId,
                        [row.key]: row.value,
                    };
                } else {
                    nfts[row.id][row.key] = row.value;
                }
                return nfts;
            }, {}),
        ).map((nft: any) => {
            if (nft.explicitValues) {
                nft.explicitValues = nft.explicitValues.split(",");
                nft.defaultExplicitValue = nft.explicitValues[0];
            }
            return nft;
        });
    }
}
