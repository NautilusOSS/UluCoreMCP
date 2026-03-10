import { getIndexer } from "./networks.js";
import { jsonResult } from "./normalize.js";

export async function getTransaction({ network, txId }) {
  const indexer = getIndexer(network);
  const result = await indexer.lookupTransactionByID(txId).do();
  return jsonResult(result);
}

export async function searchTransactions({ network, ...filters }) {
  const indexer = getIndexer(network);
  let query = indexer.searchForTransactions();

  if (filters.address) query = query.address(filters.address);
  if (filters.addressRole) query = query.addressRole(filters.addressRole);
  if (filters.assetId) query = query.assetID(filters.assetId);
  if (filters.applicationId) query = query.applicationID(filters.applicationId);
  if (filters.minRound) query = query.minRound(filters.minRound);
  if (filters.maxRound) query = query.maxRound(filters.maxRound);
  if (filters.afterTime) query = query.afterTime(filters.afterTime);
  if (filters.beforeTime) query = query.beforeTime(filters.beforeTime);
  if (filters.txType) query = query.txType(filters.txType);
  if (filters.limit) query = query.limit(filters.limit);
  if (filters.next) query = query.nextToken(filters.next);

  const result = await query.do();
  return jsonResult(result);
}

export async function getTransactionGroup({ network, txId }) {
  const indexer = getIndexer(network);
  const txResult = await indexer.lookupTransactionByID(txId).do();
  const tx = txResult.transaction;

  if (!tx.group) {
    return jsonResult({ transactions: [tx] });
  }

  const groupId = tx.group;
  const round = tx["confirmed-round"];

  let query = indexer.searchForTransactions().round(round);
  const roundResult = await query.do();
  const grouped = (roundResult.transactions || []).filter(
    (t) => t.group === groupId,
  );

  return jsonResult({ groupId, transactions: grouped });
}
