export const dynamic = 'force-dynamic'

import { createProfileAndStartTasting } from '../../actions'
import { prisma } from '../../../lib/prisma'
import { notFound } from 'next/navigation'

export default async function TastingProfile({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) notFound()

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', paddingTop: '10vh' }}>
      <div className="glass-panel" style={{ maxWidth: '500px', width: '100%' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Bienvenido a la Cata</h2>
        <h3 style={{ marginBottom: '2rem', opacity: 0.8, fontSize: '1.2rem' }}>Perfil: {session.flavor}</h3>
        
        <form action={createProfileAndStartTasting} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input type="hidden" name="sessionId" value={session.id} />
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Tu Nombre</label>
            <input 
              type="text" 
              name="name" 
              placeholder="Ej: Andrés" 
              required
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
            <input type="checkbox" name="drinksBeer" id="drinksBeer" style={{ width: '20px', height: '20px' }} />
            <label htmlFor="drinksBeer" style={{ fontSize: '1.1rem', cursor: 'pointer' }}>¿Tomas Cerveza regularmente?</label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
            <input type="checkbox" name="drinksIpa" id="drinksIpa" style={{ width: '20px', height: '20px' }} />
            <label htmlFor="drinksIpa" style={{ fontSize: '1.1rem', cursor: 'pointer' }}>¿Tomas cervezas muy lupuladas (IPA)?</label>
          </div>

          <button type="submit" style={{ marginTop: '1rem', padding: '1.2rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>Comenzar a Evaluar</button>
        </form>
      </div>
    </main>
  )
}

