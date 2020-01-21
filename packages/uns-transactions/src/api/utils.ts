import * as Hapi from "@hapi/hapi";

export const isResponse = (response: any): response is Hapi.ResponseObject => !response.isBoom;
