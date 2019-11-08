export const defaults = {
    logLevel: process.env.CORE_LOG_LEVEL || "info",
    config: {
        displayDate: true,
        displayTimestamp: true,
        displayBadge: false,
    },
    types: {
        info: {
            color: "green",
        },
        debug: {
            color: "cyan",
        },
    },
};
