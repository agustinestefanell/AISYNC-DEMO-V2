/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTACT_SHEET_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
