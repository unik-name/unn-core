import * as Hapi from "@hapi/hapi";

export interface IRoute {
    method: string;
    path: string;
}

export class IRoutesManager {
    private routes: IRoute[];

    constructor(routes: IRoute[]) {
        this.routes = routes;
    }

    public isValidRoute(request: Hapi.Request): boolean {
        const { method, path } = request.route;
        return this.routes.find(route => route.method === method && route.path === path) !== undefined;
    }
}
