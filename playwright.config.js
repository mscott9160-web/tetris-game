const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:4175' },
  webServer: { command: 'python3 -m http.server 4175', port: 4175, reuseExistingServer: true },
});
