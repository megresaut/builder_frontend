import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.reasonableautomations.ravm",
  appName: "RA Field",
  webDir: "client/dist/spa",
  server: {
    // FTO routes need authenticated access; login page lives at /login and
    // redirects field_team_member role to /fto automatically.
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
