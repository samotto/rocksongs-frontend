/**
 * RockSongs environment configuration.
 *
 * Local development is selected automatically for localhost/127.0.0.1.
 * All other hosts use the remote configuration. After Railway assigns the
 * backend domain, replace REMOTE_API_BASE_URL below; no application code needs
 * to change.
 */
(function configureRockSongs() {
  const REMOTE_API_BASE_URL = "https://rocksongs-production.up.railway.app";
  // Run the local frontend against the Railway backend for integration testing.
  const ENVIRONMENT_OVERRIDE = "remote";
  const localHosts = new Set(["localhost", "127.0.0.1"]);
  const automaticEnvironment = localHosts.has(window.location.hostname) ? "local" : "remote";
  const environment = ["local", "remote"].includes(ENVIRONMENT_OVERRIDE)
    ? ENVIRONMENT_OVERRIDE
    : automaticEnvironment;

  const environments = {
    local: {
      API_BASE_URL: "http://localhost:8000",
      USE_MOCK_API: false,
      REQUEST_TIMEOUT_MS: 10000,
    },
    remote: {
      API_BASE_URL: REMOTE_API_BASE_URL,
      USE_MOCK_API: false,
      REQUEST_TIMEOUT_MS: 15000,
    },
  };

  window.RockSongsConfig = {
    ...environments[environment],
    ENVIRONMENT: environment,
    ...(window.RockSongsConfig || {}),
  };
})();
