import { ReactNode, useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'
export const Err = ({ msg }: { msg: string }) => msg ? <div className="text-sm rounded-xl px-3 py-2 my-2" style={{ background: 'rgba(239,68,68,.12)', color: '#ef4444' }}>{msg}</div> : null
export const Empty = ({ children }: { children: ReactNode }) => <div className="text-sm text-muted text-center py-6">{children}</div>
export const Spinner = ({ text = 'Working…' }: { text?: string }) => <div className="flex items-center gap-2 text-sm text-muted py-2"><span className="inline-block w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />{text}</div>
export const H = ({ children, sub }: { children: ReactNode; sub?: string }) => <div className="mb-5"><h1 className="text-2xl font-semibold">{children}</h1>{sub && <p className="text-sm text-muted">{sub}</p>}</div>
export function CopyDl({ text, name = 'edunexus.txt' }: { text: string; name?: string }) {
  const [ok, setOk] = useState(false)
  return <span className="inline-flex gap-2">
    <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500) }}>{ok ? <Check size={15} /> : <Copy size={15} />}Copy</button>
    <button className="btn-ghost" onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); a.download = name; a.click() }}><Download size={15} />Download</button></span>
}
export const fmtSize = (b: number) => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'
