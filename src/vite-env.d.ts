/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the RankPulse API, e.g. https://api.example.com/api/v1. Unset = mock data. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
