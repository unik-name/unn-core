const errorMapper = {
    "Cold wallet is not allowed to send until receiving transaction is confirmed.":
        "Wallet balance is too low to process transaction.",
    // Add here error message transformations
};

/*
errorObject format:
{ '7bf3221b3867ba3958cf77b11f39af3664ed2e896d309e2e269f96e7194045b4':
    [
        {
            type: 'ERR_APPLY',
            message: '["Cold wallet is not allowed to send until receiving transaction is confirmed."]'
        }
    ]
}
*/
export const handleErrors = (errorObject: any): any => {
    // Loop on each transaction
    for (const txId of Object.keys(errorObject)) {
        const errors: any[] = [];
        // Loop on each transaction error type/message object
        for (const error of errorObject[txId]) {
            error.message = getMappedError(error.message);
            errors.push(error);
        }
        errorObject[txId] = errors;
    }
    return errorObject;
};

/**
 * Replaces all mapped errors in the string representing array or errors
 * @param errorsArrayString
 */
const getMappedError = (errorsAsStringArray: string): string => {
    if (errorsAsStringArray) {
        for (const errorKey of Object.keys(errorMapper)) {
            errorsAsStringArray = errorsAsStringArray.replace(
                errorKey,
                `${errorMapper[errorKey]} (original error: ${errorKey})`,
            );
        }
    }
    return errorsAsStringArray;
};
