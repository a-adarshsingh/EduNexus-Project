import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { api } from '../api'
import { useApp } from '../store'
import { LANGS } from '../i18n'
import Orb from '../components/Orb'
import { Err } from '../components/ui'
const PROF = ['Student', 'Teacher', 'Professor', 'Researcher', 'Writer', 'Working Professional', 'Other']
const Req = () => <sup className="ms-0.5 font-bold" style={{ color: '#ef4444', fontSize: '1rem' }} aria-label="required">*</sup>
const Lbl = ({ t, req }: { t: string; req?: boolean }) => <label className="block text-xs font-medium text-muted mb-1 mt-1">{t}{req ? <Req /> : <span className="ms-1 opacity-70">(optional)</span>}</label>
function Pw({ value, onChange, ph, auto }: { value: string; onChange: (e: any) => void; ph: string; auto: string }) {
  const [show, setShow] = useState(false)
  return <div className="relative"><input className="input !pe-10" type={show ? 'text' : 'password'} placeholder={ph} value={value} onChange={onChange} required autoComplete={auto} />
    <button type="button" className="absolute end-3 top-1/2 -translate-y-1/2 text-muted" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
}
export default function Auth() {
  const { login, guest } = useApp(); const [reg, setReg] = useState(false); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const [f, setF] = useState<any>({ full_name: '', email: '', password: '', confirm_password: '', profession: 'Student', course: '', institution: '', interests: '', interface_language: localStorage.getItem('lang') || 'en' })
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  const submit = async (e: any) => {
    e.preventDefault(); setErr(''); setBusy(true)
    const email = f.email.trim()
    try { login(await api(reg ? '/auth/register' : '/auth/login', { method: 'POST', body: reg ? { ...f, full_name: f.full_name.trim(), email, institution: f.institution || null, interests: f.interests || null } : { email, password: f.password } })) }
    catch (x: any) { setErr(x.message) } finally { setBusy(false) } }
  return <div className="min-h-screen grid lg:grid-cols-2">
    <div className="hidden lg:flex flex-col items-center justify-center text-white p-10" style={{ background: 'var(--hero)' }}>
      <Orb state="idle" size={280} /><h1 className="text-4xl font-bold mt-12">EduNexus</h1><p className="opacity-90 mt-2 text-center">Your Personal AI Learning & Productivity Workspace</p></div>
    <div className="flex items-center justify-center p-6"><form onSubmit={submit} className="card p-7 w-full max-w-md space-y-2" autoComplete="on">
      <h2 className="text-xl font-semibold">{reg ? 'Create your account' : 'Welcome back'}</h2>
      <p className="text-xs text-muted"><Req /> Required field</p>
      {reg && <><Lbl t="Full name" req /><input className="input" name="name" autoComplete="name" placeholder="Full name" value={f.full_name} onChange={set('full_name')} required /></>}
      <Lbl t="Email" req /><input className="input" type="email" name="email" autoComplete="email" placeholder="Email" value={f.email} onChange={set('email')} required />
      <Lbl t="Password" req /><Pw value={f.password} onChange={set('password')} ph={reg ? 'Password (min 8 characters)' : 'Password'} auto={reg ? 'new-password' : 'current-password'} />
      {reg && <>
        <Lbl t="Confirm password" req /><Pw value={f.confirm_password} onChange={set('confirm_password')} ph="Confirm password" auto="new-password" />
        <Lbl t="Profession" req /><select className="input" value={f.profession} onChange={set('profession')}>{PROF.map(p => <option key={p}>{p}</option>)}</select>
        <Lbl t="Course / Degree / Subject" req /><input className="input" placeholder="Course / Degree / Subject" value={f.course} onChange={set('course')} required />
        <Lbl t="Institution or organization" /><input className="input" placeholder="Institution or organization" value={f.institution} onChange={set('institution')} />
        <Lbl t="Learning interests" /><input className="input" placeholder="Learning interests" value={f.interests} onChange={set('interests')} />
        <Lbl t="Interface language" req /><select className="input" value={f.interface_language} onChange={e => { set('interface_language')(e); guest({ lang: e.target.value }) }}>{Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></>}
      <Err msg={err} />
      <button className="btn w-full justify-center" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Register' : 'Log in'}</button>
      <button type="button" className="text-sm text-brand w-full" onClick={() => { setReg(!reg); setErr('') }}>{reg ? 'Already have an account? Log in' : 'New here? Create an account'}</button>
    </form></div></div>
}
