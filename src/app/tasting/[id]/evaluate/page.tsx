export const dynamic = 'force-dynamic'

import { saveEvaluation } from '../../../actions'
import { prisma } from '../../../../lib/prisma'
import { notFound, redirect } from 'next/navigation'

export default async function EvaluateSample({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ taster?: string, step?: string }> }) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const id = resolvedParams.id;
  const tasterName = resolvedSearch.taster;
  const step = parseInt(resolvedSearch.step || '0');

  if (!tasterName) redirect(`/tasting/${id}`);

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) notFound();

  const benchCodes = session.benchCodes.split(',').map((s: string) => s.trim());
  
  if (step >= benchCodes.length) {
    redirect(`/tasting/${id}/finish?taster=${encodeURIComponent(tasterName!)}`);
  }

  const currentBenchCode = benchCodes[step];

  async function handleNext(formData: FormData) {
    'use server'
    await saveEvaluation(formData)
    const nextStep = step + 1
    if (nextStep >= benchCodes.length) {
      redirect(`/tasting/${id}/finish?taster=${encodeURIComponent(tasterName!)}`)
    } else {
      redirect(`/tasting/${id}/evaluate?taster=${encodeURIComponent(tasterName!)}&step=${nextStep}`)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ opacity: 0.7 }}>Catador: {tasterName}</span>
          <span style={{ opacity: 0.7 }}>Muestra {step + 1} de {benchCodes.length}</span>
        </div>
        
        <h1 style={{ color: 'var(--accent)', fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Muestra: {currentBenchCode}</h1>
        
        <form action={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <input type="hidden" name="sessionId" value={id} />
          <input type="hidden" name="tasterName" value={tasterName} />
          <input type="hidden" name="benchCode" value={currentBenchCode} />

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>1. Aroma (1-10)</label>
            <p style={{ opacity: 0.8, marginBottom: '1rem', fontSize: '0.9rem' }}>Intensidad y calidad del aroma a lúpulo.</p>
            <input type="range" name="aroma" min="1" max="10" defaultValue="5" style={{ width: '100%', accentColor: 'var(--primary)' }} />
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>2. Sabor (1-10)</label>
            <p style={{ opacity: 0.8, marginBottom: '1rem', fontSize: '0.9rem' }}>Sabor a lúpulo, frescura, notas cítricas.</p>
            <input type="range" name="flavor" min="1" max="10" defaultValue="5" style={{ width: '100%', accentColor: 'var(--primary)' }} />
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>3. Calidad del Amargor</label>
            <textarea name="bitterness" required placeholder="Ej: Suave, rasposo" style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', minHeight: '80px', fontFamily: 'inherit' }}></textarea>
          </div>
          
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input type="checkbox" name="linger" id="linger" style={{ width: '25px', height: '25px', accentColor: 'var(--primary)' }} />
            <label htmlFor="linger" style={{ fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>¿El amargor perdura mucho tiempo en garganta (Linger)?</label>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent)' }}>Impresión General (1-10)</label>
            <input type="number" name="overall" min="1" max="10" required placeholder="Puntaje" style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1.2rem', textAlign: 'center' }} />
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>¿Comprarías esta bebida?</label>
            <input type="text" name="wouldBuy" required placeholder="Sí/No/Tal vez" style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', marginBottom: '1rem' }} />

            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>¿Te tomarías una pinta entera?</label>
            <input type="text" name="drinkAgain" required placeholder="Sí/No" style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white' }} />
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--accent)' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--accent)' }}>Describe esta muestra en 1 sola palabra</label>
            <input type="text" name="oneWord" required placeholder="Extraordinaria" style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1.2rem', textAlign: 'center' }} />
          </div>

          <button type="submit" style={{ padding: '1.2rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', border: '2px solid transparent' }}>
            {step + 1 === benchCodes.length ? 'Finalizar Evaluaciones' : 'Guardar y Siguiente Muestra'}
          </button>
        </form>
      </div>
    </main>
  )
}



