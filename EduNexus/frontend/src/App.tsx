import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './store'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Library from './pages/Library'
import DocPage from './pages/DocPage'
import Summarizer from './pages/Summarizer'
import Assistant from './pages/Assistant'
import Voice from './pages/Voice'
import Tools from './pages/Tools'
import Writing from './pages/Writing'
import Planner from './pages/Planner'
import Analytics from './pages/Analytics'
import Feedback from './pages/Feedback'
import SettingsPage from './pages/SettingsPage'
export default function App() {
  const { user, ready } = useApp()
  if (!ready) return <div className="p-10 text-muted">Loading…</div>
  if (!user) return <Auth />
  return <Layout><Routes>
    <Route path="/" element={<Dashboard />} /><Route path="/library" element={<Library />} /><Route path="/library/:id" element={<DocPage />} />
    <Route path="/assistant" element={<Assistant />} /><Route path="/voice" element={<Voice />} /><Route path="/summarizer" element={<Summarizer />} />
    <Route path="/tools" element={<Tools />} /><Route path="/writing" element={<Writing />} /><Route path="/planner" element={<Planner />} />
    <Route path="/analytics" element={<Analytics />} /><Route path="/feedback" element={<Feedback />} /><Route path="/settings" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/" />} />
  </Routes></Layout>
}
