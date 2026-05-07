/** Same env name as tarefas-frontend; defaults to local Rails API. */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_APP_API_URL || 'http://localhost:3000'
}
