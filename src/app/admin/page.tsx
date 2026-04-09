import { cookies } from "next/headers";
import { prisma } from "../../lib/prisma";
import { loginAdmin } from "../actions";
import Link from "next/link";
import { Status } from "@prisma/client";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("admin_auth")?.value === "true";

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: "400px", margin: "100px auto", padding: "2rem", background: "white", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>Admin Login</h2>
        <form action={loginAdmin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input 
            type="password" 
            name="password" 
            placeholder="Contraseña" 
            required 
            style={{ padding: "0.8rem", borderRadius: "4px", border: "1px solid #ddd" }}
          />
          <button type="submit" style={{ padding: "0.8rem", background: "var(--dark)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Entrar
          </button>
        </form>
      </div>
    );
  }

  const sessions = await prisma.session.findMany({
    include: { flavor: true, _count: { select: { profiles: true } } },
    orderBy: { createdAt: "desc" }
  });

  const flavors = await prisma.flavor.findMany();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Panel de Control</h1>
        <Link href="/admin/session/create" style={{ padding: "0.8rem 1.5rem", background: "var(--gold)", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
          + Nueva Sesión
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {sessions.map((session) => (
          <div key={session.id} style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: `5px solid ${session.status === "ACTIVE" ? "#28a745" : session.status === "PAUSED" ? "#ffc107" : "#6c757d"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#888" }}>{session.flavor.name}</span>
              <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "10px", background: "#eee" }}>{session.status}</span>
            </div>
            <h3 style={{ margin: "0.5rem 0" }}>{session.customCode || session.id.slice(-6)}</h3>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>{session._count.profiles} Catadores</p>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
               <Link href={`/admin/session/${session.id}`} style={{ flex: 1, textAlign: "center", padding: "0.5rem", background: "#eee", borderRadius: "4px", textDecoration: "none", color: "#333", fontSize: "0.8rem" }}>Ver Resultados</Link>
            </div>
          </div>
        ))}
      </div>
      
      {sessions.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem", background: "white", borderRadius: "12px", border: "2px dashed #ddd" }}>
          <p>No hay sesiones creadas aún.</p>
        </div>
      )}
    </div>
  );
}