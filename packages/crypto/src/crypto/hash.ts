let secp256k1;
let schnorr;
let BigInteger;
let useBcrypto = true;
try {
    // tslint:disable
    secp256k1 = require("bcrypto").secp256k1;
} catch (e) {
    BigInteger = require("bigi");
    schnorr = require("bip-schnorr");
    const EC = require("elliptic").ec;
    // tslint:enable
    secp256k1 = new EC("secp256k1");
    useBcrypto = false;
}

import { IKeyPair } from "../interfaces";

export class Hash {
    public static signECDSA(hash: Buffer, keys: IKeyPair): string {
        if (useBcrypto) {
            return secp256k1.signatureExport(secp256k1.sign(hash, Buffer.from(keys.privateKey, "hex"))).toString("hex");
        } else {
            const keysPair = secp256k1.keyFromPrivate(keys.privateKey, "hex");
            const signature = secp256k1.sign(hash, keysPair.priv, "hex");
            return signature.toDER("hex");
        }
    }

    public static verifyECDSA(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        if (useBcrypto) {
            return secp256k1.verify(
                hash,
                secp256k1.signatureImport(signature instanceof Buffer ? signature : Buffer.from(signature, "hex")),
                publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex"),
            );
        } else {
            const keysPair = secp256k1.keyFromPublic(publicKey, "hex");
            return secp256k1.verify(hash, signature, keysPair.pub, "hex");
        }
    }

    public static signSchnorr(hash: Buffer, keys: IKeyPair): string {
        if (useBcrypto) {
            return secp256k1.schnorrSign(hash, Buffer.from(keys.privateKey, "hex")).toString("hex");
        } else {
            const privateKey = BigInteger.fromHex(keys.privateKey);
            return schnorr.sign(privateKey, hash).toString("hex");
        }
    }

    public static verifySchnorr(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        const signatureBuf: Buffer = signature instanceof Buffer ? signature : Buffer.from(signature, "hex");
        const publicKeyBuf: Buffer = publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex");
        if (useBcrypto) {
            return secp256k1.schnorrVerify(hash, signatureBuf, publicKeyBuf);
        } else {
            try {
                schnorr.verify(publicKeyBuf, hash, signatureBuf);
                return true;
            } catch (e) {
                return false;
            }
        }
    }
}
