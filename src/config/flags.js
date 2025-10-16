// src/config/flags.js
export const SELLER_HYDRATE_ENABLED =
  (process.env.REACT_APP_SELLER_HYDRATE_ENABLED ?? 'true') === 'true';