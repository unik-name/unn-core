/**
 * Code from http://www.typescriptlang.org/docs/handbook/mixins.html
 */
export const applyMixins = (derivedCtor: any, baseCtors: any[]) => {
    for (const baseCtor of baseCtors) {
        for (const name of Object.getOwnPropertyNames(baseCtor.prototype)) {
            Object.defineProperty(
                derivedCtor.prototype,
                name,
                Object.getOwnPropertyDescriptor(baseCtor.prototype, name),
            );
        }
    }
};
