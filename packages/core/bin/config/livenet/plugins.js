sandbox_config = require("./sandbox-plugins");
sandbox_config["@arkecosystem/core-p2p"].server.port = process.env.CORE_P2P_PORT || 4001;
sandbox_config["@arkecosystem/core-forger"].hosts[0].port = process.env.CORE_P2P_PORT || 4001;
sandbox_config["@foly/socket-event-forwarder"].port = process.env.EVENT_FORWARDER_PORT || 4101;

module.exports = sandbox_config;
