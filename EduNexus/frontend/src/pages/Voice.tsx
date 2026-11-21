import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Volume2, VolumeX, RotateCcw, Send } from 'lucide-react'
import { api } from '../api'
import { useApp } from '../store'
import { LANGS } from '../i18n'
import Orb, { OrbState } from '../components/Orb'
import { speak, stopSpeak, useDictation, speechOK, ttsOK } from '../speech'
import { Err, H, Spinner } from '../components/ui'
export default function Voice() {
  const { t } = useApp(); const [vl, setVl] = useState(localStorage.getItem('voiceLang') || 'en'); const [text, setText] = useState(''); const [reply, setReply] = useState<any>(null)
  const [thinking, setThinking] = useState(false); const [speaking, setSpeaking] = useState(false); const [muted, setMuted] = useState(localStorage.getItem('muted') === '1'); const [err, setErr] = useState(''); const cid = useRef<number | null>(null)
  const d = useDictation((s) => setText(s), vl)
  useEffect(() => () => stopSpeak(), [])
  const state: OrbState = d.on ? 'listening' : thinking ? 'thinking' : speaking ? 'speaking' : 'idle'
  const say = (r: any) => { if (!muted && ttsOK) { setSpeaking(true); speak(r.reply, r.language, () => setSpeaking(false)) } }
  const send = async () => { const m = text.trim(); if (!m) return; setErr(''); setThinking(true); stopSpeak()
    try { const r = await api('/chat', { method: 'POST', body: { message: m, conversation_id: cid.current } }); cid.current = r.conversation_id; setReply(r); setText(''); say(r) } catch (e: any) { setErr(e.message) } setThinking(false) }
  return <div className="text-center"><H sub="Speak or type. Answers come back in the language you used.">{t('voice')}</H>
    <div className="py-8"><Orb size={300} state={state} onClick={speechOK ? (d.on ? d.stop : d.start) : undefined} /><p className="mt-8 text-sm text-muted capitalize">{state === 'idle' ? (speechOK ? 'Tap the orb or the mic to speak' : 'Voice input unavailable. Type below.') : state + '…'}</p></div>
    {!speechOK && <Err msg="Speech recognition is not supported in this browser. Use Chrome or Edge, or use the typing box." />}<Err msg={d.error} /><Err msg={err} />
    <div className="card p-4 max-w-2xl mx-auto text-start space-y-3">
      <div className="flex gap-2 flex-wrap"><select className="input !w-auto" value={vl} onChange={e => { setVl(e.target.value); localStorage.setItem('voiceLang', e.target.value) }}>{Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>Voice: {v}</option>)}</select>
        <button className="btn" onClick={d.on ? d.stop : d.start} disabled={!speechOK}>{d.on ? <><Square size={15} />Stop</> : <><Mic size={15} />Start mic</>}</button>
        <button className="btn-ghost" onClick={() => { const m = !muted; setMuted(m); localStorage.setItem('muted', m ? '1' : '0'); if (m) { stopSpeak(); setSpeaking(false) } }}>{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}{muted ? 'Unmute' : 'Mute'}</button>
        <button className="btn-ghost" onClick={() => { stopSpeak(); setSpeaking(false) }} disabled={!speaking}><Square size={15} />Stop speaking</button>
        <button className="btn-ghost" onClick={() => reply && say(reply)} disabled={!reply}><RotateCcw size={15} />Repeat</button></div>
      <textarea className="input" rows={2} placeholder="Recognised text appears here. Edit it, then send." value={text} onChange={e => setText(e.target.value)} />
      <button className="btn" onClick={send} disabled={thinking || !text.trim()}><Send size={15} />Send</button>
      {thinking && <Spinner text="Thinking…" />}{reply && <div className="whitespace-pre-wrap text-sm p-3 rounded-xl" style={{ background: 'var(--soft)' }}>{reply.reply}</div>}</div></div>
}
