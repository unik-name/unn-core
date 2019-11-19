/**
 * Returns number 1 byte for key buffer number, key buffer bytes number size, 1 byte for value buffer number and value buffer bytes number size of each property.
 * @param properties
 */
export const computePropertiesSize = (properties: { [_: string]: string }): number => {
    let size = 0;
    const keys = Object.keys(properties);

    for (const propertyKey of keys) {
        const value = properties[propertyKey];
        let valueBytes;
        let valueLength = 0;
        if (value || value === "") {
            valueBytes = Buffer.from(value, "utf8");
            valueLength = valueBytes.length;
        }
        const keyBytes = Buffer.from(propertyKey, "utf8");
        size +=
            1 + // keyBytes length
            keyBytes.length + // keyBytes length value
            1 + // valueBytes length
            valueLength; // value
    }
    return size;
};
