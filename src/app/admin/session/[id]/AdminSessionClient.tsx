'use client'

import { useState } from "react";
import { updateSessionStatus } from "../../../actions";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Play, Pause, Square, Users, ClipboardList, BarChart3, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function AdminSessionClient({ session }: { session: any }) {
  const [status, setStatus] = useState(session.status);

  const handleStatusChange = async (newStatus: any) => {
    setStatus(newStatus);
    await updateSessionStatus(session.id, newStatus);
  };

  // --- DATA PROCESSING ---
  
  // Calculate averages per variant for star questions
  const starQuestions = session.questions.filter((q: any) => q.type === "STAR" && q.scope === "VARIANT");
  
  const chartData = session.variants.map((v: any) => {
    const variantResponses = session.responses.filter((r: any) => r.variantId === v.id);
    const data: any = { name: v.code };
    
    starQuestions.forEach((q: any) => {
      const qResponses = variantResponses.filter((r: any) => r.questionId === q.id);
      const avg = qResponses.reduce((acc: number, r: any) => acc + parseInt(r.value), 0) / (qResponses.length || 1);
      data[q.text] = parseFloat(avg.toFixed(1));
    });
    
    return data;
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
           <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#666", textDecoration: "none", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
             <ChevronLeft size={16} /> Volver al Panel
           </Link>
           <h1 style={{ margin: 0, color: "var(--dark)" }}>Sesión: {session.customCode || session.id.slice(-6).toUpperCase()}</h1>
           <div style={{ color: "var(--muted)", display: "flex", gap: "1rem", marginTop: "0.2rem" }}>
              <span>{session.flavor.name}</span>
              <span>•</span>
              <span>{new Date(session.createdAt).toLocaleDateString()}</span>
           </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", background: "white", padding: "0.5rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
           <button 
             onClick={() => handleStatusChange("ACTIVE")}
             style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", borderRadius: "8px", border: "none", background: status === "ACTIVE" ? "#28a745" : "transparent", color: status === "ACTIVE" ? "white" : "#666", cursor: "pointer", fontWeight: "bold" }}
           >
             <Play size={16} /> Activa
           </button>
           <button 
             onClick={() => handleStatusChange("PAUSED")}
             style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", borderRadius: "8px", border: "none", background: status === "PAUSED" ? "#ffc107" : "transparent", color: status === "PAUSED" ? "white" : "#666", cursor: "pointer", fontWeight: "bold" }}
           >
             <Pause size={16} /> Pausada
           </button>
           <button 
             onClick={() => handleStatusChange("TERMINATED")}
             style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", borderRadius: "8px", border: "none", background: status === "TERMINATED" ? "#dc3545" : "transparent", color: status === "TERMINATED" ? "white" : "#666", cursor: "pointer", fontWeight: "bold" }}
           >
             <Square size={16} /> Terminada
           </button>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "1rem" }}>
           <div style={{ background: "rgba(200, 164, 21, 0.1)", color: "var(--gold)", width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={24} /></div>
           <div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900" }}>{session.profiles.length}</div>
              <div style={{ fontSize: "0.8rem", color: "#888", textTransform: "uppercase" }}>Catadores Totales</div>
           </div>
        </div>
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "1rem" }}>
           <div style={{ background: "rgba(30, 58, 34, 0.1)", color: "var(--dark)", width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}><ClipboardList size={24} /></div>
           <div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900" }}>{session.responses.length}</div>
              <div style={{ fontSize: "0.8rem", color: "#888", textTransform: "uppercase" }}>Respuestas Recibidas</div>
           </div>
        </div>
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "1rem" }}>
           <div style={{ background: "#28a74515", color: "#28a745", width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}><BarChart3 size={24} /></div>
           <div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900" }}>{session.variants.length}</div>
              <div style={{ fontSize: "0.8rem", color: "#888", textTransform: "uppercase" }}>Variantes Testeadas</div>
           </div>
        </div>
      </div>

      <div style={{ gridTemplateColumns: "1fr", display: "grid", gap: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ background: "white", padding: "2rem", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          <h3 style={{ marginBottom: "2rem" }}>Promedio de Atributos por Variante</h3>
          <div style={{ height: "400px" }}>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 6]} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                  <Legend />
                  {starQuestions.map((q: any, i: number) => (
                    <Bar key={q.id} dataKey={q.text} fill={i === 0 ? "var(--dark)" : i === 1 ? "var(--gold)" : i === 2 ? "var(--accent)" : "#999"} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ background: "white", padding: "2rem", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
           <h3 style={{ marginBottom: "2rem" }}>Ranking de Preferencia</h3>
           {session.questions.filter((q: any) => q.scope === "GLOBAL" && q.text.toLowerCase().includes("preferiste")).map((q: any) => {
              const responses = session.responses.filter((r: any) => r.questionId === q.id);
              const totalVoters = new Set(responses.map((r: any) => r.profileId)).size;
              const counts = session.variants.map((v: any) => ({
                code: v.code,
                count: responses.filter((r: any) => r.value === v.code).length
              })).sort((a: any, b: any) => b.count - a.count);

              return (
                <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                   {counts.map((c: any, i: number) => (
                     <div key={c.code} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ fontWeight: "900", width: "40px", fontSize: "1.2rem" }}>{c.code}</div>
                        <div style={{ flex: 1, background: "#f0f0f0", height: "16px", borderRadius: "8px", overflow: "hidden" }}>
                           <div style={{ width: `${(c.count / (totalVoters || 1)) * 100}%`, height: "100%", background: i === 0 ? "var(--green)" : "var(--dark)", borderRadius: "8px" }}></div>
                        </div>
                        <div style={{ fontSize: "0.9rem", fontWeight: "bold", minWidth: "70px", textAlign: "right" }}>{c.count} votos</div>
                     </div>
                   ))}
                </div>
              );
           })}
        </div>
        
        <div style={{ background: "white", padding: "2rem", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
           <h3 style={{ marginBottom: "2rem" }}>Comentarios Preferencia</h3>
           {session.questions.filter((q: any) => q.scope === "GLOBAL" && q.text.toLowerCase().includes("por qué")).map((q: any) => {
              const responses = session.responses.filter((r: any) => r.questionId === q.id && r.value);
              return (
                <div key={q.id} style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                   {responses.map((r: any, i: number) => (
                     <div key={i} style={{ padding: "0.8rem", background: "#f8f9fa", borderRadius: "8px", fontSize: "0.9rem", borderLeft: "4px solid var(--gold)" }}>
                        "{r.value}"
                     </div>
                   ))}
                </div>
              );
           })}
        </div>
      </div>

      <div style={{ background: "white", padding: "2rem", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
         <h3 style={{ marginBottom: "2rem" }}>Detalle de Catadores</h3>
         <div style={{ overflowX: "auto" }}>
           <table style={{ width: "100%", borderCollapse: "collapse" }}>
             <thead>
               <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                 <th style={{ padding: "1rem" }}>Nombre</th>
                 <th style={{ padding: "1rem" }}>Cerveza</th>
                 <th style={{ padding: "1rem" }}>IPAs</th>
                 <th style={{ padding: "1rem" }}>Completado</th>
                 <th style={{ padding: "1rem" }}>Preferencia</th>
               </tr>
             </thead>
             <tbody>
               {session.profiles.map((p: any) => {
                 const prefQ = session.questions.find((q: any) => q.scope === "GLOBAL" && q.text.toLowerCase().includes("preferiste"));
                 const prefResp = p.responses.find((r: any) => r.questionId === prefQ?.id)?.value;
                 return (
                   <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "1rem", fontWeight: "bold" }}>{p.name}</td>
                      <td style={{ padding: "1rem" }}>{p.drinksBeer ? "✅ Sí" : "❌ No"}</td>
                      <td style={{ padding: "1rem" }}>{p.drinksIpa ? "✅ Sí" : "❌ No"}</td>
                      <td style={{ padding: "1rem" }}>
                         {p.responses.length > 0 ? "Completado" : "Pendiente"}
                      </td>
                      <td style={{ padding: "1rem", fontWeight: "bold", color: "var(--gold)" }}>{prefResp || "-"}</td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}