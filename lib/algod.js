import algosdk from "algosdk";
import { getAlgod } from "./networks.js";
import { jsonResult } from "./normalize.js";

export async function getNetworkStatus({ network }) {
  const algod = getAlgod(network);
  const status = await algod.status().do();
  return jsonResult(status);
}

export async function getSuggestedParams({ network }) {
  const algod = getAlgod(network);
  const params = await algod.getTransactionParams().do();
  return jsonResult(params);
}

export async function getBlock({ network, round }) {
  const algod = getAlgod(network);
  const block = await algod.block(round).do();
  return jsonResult(block);
}

export async function getAccount({ network, address }) {
  const algod = getAlgod(network);
  const info = await algod.accountInformation(address).do();
  return jsonResult(info);
}

export async function getAsset({ network, assetId }) {
  const algod = getAlgod(network);
  const info = await algod.getAssetByID(assetId).do();
  return jsonResult(info);
}

export async function getApplication({ network, appId }) {
  const algod = getAlgod(network);
  const info = await algod.getApplicationByID(appId).do();
  return jsonResult(info);
}

export async function getApplicationBoxes({ network, appId, maxBoxes }) {
  const algod = getAlgod(network);
  let req = algod.getApplicationBoxes(appId);
  if (maxBoxes) req = req.max(maxBoxes);
  const boxes = await req.do();
  return jsonResult(boxes);
}

export async function getApplicationBox({ network, appId, boxName }) {
  const algod = getAlgod(network);
  const nameBytes = new Uint8Array(Buffer.from(boxName, "base64"));
  const box = await algod.getApplicationBoxByName(appId, nameBytes).do();
  return jsonResult(box);
}

export async function getPendingTransaction({ network, txId }) {
  const algod = getAlgod(network);
  const info = await algod.pendingTransactionInformation(txId).do();
  return jsonResult(info);
}

export async function decodeTransaction({ txnBytes }) {
  const bytes = new Uint8Array(Buffer.from(txnBytes, "base64"));
  const txn = algosdk.decodeUnsignedTransaction(bytes);
  return jsonResult(txnToJson(txn));
}

export async function decodeSignedTransaction({ txnBytes }) {
  const bytes = new Uint8Array(Buffer.from(txnBytes, "base64"));
  const stxn = algosdk.decodeSignedTransaction(bytes);
  const result = {};
  if (stxn.txn) result.txn = txnToJson(stxn.txn);
  if (stxn.sig) result.sig = Buffer.from(stxn.sig).toString("base64");
  if (stxn.lsig) result.lsig = stxn.lsig;
  if (stxn.msig) result.msig = stxn.msig;
  if (stxn.sgnr) result.sgnr = stxn.sgnr;
  return jsonResult(result);
}

export async function simulateTransactions({ network, txnBytes }) {
  const algod = getAlgod(network);
  const decoded = txnBytes.map((b) => {
    return new Uint8Array(Buffer.from(b, "base64"));
  });
  const request = new algosdk.modelsv2.SimulateRequest({
    txnGroups: [
      new algosdk.modelsv2.SimulateRequestTransactionGroup({
        txns: decoded.map((d) => algosdk.decodeObj(d)),
      }),
    ],
    allowUnnamedResources: true,
    allowEmptySignatures: true,
  });
  const result = await algod.simulateTransactions(request).do();
  return jsonResult(result);
}

export async function compileTeal({ network, source }) {
  const algod = getAlgod(network);
  const result = await algod.compile(source).do();
  return jsonResult(result);
}

export async function disassembleTeal({ network, bytecode }) {
  const algod = getAlgod(network);
  const bytes = new Uint8Array(Buffer.from(bytecode, "base64"));
  const result = await algod.disassemble(bytes).do();
  return jsonResult(result);
}

// --- Transaction Builders ---

export async function paymentTxn({ network, sender, receiver, amount, note }) {
  const algod = getAlgod(network);
  const params = await algod.getTransactionParams().do();

  const microAmount = Math.round(parseFloat(amount) * 1_000_000);
  if (!Number.isFinite(microAmount) || microAmount < 0) {
    throw new Error(`Invalid amount: "${amount}". Must be a non-negative number.`);
  }

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender,
    receiver,
    amount: microAmount,
    suggestedParams: params,
    ...(note && { note: new TextEncoder().encode(note) }),
  });

  const encoded = algosdk.encodeUnsignedTransaction(txn);
  const b64 = Buffer.from(encoded).toString("base64");

  return jsonResult({
    txns: [b64],
    summary: {
      type: "pay",
      sender,
      receiver,
      amount,
      unit: "ALGO/VOI",
    },
  });
}

export async function assetTransferTxn({ network, sender, receiver, assetId, amount, note }) {
  const algod = getAlgod(network);
  const params = await algod.getTransactionParams().do();

  const baseAmount = Number(BigInt(amount));

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender,
    receiver,
    assetIndex: assetId,
    amount: baseAmount,
    suggestedParams: params,
    ...(note && { note: new TextEncoder().encode(note) }),
  });

  const encoded = algosdk.encodeUnsignedTransaction(txn);
  const b64 = Buffer.from(encoded).toString("base64");

  return jsonResult({
    txns: [b64],
    summary: {
      type: "axfer",
      sender,
      receiver,
      amount,
      assetId,
    },
  });
}

export async function assetOptinTxn({ network, sender, assetId }) {
  const algod = getAlgod(network);
  const params = await algod.getTransactionParams().do();

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender,
    receiver: sender,
    assetIndex: assetId,
    amount: 0,
    suggestedParams: params,
  });

  const encoded = algosdk.encodeUnsignedTransaction(txn);
  const b64 = Buffer.from(encoded).toString("base64");

  return jsonResult({
    txns: [b64],
    summary: {
      type: "axfer",
      sender,
      receiver: sender,
      amount: "0",
      assetId,
    },
  });
}

function txnToJson(txn) {
  const obj = txn.get_obj_for_encoding();
  return obj;
}
