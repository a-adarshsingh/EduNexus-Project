export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'
export default function Orb({ state = 'idle', size = 260, onClick }: { state?: OrbState; size?: number; onClick?: () => void }) {
  return <div className="orb mx-auto" data-state={state} style={{ ['--s' as any]: size + 'px', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick} role={onClick ? 'button' : undefined} aria-label={'AI orb: ' + state}><div className="orb-core" /></div>
}
