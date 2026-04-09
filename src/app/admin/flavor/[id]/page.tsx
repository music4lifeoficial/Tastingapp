import { prisma } from "../../../../lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, TrendingUp, Award } from "lucide-react";

export default async function FlavorDashboard({ params }: { params: { id: string } }) {
  const { id } = await params;

  const flavor = await prisma.flavor.findUnique({
    where: { id },
    include: {
      sessions: {
        include: {
          variants: true,
          questions: true,
          responses: true,
          _count: { select: { profiles: true } }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!flavor) {
    notFound();
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
       <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#666", textDecoration: "none", fontSize: "0.9rem", marginBottom: "1rem" }}>
         <ChevronLeft size={16} /> Volver al Inicio
       </Link>
       <h1 style={{ marginBottom: "2rem" }}>Histórico: {flavor.name}</h1>

       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "3rem" }}>
          <div style={{ background: "white", padding: "2rem", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <TrendingUp color="var(--green)" />
                <h3 style={{ margin: 0 }}>Rendimiento General</h3>
             </div>
             <p style={{ color: "#666", fontSize: "0.9rem" }}>Comparativa de sesiones a lo largo del tiempo.</p>
             <div style={{ marginTop: "2rem", padding: "4rem", textAlign: "center", opacity: 0.3 }}>
                [Gráfico de Tendencia en Desarrollo]
             </div>
          </div>

          <div style={{ background: "white", padding: "2rem", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <Award color="var(--gold)" />
                <h3 style={{ margin: 0 }}>Mejor Variante Histórica</h3>
             </div>
             <p style={{ color: "#666", fontSize: "0.9rem" }}>La variante con mejor puntaje acumulado.</p>
             <div style={{ marginTop: "2rem", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", fontWeight: "900", color: "var(--dark)" }}>-</div>
                <div style={{ color: "var(--gold)", fontWeight: "bold" }}>Aún no hay datos suficientes</div>
             </div>
          </div>
       </div>

       <h3 style={{ marginBottom: "1.5rem" }}>Sesiones Realizadas</h3>
       <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {flavor.sessions.map((s) => (
            <Link key={s.id} href={`/admin/session/${s.id}`} style={{ background: "white", padding: "1.5rem", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #eee" }}>
               <div>
                  <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{s.customCode || s.id.slice(-6).toUpperCase()}</div>
                  <div style={{ fontSize: "0.8rem", color: "#888" }}>{new Date(s.createdAt).toLocaleDateString()} • {s._count.profiles} catadores</div>
               </div>
               <div style={{ padding: "0.4rem 1rem", borderRadius: "20px", background: "#f0f0f0", fontSize: "0.8rem", fontWeight: "bold" }}>
                  {s.status}
               </div>
            </Link>
          ))}
       </div>
    </div>
  );
}