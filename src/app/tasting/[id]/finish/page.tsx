export const dynamic = 'force-dynamic'

import { savePreference } from '../../../actions'
import { prisma } from '../../../../lib/prisma'
import { notFound, redirect } from 'next/navigation'

export default async function FinishTasting({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ taster?: string, success?: string }> }) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const id = resolvedParams.id;
  const tasterName = resolvedSearch.taster;
  const success = resolvedSearch.success;

  if (success === '1') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '3rem' }}>¡Gracias! 🍻</h1>
          <p style={{ opacity: 0.8, fontSize: '1.2rem' }}>Tus evaluaciones han sido guardadas. ¡Salud!</p>
        </div>
      </main>
    )
  }

  if (!tasterName) redirect(/tasting/ + id)

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) notFound()

  const benchCodes = session.benchCodes.split(',').map((s: string) => s.trim())

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', paddingTop: '10vh' }}>
      <div className="glass-panel" style={{ maxWidth: '500px', width: '100%' }}>
        <h1 style={{ color: 'var(--accent)', marginBottom: '1rem', textAlign: 'center' }}>Último Paso</h1>
        <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '2rem' }}>De todas las muestras, ¿cuál fue tu favorita?</p>
        
        <form action={savePreference} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input type="hidden" name="sessionId" value={id} />
          <input type="hidden" name="tasterName" value={tasterName} />

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Muestra Preferida</label>
            <select name="preferredBench" required style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '1.1rem' }}>
              <option value="">Selecciona una...</option>
              {benchCodes.map((code: string) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>¿Por qué?</label>
            <textarea name="reason" required placeholder="Me encantó el retrogusto..." style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', minHeight: '100px', fontFamily: 'inherit' }}></textarea>
          </div>

          <button type="submit" style={{ marginTop: '1rem', padding: '1.2rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>Enviar Resultados Finales</button>
        </form>
      </div>
    </main>
  )
}


