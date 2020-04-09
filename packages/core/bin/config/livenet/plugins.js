import * as sandbox_config from "../sandbox/plugins";

sandbox_config["@arkecosystem/core-p2p"].server.port = process.env.CORE_P2P_PORT || 4001;
sandbox_config["@arkecosystem/core-forger"].hosts[0].port = process.env.CORE_P2P_PORT || 4001;

module.exports = sandbox_config;
