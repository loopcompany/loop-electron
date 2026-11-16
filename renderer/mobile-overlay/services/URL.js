// Web deployments route /api and /storage through the same reverse proxy.
const webOrigin = typeof window !== 'undefined' && /^https?:$/.test(window.location?.protocol) ? window.location.origin : null;
export const mainUri = process.env.EXPO_PUBLIC_API_URL || webOrigin || 'https://clpiran.com';
export const uri = mainUri.replace(/\/$/, '') + '/api';
export const termsPdfUrl = mainUri + '/assets/guid/loop-service-terms.pdf';
export const imageUri = mainUri.replace(/\/$/, '') + '/storage';
