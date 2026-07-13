const apiBase = window.location.hostname;

export const environment = {
  production: false,
  apiUrl: `http://${apiBase}:3000/api`,
  idleTimeout: 1800,
};
