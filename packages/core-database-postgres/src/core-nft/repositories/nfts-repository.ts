import { Database, NFT } from "@arkecosystem/core-interfaces";
import { Repository } from "../../repositories/repository";
import { Nft } from "../models/nft";
import { queries } from "../queries";

const { nfts: sql } = queries;

export class NftsRepository extends Repository implements NFT.INftsRepository {
    /**
     * Find a nft by its ID.
     * @param  {String} id
     * @return {Promise}
     */
    public async findById(id) {
        return this.db.oneOrNone(sql.findById, { id });
    }

    /* copy of block-repository search method */
    public async search(parameters: Database.ISearchParameters) {
        if (!parameters.paginate) {
            parameters.paginate = {
                limit: 100,
                offset: 0,
            };
        }
        const selectQuery = this.query.select().from(this.query);
        const selectQueryCount = this.query.select(this.query.count().as("cnt")).from(this.query);
        // Blocks repo atm, doesn't search using any custom parameters
        const parameterList = parameters.parameters.filter(o => o.operator !== Database.SearchOperator.OP_CUSTOM);
        if (parameterList.length) {
            let first;
            do {
                first = parameterList.shift();
                // ignore params whose operator is unknown
            } while (!first.operator && parameterList.length);

            if (first) {
                selectQuery.where(this.query[this.propToColumnName(first.field)][first.operator](first.value));
                for (const param of parameterList) {
                    selectQuery.and(this.query[this.propToColumnName(param.field)][param.operator](param.value));
                }
            }
        }

        return this.findManyWithCount(selectQuery, selectQueryCount, parameters.paginate, parameters.orderBy);
    }

    public delete(id: string) {
        this.db.tx(t => {
            t.batch([t.none(sql.delete, { id }), t.none(sql.deleteProperties, { id })]);
        });
        return this.db;
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
     * Find nft token property by key
     * @param nftid
     * @param propertyKey
     */
    public findPropertyByKey(nftid: string, propertyKey: string): Promise<any> {
        return this.db.oneOrNone(sql.findByKey, { nftid, key: propertyKey });
    }

    public findProperties(nftid: string): Promise<any> {
        return this.db.any(sql.findProperties, { nftid });
    }

    public async findEdgeTransactions(id: string, nftName: string): Promise<any> {
        return {
            first: {
                id: await this.db.any(sql.findFirstTransaction, { id, nftName }),
            },
            last: {
                id: await this.db.any(sql.findLastTransaction, { id, nftName }),
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
}
