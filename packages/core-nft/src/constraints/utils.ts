export const genesisPropertiesReducer = (acc, current): string[] => {
    // current value is a property entry (a key and a value object containing genesis property)
    const [key, { genesis }] = current;
    // if genesis property of current nft property is true, add it to accumulator
    return genesis ? acc.concat(key) : acc;
};
