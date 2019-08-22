import Boom from "boom";
import Hapi from "hapi";
import { transformerService } from "../../services/transformer";

function paginate(request: Hapi.Request): any {
    const pagination = {
        // @ts-ignore
        offset: (request.query.page - 1) * request.query.limit || 0,
        // @ts-ignore
        limit: request.query.limit || 100,
    };

    // @ts-ignore
    if (request.query.offset) {
        // @ts-ignore
        pagination.offset = request.query.offset;
    }

    return pagination;
}

function respondWithResource(request, data, transformer): any {
    return data ? { data: transformerService.toResource(request, data, transformer) } : Boom.notFound();
}

function respondWithCollection(request, data, transformer): object {
    return {
        data: transformerService.toCollection(request, data, transformer),
    };
}

function respondWithCache(data, h, keepChainMetaOnWithPagination: boolean = false): any {
    const { value, cached } = data;
    const lastModified = cached ? new Date(cached.stored) : new Date();

    if (keepChainMetaOnWithPagination) {
        // hapi-pagination plugin only keeps 'results' (transformed to data) and 'meta' keys. If we want to keep metachain key we have to use h.paginate instead of h.response
        return value.isBoom
            ? h
                  .paginate(
                      { results: value.output.payload.results, chainmeta: value.chainmeta },
                      value.output.payload.totalCount,
                      { key: "results" },
                  )
                  .code(value.output.statusCode)
            : h
                  .paginate({ results: value.results, chainmeta: value.chainmeta }, value.totalCount, {
                      key: "results",
                  })
                  .header("Last-modified", lastModified.toUTCString());
    } else {
        return value.isBoom
            ? h.response(value.output.payload).code(value.output.statusCode)
            : h.response(value).header("Last-modified", lastModified.toUTCString());
    }
}

function toResource(request, data, transformer): object {
    return transformerService.toResource(request, data, transformer);
}

function toCollection(request, data, transformer): object {
    return transformerService.toCollection(request, data, transformer);
}

function toPagination(request, data, transformer): object {
    return {
        results: transformerService.toCollection(request, data.rows, transformer),
        totalCount: data.count,
    };
}

export {
    paginate,
    respondWithResource,
    respondWithCollection,
    respondWithCache,
    toResource,
    toCollection,
    toPagination,
};
