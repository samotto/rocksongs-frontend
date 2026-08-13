/**
 * RockSongs environment configuration.
 *
 * Change only DEPLOYMENT_CONFIG when reusing this project. Local development
 * is selected automatically for localhost/127.0.0.1; every other hostname uses
 * the remote API. Set ENVIRONMENT_OVERRIDE to "local" or "remote" only when
 * temporarily testing one environment from the other.
 */
(function configureRockSongs() {
  const DEPLOYMENT_CONFIG = Object.freeze({
    ENVIRONMENT_OVERRIDE: null,
    LOCAL_API_BASE_URL: "http://localhost:8000",
    REMOTE_API_BASE_URL: "https://api-rocksongs.overturegroup.com",
    USE_MOCK_API: false,
    LOCAL_REQUEST_TIMEOUT_MS: 10000,
    REMOTE_REQUEST_TIMEOUT_MS: 15000,
  });

  const localHosts = new Set(["localhost", "127.0.0.1"]);
  const automaticEnvironment = localHosts.has(window.location.hostname) ? "local" : "remote";
  const queryEnvironment = new URLSearchParams(window.location.search).get("api");
  const environmentOverride = ["local", "remote", "proxy"].includes(queryEnvironment)
    ? queryEnvironment
    : DEPLOYMENT_CONFIG.ENVIRONMENT_OVERRIDE;
  const environment = ["local", "remote", "proxy"].includes(environmentOverride)
    ? environmentOverride
    : automaticEnvironment;

  const environments = {
    local: {
      API_BASE_URL: DEPLOYMENT_CONFIG.LOCAL_API_BASE_URL,
      USE_MOCK_API: DEPLOYMENT_CONFIG.USE_MOCK_API,
      REQUEST_TIMEOUT_MS: DEPLOYMENT_CONFIG.LOCAL_REQUEST_TIMEOUT_MS,
    },
    remote: {
      API_BASE_URL: DEPLOYMENT_CONFIG.REMOTE_API_BASE_URL,
      USE_MOCK_API: DEPLOYMENT_CONFIG.USE_MOCK_API,
      REQUEST_TIMEOUT_MS: DEPLOYMENT_CONFIG.REMOTE_REQUEST_TIMEOUT_MS,
    },
    proxy: {
      API_BASE_URL: "/api",
      USE_MOCK_API: DEPLOYMENT_CONFIG.USE_MOCK_API,
      REQUEST_TIMEOUT_MS: DEPLOYMENT_CONFIG.REMOTE_REQUEST_TIMEOUT_MS,
    },
  };

  window.RockSongsConfig = {
    ...environments[environment],
    ENVIRONMENT: environment,
    ...(window.RockSongsConfig || {}),
  };
})();
