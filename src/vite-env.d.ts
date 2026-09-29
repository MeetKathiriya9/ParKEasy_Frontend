/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL for the ParkEasy API.
   *
   * Leave empty (or `/`) to use the Vite dev proxy defined in `vite.config.ts`,
   * which forwards `/api` and `/ws` to the FastAPI backend. Set an absolute URL
   * such as `http://127.0.0.1:9999` to bypass the proxy.
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
