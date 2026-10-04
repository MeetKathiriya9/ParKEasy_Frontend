/**
 * API endpoint paths, one entry per route group in the requirements document
 * section 21. Keeping them here (rather than inline in components) means a
 * backend path change touches one file.
 *
 * The values are relative because the Vite dev server proxies `/api` to the
 * FastAPI backend (see `vite.config.ts`), which also sidesteps CORS in dev.
 */

const API_PREFIX = '/api/v1';

export const endpoints = {
  // --- Health ---
  health: `${API_PREFIX}/health`,
  healthDb: `${API_PREFIX}/health/db`,

  // --- Authentication ---
  auth: {
    register: `${API_PREFIX}/auth/register`,
    login: `${API_PREFIX}/auth/login`,
    logout: `${API_PREFIX}/auth/logout`,
    me: `${API_PREFIX}/auth/me`,
    forgotPassword: `${API_PREFIX}/auth/forgot-password`,
    resetPassword: `${API_PREFIX}/auth/reset-password`,
    changePassword: `${API_PREFIX}/auth/change-password`,
  },

  // --- Users & vehicles ---
  users: {
    me: `${API_PREFIX}/users/me`,
    updateMe: `${API_PREFIX}/users/me`,
  },
  vehicles: {
    list: `${API_PREFIX}/vehicles`,
    create: `${API_PREFIX}/vehicles`,
    update: (id: string) => `${API_PREFIX}/vehicles/${id}`,
    remove: (id: string) => `${API_PREFIX}/vehicles/${id}`,
    setDefault: (id: string) => `${API_PREFIX}/vehicles/${id}/default`,
  },

  // --- Parking discovery ---
  parking: {
    nearby: `${API_PREFIX}/parking/nearby`,
    search: `${API_PREFIX}/parking/search`,
    detail: (id: string) => `${API_PREFIX}/parking/${id}`,
    availability: (id: string) => `${API_PREFIX}/parking/${id}/availability`,
  },
  spaces: {
    list: `${API_PREFIX}/spaces`,
    updateStatus: (id: string) => `${API_PREFIX}/spaces/${id}/status`,
  },

  // --- Reservation & session ---
  reservations: {
    list: `${API_PREFIX}/reservations`,
    create: `${API_PREFIX}/reservations`,
    detail: (id: string) => `${API_PREFIX}/reservations/${id}`,
    cancel: (id: string) => `${API_PREFIX}/reservations/${id}/cancel`,
    checkIn: (id: string) => `${API_PREFIX}/reservations/${id}/check-in`,
    checkOut: (id: string) => `${API_PREFIX}/reservations/${id}/check-out`,
    receipt: (id: string) => `${API_PREFIX}/reservations/${id}/receipt`,
  },
  sessions: {
    active: `${API_PREFIX}/sessions/active`,
    extend: (id: string) => `${API_PREFIX}/sessions/${id}/extend`,
    close: (id: string) => `${API_PREFIX}/sessions/${id}/close`,
  },

  // --- Money ---
  payments: {
    list: `${API_PREFIX}/payments`,
    create: `${API_PREFIX}/payments`,
    verify: (id: string) => `${API_PREFIX}/payments/${id}/verify`,
    refund: (id: string) => `${API_PREFIX}/payments/${id}/refund`,
  },
  pricing: {
    rules: `${API_PREFIX}/pricing/rules`,
    createRule: `${API_PREFIX}/pricing/rules`,
    updateRule: (id: string) => `${API_PREFIX}/pricing/rules/${id}`,
    preview: `${API_PREFIX}/pricing/preview`,
  },

  // --- Operations ---
  violations: {
    list: `${API_PREFIX}/violations`,
    create: `${API_PREFIX}/violations`,
    resolve: (id: string) => `${API_PREFIX}/violations/${id}/resolve`,
  },
  ev: {
    chargers: `${API_PREFIX}/ev/chargers`,
    sessions: `${API_PREFIX}/ev/sessions`,
  },
  notifications: {
    list: `${API_PREFIX}/notifications`,
    markRead: (id: string) => `${API_PREFIX}/notifications/${id}/read`,
    markAllRead: `${API_PREFIX}/notifications/read-all`,
  },
  reviews: {
    list: `${API_PREFIX}/reviews`,
    create: `${API_PREFIX}/reviews`,
  },
  complaints: {
    list: `${API_PREFIX}/complaints`,
    create: `${API_PREFIX}/complaints`,
    assign: (id: string) => `${API_PREFIX}/complaints/${id}/assign`,
    resolve: (id: string) => `${API_PREFIX}/complaints/${id}/resolve`,
    escalate: (id: string) => `${API_PREFIX}/complaints/${id}/escalate`,
  },

  // --- Intelligence & insight ---
  analytics: {
    occupancy: `${API_PREFIX}/analytics/occupancy`,
    revenue: `${API_PREFIX}/analytics/revenue`,
    peakHours: `${API_PREFIX}/analytics/peak-hours`,
    utilization: `${API_PREFIX}/analytics/utilization`,
  },
  recommendations: {
    parking: `${API_PREFIX}/recommendations/parking`,
  },
  predictions: {
    availability: `${API_PREFIX}/predictions/availability`,
  },
  events: {
    list: `${API_PREFIX}/events`,
    create: `${API_PREFIX}/events`,
    update: (id: string) => `${API_PREFIX}/events/${id}`,
  },

  // --- Platform ---
  admin: {
    metrics: `${API_PREFIX}/admin/metrics`,
    config: `${API_PREFIX}/admin/config`,
    updateConfig: `${API_PREFIX}/admin/config`,
    auditLogs: `${API_PREFIX}/admin/audit-logs`,
  },
} as const;

/** Real-time channel (backend section 26). */
export const WS_URL = '/ws';

export type Endpoints = typeof endpoints;
