export class CoreError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = "CoreError";
    this.code = code;
    this.details = details;
  }
}

export function networkNotFound(network) {
  return new CoreError(
    `Unknown network: ${network}`,
    "NETWORK_NOT_FOUND",
    { network },
  );
}

export function toolError(message) {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

export function wrapHandler(fn) {
  return async (args) => {
    try {
      return await fn(args);
    } catch (err) {
      const message = err?.response?.body?.message || err?.message || String(err);
      return toolError(message);
    }
  };
}
