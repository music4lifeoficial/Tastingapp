export const dynamic = 'force-dynamic'

import { prisma } from '../../../../lib/prisma'
import { notFound } from 'next/navigation'

export default async function ShareSession({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) notFound()

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>¡Sesión Creada!</h1>
        <p style={{ marginBottom: '2rem', opacity: 0.8 }}>Pídele a los catadores que entren a la web e ingresen este código:</p>
        
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', border: '2px dashed var(--accent)' }}>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--accent)', letterSpacing: '1px', wordBreak: 'break-all' }}>{session.id}</h2>
        </div>

        <p style={{ marginBottom: '2rem', opacity: 0.8 }}>
          Perfil a Catar: <strong>{session.flavor}</strong><br/>
          Muestras a evaluar: <strong>{session.benchCodes}</strong>
        </p>

        <a href={/tasting/ + session.id} style={{ display: 'inline-block', padding: '1rem 2rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}>Entrar a la Cata</a>
      </div>
    </main>
  )
}

