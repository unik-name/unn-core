/*ts-lint:disable:interface-over-type-literal*/
export interface ICertificationable {
    sub: string;
    iss: string;
    iat: number;
}

export interface ICertifiedDemand<T extends ICertificationable> {
    payload: T;
    signature: string;
}
