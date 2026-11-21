import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useApp } from '../store'
import DocPanel from '../components/DocPanel'
import { H, Empty } from '../components/ui'
export default function Summarizer() {
  const { t } = useApp(); const [docs, setDocs] = useState<any[]>([]); const [id, setId] = useState<number | null>(null)
  useEffect(() => { api('/library').then(d => { const r = d.filter((x: any) => x.status === 'ready'); setDocs(r); if (r[0]) setId(r[0].id) }) }, [])
  return <div><H sub="Pick a document from your library and generate summaries, notes, flashcards and MCQs.">{t('summarizer')}</H>
    {docs.length === 0 ? <Empty>No readable documents yet. <Link className="text-brand" to="/library">Upload one in My Library</Link>.</Empty> : <>
      <select className="input mb-4 max-w-md" value={id ?? ''} onChange={e => setId(Number(e.target.value))}>{docs.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}</select>
      {id && <DocPanel id={id} reader />}</>}</div>
}
