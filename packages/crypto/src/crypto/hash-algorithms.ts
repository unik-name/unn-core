import assert from "assert";
let Hash160;
let Hash256;
let RIPEMD160;
let SHA1;
let SHA256;
let useBCrypto = true;
try {
    // tslint:disable
    Hash160 = require("bcrypto").Hash160;
    Hash256 = require("bcrypto").Hash256;
    RIPEMD160 = require("bcrypto").RIPEMD160;
    SHA1 = require("bcrypto").SHA1;
    SHA256 = require("bcrypto").SHA256;
} catch (e) {
    RIPEMD160 = require("ripemd160");
    SHA256 = require("sha.js");
    useBCrypto = false;
    // tslint:enable
}

export class HashAlgorithms {
    public static ripemd160(buffer: Buffer | string): Buffer {
        if (useBCrypto) {
            return RIPEMD160.digest(this.bufferize(buffer));
        } else {
            return this.bufferize(new RIPEMD160().update(this.bufferize(buffer)).digest());
        }
    }

    public static sha1(buffer: Buffer | string): Buffer {
        assert(useBCrypto);
        return SHA1.digest(this.bufferize(buffer));
    }

    public static sha256(buffer: Buffer | string | Buffer[]): Buffer {
        if (Array.isArray(buffer)) {
            let sha256 = useBCrypto ? SHA256.ctx.init() : SHA256("sha256");
            for (const element of buffer) {
                sha256 = sha256.update(element);
            }

            return useBCrypto ? sha256.final() : this.bufferize(sha256.digest());
        } else {
            if (useBCrypto) {
                return SHA256.digest(this.bufferize(buffer));
            } else {
                return this.bufferize(
                    SHA256("sha256")
                        .update(this.bufferize(buffer))
                        .digest(),
                );
            }
        }
    }

    public static hash160(buffer: Buffer | string): Buffer {
        assert(useBCrypto);
        return Hash160.digest(this.bufferize(buffer));
    }

    public static hash256(buffer: Buffer | string): Buffer {
        if (useBCrypto) {
            return Hash256.digest(this.bufferize(buffer));
        } else {
            const hash = this.bufferize(
                SHA256("sha256")
                    .update(this.bufferize(buffer))
                    .digest(),
            );
            return this.bufferize(
                SHA256("sha256")
                    .update(hash)
                    .digest(),
            );
        }
    }

    private static bufferize(buffer: Buffer | string) {
        return buffer instanceof Buffer ? buffer : Buffer.from(buffer);
    }
}
