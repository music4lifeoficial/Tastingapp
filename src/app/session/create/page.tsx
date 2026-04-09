import { createSession } from '../../actions'

export default function CreateSession() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%' }}>
        <h1 style={{ color: 'var(--primary)', marginBottom: '2rem', textAlign: 'center' }}>Crear Sesión de Cata</h1>
        
        <form action={createSession} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Sabor / Perfil a Catar</label>
            <input 
              type="text" 
              name="flavor" 
              placeholder="Ej: Lúpulo Citra Batch 2" 
              required
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Códigos de Muestra (Separados por coma)</label>
            <input 
              type="text" 
              name="benchCodes" 
              placeholder="Ej: M1, M2, M3" 
              required
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem' }}
            />
            <small style={{ display: 'block', marginTop: '0.5rem', opacity: 0.7 }}>Estos son los identificadores ciegos de las muestras (ej. vaso A, vaso B).</small>
          </div>

          <button type="submit" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>Generar Sesión</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a href="/" style={{ opacity: 0.7, textDecoration: 'underline' }}>Volver al Inicio</a>
        </div>
      </div>
    </main>
  );
}
