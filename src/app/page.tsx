import { joinSession } from './actions'

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}>
        <h1 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '3rem', letterSpacing: '-1px' }}>Lupulus</h1>
        <p style={{ marginBottom: '2rem', color: 'var(--foreground)', opacity: 0.8, fontSize: '1.1rem' }}>Ingresa el código de tu sesión de cata para comenzar, o crea una nueva sesión.</p>
        
        <form action={joinSession} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <input 
            type="text" 
            name="sessionId" 
            placeholder="Código de Sesión" 
            required
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1.2rem', textAlign: 'center' }}
          />
          <button type="submit" style={{ padding: '1rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>Entrar a la Cata</button>
        </form>

        <div style={{ height: '1px', background: 'var(--card-border)', margin: '2rem 0' }}></div>

        <a href="/session/create" style={{ display: 'inline-block', padding: '1rem', border: '2px solid var(--accent)', color: 'var(--accent)', borderRadius: '8px', fontWeight: 'bold' }}>Crear Nueva Sesión (Admin)</a>
      </div>
    </main>
  );
}
