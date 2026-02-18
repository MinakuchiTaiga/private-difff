import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "inject-csp",
      transformIndexHtml(html, context) {
        const isDev = context.server !== undefined;
        const connectSrc = isDev
          ? "'self' ws://127.0.0.1:* ws://localhost:* http://127.0.0.1:* http://localhost:*"
          : "'self'";
        const csp = [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self'",
          `connect-src ${connectSrc}`,
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; ");
        return html.replace("__APP_CSP__", csp);
      },
    },
  ],
});
