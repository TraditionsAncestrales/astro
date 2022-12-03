/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly MAILCHIMP_API_KEY: string;
  readonly MAILCHIMP_SERVER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}