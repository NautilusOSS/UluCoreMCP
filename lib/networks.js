import algosdk from "algosdk";
import config from "./config.js";
import { networkNotFound } from "./errors.js";

const algodClients = {};
const indexerClients = {};

function getNetworkConfig(network) {
  const net = config.networks[network];
  if (!net) throw networkNotFound(network);
  return net;
}

export function getAlgod(network) {
  if (!algodClients[network]) {
    const net = getNetworkConfig(network);
    algodClients[network] = new algosdk.Algodv2(
      net.algodToken || "",
      net.algodUrl,
      "",
    );
  }
  return algodClients[network];
}

export function getIndexer(network) {
  if (!indexerClients[network]) {
    const net = getNetworkConfig(network);
    indexerClients[network] = new algosdk.Indexer(
      net.indexerToken || "",
      net.indexerUrl,
      "",
    );
  }
  return indexerClients[network];
}

export function listNetworks() {
  return Object.keys(config.networks);
}
