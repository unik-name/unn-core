import BigNumber from "bignumber.js";
import { SATOSHI } from "./constants";
import { configManager } from "./managers";
import { IBlockData, ITransactionData } from "./models";

class Bignum extends BigNumber {
    public static readonly ZERO = new BigNumber(0);
    public static readonly ONE = new BigNumber(1);
}

Bignum.config({ DECIMAL_PLACES: 0 });

/**
 * Get human readable string from satoshis
 */
export function formatSatoshi(amount: Bignum | number | string): string {
    const localeString = (+amount / SATOSHI).toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8,
    });

    return `${localeString} ${configManager.config.client.symbol}`;
}

/**
 * Check if the given block or transaction id is an exception.
 */
export function isException(blockOrTransaction: IBlockData | ITransactionData): boolean {
    return ["blocks", "transactions"].some(key => {
        const exceptions = configManager.get(`exceptions.${key}`);
        return Array.isArray(exceptions) && exceptions.includes(blockOrTransaction.id);
    });
}

/**
 * Sort transactions by type, then id.
 */
export function sortTransactions(transactions: ITransactionData[]): ITransactionData[] {
    return transactions.sort((a, b) => {
        if (a.type < b.type) {
            return -1;
        }

        if (a.type > b.type) {
            return 1;
        }

        if (a.id < b.id) {
            return -1;
        }

        if (a.id > b.id) {
            return 1;
        }

        return 0;
    });
}

export function chunk(value: string, size: number): string[] {
    return value.match(new RegExp(`.{1,${size}}`, "g"));
}

export function bignumToUnicode(identifier: Bignum): string {
    return chunk(identifier.toString(16), 2)
        .map(charCodeHex => parseInt(charCodeHex, 16))
        .map(charCode => String.fromCharCode(charCode))
        .join("");
}

export function unicodeToBignum(unicode: string): Bignum {
    return new Bignum(
        unicode
            .split("")
            .map(char => char.charCodeAt(0))
            .map(charCode => charCode.toString(16))
            .map(charCodeHex => charCodeHex.padStart(2, "0"))
            .join(""),
        16,
    );
}

export { Bignum };
