interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

// This project does not use D1 yet; keep a placeholder for generated Worker types.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface D1Database {}

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
  };
}
