declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    GITHUB_OWNER?: string;
    GITHUB_REPO?: string;
    GITHUB_APP_CLIENT_ID?: string;
    GITHUB_APP_INSTALLATION_ID?: string;
    GITHUB_APP_PRIVATE_KEY?: string;
  }
}
