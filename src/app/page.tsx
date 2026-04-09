import { prisma } from "../lib/prisma";
import Link from "next/link";
import { Lock } from "lucide-react";

export default async function HomePage() {
  const sessions = await prisma.session.findMany({
    where: { 
      status: { in: ["ACTIVE", "PAUSED"] } 
    },
    include: { flavor: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main style={{ minHeight: "100vh", background: "var(--cream)", padding: "2rem" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: "3rem", paddingTop: "2rem" }}>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "var(--muted)", textTransform: "uppercase" }}>Lupulus Humlevand</div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "800", color: "var(--dark)", margin: "0.5rem 0" }}>Cata de Sabores</h1>
          <p style={{ color: "var(--muted)" }}>Selecciona una sesión activa para comenzar tu evaluación.</p>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sessions.map((session) => (
            <Link 
              key={session.id} 
              href={`/tasting/${session.id}`}
              style={{ 
                background: "white", 
                padding: "1.5rem", 
                borderRadius: "16px", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                textDecoration: "none", 
                color: "inherit",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                border: "1px solid rgba(0,0,0,0.05)",
                pointerEvents: session.status === "PAUSED" ? "none" : "auto",
                opacity: session.status === "PAUSED" ? 0.6 : 1
              }}
            >
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--gold)", fontWeight: "700", textTransform: "uppercase" }}>
                  {session.flavor.name}
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--dark)" }}>
                  Sesión #{session.customCode || session.id.slice(-4).toUpperCase()}
                </div>
                {session.status === "PAUSED" && (
                  <span style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: "bold" }}>PAUSADA - ESPERA AL ORGANIZADOR</span>
                )}
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {session.customCode && <Lock size={18} color="var(--muted)" />}
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--dark)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  →
                </div>
              </div>
            </Link>
          ))}

          {sessions.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem", opacity: 0.5 }}>
              <p>No hay sesiones de cata activas en este momento.</p>
            </div>
          )}
        </div>

        <footer style={{ marginTop: "4rem", textAlign: "center" }}>
          <Link href="/admin" style={{ fontSize: "0.8rem", color: "var(--muted)", textDecoration: "none" }}>Panel de Administrador</Link>
        </footer>
      </div>
    </main>
  );
}