import { useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'
const w: any = window
const SR = w.SpeechRecognition || w.webkitSpeechRecognition
export const BCP: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', hinglish: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', ur: 'ur-PK', es: 'es-ES', fr: 'fr-FR' }
export const speechOK = !!SR
export const ttsOK = 'speechSynthesis' in window
export const voiceLang = () => localStorage.getItem('voiceLang') || 'en'
export function useDictation(onText: (t: string, final: boolean) => void, lang: string) {
  const [on, setOn] = useState(false); const [error, setError] = useState(''); const rec = useRef<any>(null)
  const start = () => {
    if (!SR) { setError('Voice input is not supported in this browser. Use Chrome or Edge, or type instead.'); return }
    setError(''); const r = new SR(); r.lang = BCP[lang] || 'en-IN'; r.interimResults = true; r.continuous = false
    r.onresult = (e: any) => { let t = '', f = false; for (let i = 0; i < e.results.length; i++) { t += e.results[i][0].transcript; if (e.results[i].isFinal) f = true } onText(t, f) }
    r.onerror = (e: any) => { setError(e.error === 'not-allowed' ? 'Microphone permission denied. Allow it in the browser address bar.' : e.error === 'no-speech' ? 'No speech detected.' : 'Voice error: ' + e.error); setOn(false) }
    r.onend = () => setOn(false); rec.current = r
    try { r.start(); setOn(true) } catch { setError('Could not start the microphone.') }
  }
  const stop = () => { rec.current?.stop(); setOn(false) }
  return { on, error, start, stop }
}
export function speak(text: string, lang: string, onEnd?: () => void) {
  if (!ttsOK) return false
  speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''))
  u.lang = BCP[lang] || 'en-IN'; u.onend = () => onEnd && onEnd(); u.onerror = () => onEnd && onEnd(); speechSynthesis.speak(u); return true
}
export const stopSpeak = () => { if (ttsOK) speechSynthesis.cancel() }
/** Mic next to any text field: onText gets the final dictated text so the parent can append and let the user edit. */
export function MicButton({ onText }: { onText: (t: string) => void }) {
  const d = useDictation((t, f) => { if (f) onText(t) }, voiceLang())
  return <span className="inline-flex flex-col items-start shrink-0">
    <button type="button" className="btn-ghost !p-2.5" title={speechOK ? 'Voice typing' : 'Not supported in this browser'} onClick={d.on ? d.stop : d.start}>
      {d.on ? <Square size={18} className="text-red-500" /> : <Mic size={18} />}</button>
    {d.error && <span className="text-xs text-red-500 max-w-[200px]">{d.error}</span>}</span>
}
