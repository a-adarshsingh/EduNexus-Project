import { useParams } from 'react-router-dom'
import DocPanel from '../components/DocPanel'
export default function DocPage() { const { id } = useParams(); return <DocPanel id={Number(id)} reader /> }
