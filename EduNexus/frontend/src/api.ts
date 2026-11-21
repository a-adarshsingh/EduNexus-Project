let token: string | null = localStorage.getItem('token')
export const getToken = () => token
export function setToken(t: string | null) { token = t; t ? localStorage.setItem('token', t) : localStorage.removeItem('token') }
export async function api(path: string, o: { method?: string; body?: any; form?: FormData } = {}) {
  const headers: any = {}; if (token) headers.Authorization = `Bearer ${token}`
  let body: any; if (o.form) body = o.form; else if (o.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(o.body) }
  let r: Response
  try { r = await fetch('/api' + path, { method: o.method || 'GET', headers, body }) }
  catch { throw new Error('Cannot reach the EduNexus server. Is the backend running?') }
  if (r.status === 204) return null
  const data = await r.json().catch(() => null)
  if (!r.ok) {
    if (r.status === 401 && token && !path.startsWith('/auth/login')) { setToken(null); location.reload() }
    const d = data?.detail
    throw new Error(typeof d === 'string' ? d : Array.isArray(d) ? d.map((x: any) => x.msg).join('; ') : 'Request failed')
  }
  return data
}
