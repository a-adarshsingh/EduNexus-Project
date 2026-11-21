import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, setToken, getToken } from './api'
import { tr } from './i18n'
const Ctx = createContext<any>(null)
export const useApp = () => useContext(Ctx)
export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null); const [ready, setReady] = useState(false)
  useEffect(() => { if (getToken()) api('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setReady(true)); else setReady(true) }, [])
  const lang = user?.interface_language || localStorage.getItem('lang') || 'en'
  const theme = user?.theme || localStorage.getItem('theme') || 'light'
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr' }, [theme, lang])
  const value = {
    user, ready, lang, theme, t: (k: string) => tr(lang, k),
    login: (d: any) => { setToken(d.token); setUser(d.user) }, logout: () => { setToken(null); setUser(null) },
    update: async (p: any) => { const u = await api('/auth/profile', { method: 'PATCH', body: p }); setUser(u); return u },
    guest: (p: { lang?: string; theme?: string }) => { if (p.lang) localStorage.setItem('lang', p.lang); if (p.theme) localStorage.setItem('theme', p.theme); setUser((u: any) => u) ; document.documentElement.dataset.theme = p.theme || theme } }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
