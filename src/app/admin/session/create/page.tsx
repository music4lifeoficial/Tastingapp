import { prisma } from "../../../../lib/prisma";
import { createSession } from "../../../actions";

export default async function CreateSessionAdmin() {
  const flavors = await prisma.flavor.findMany();

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem" }}>Nueva Sesión de Cata</h1>
      <form action={createSession} style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Sabor / Proyecto</label>
            <input 
              list="flavors" 
              name="flavorName" 
              placeholder="Ej: Original" 
              required 
              style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid #ddd" }}
            />
            <datalist id="flavors">
              {flavors.map(f => <option key={f.id} value={f.name} />)}
            </datalist>
            <small style={{ color: "#888" }}>Si el sabor no existe, se creará automáticamente.</small>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Código de Sesión (Opcional)</label>
            <input 
              name="customCode" 
              placeholder="Ej: PROMO-2024" 
              style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid #ddd" }}
            />
            <small style={{ color: "#888" }}>Si se deja vacío, se usará el ID generado. Si se pone código, la sesión tendrá "candado".</small>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontWeight: "bold" }}>Códigos de Variantes (CL-1, CL-2...)</label>
          <input 
            name="variants" 
            placeholder="M1, M2, M3" 
            required 
            style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid #ddd" }}
          />
          <small style={{ color: "#888" }}>Separados por coma. Se crearán preguntas específicas para cada variante.</small>
        </div>

        <div style={{ padding: "1.5rem", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #eee" }}>
          <h3 style={{ marginBottom: "1rem" }}>Plantilla de Preguntas</h3>
          <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1.5rem" }}>
            Se cargará automáticamente la plantilla estándar (Aroma, Sabor, Amargor, etc.). 
            Podrás editar las preguntas personalizadas una vez creada la sesión.
          </p>
          <ul style={{ fontSize: "0.85rem", color: "#444" }}>
            <li>✓ Perfil de Catador (Beer/IPA) - Global</li>
            <li>✓ Atributos de Variante (Aroma, Sabor, Amargor, Linger, Overall, Buy, Again, Word) - Por Variante</li>
            <li>✓ Preferida & Por qué - Global</li>
          </ul>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <a href="/admin" style={{ padding: "1rem 2rem", borderRadius: "8px", textDecoration: "none", color: "#666" }}>Cancelar</a>
          <button type="submit" style={{ padding: "1rem 3rem", background: "var(--dark)", color: "white", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}>
            Crear Sesión
          </button>
        </div>
      </form>
    </div>
  );
}