'use client'

import { useState, useMemo } from "react";
import { updateSessionStatus } from "../../../actions";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line
} from 'recharts';
import { 
  Play, Pause, Square, Users, ClipboardList, BarChart3, ChevronLeft, 
  Search, Filter, TrendingUp, AlertTriangle, Heart, Zap
} from "lucide-react";
import Link from "next/link";

export default function AdminSessionClient({ session }: { session: any }) {
  const [status, setStatus] = useState(session.status);
  const [activeSegment, setActiveSegment] = useState("ALL"); // ALL, IPA, NON_IPA

  const handleStatusChange = async (newStatus: any) => {
    setStatus(newStatus);
    await updateSessionStatus(session.id, newStatus);
  };

  // --- DATA ENGINE 2026 ---

  const insights = useMemo(() => {
    const starQuestions = session.questions.filter((q: any) => q.type === "STAR" && q.scope === "VARIANT");
    const overallQ = starQuestions.find((q: any) => q.text.toLowerCase().includes("general")) || starQuestions[0];
    
    // 1. Calculate Segment Data
    const getVariantAverages = (profiles: any[]) => {
      const profileIds = profiles.map(p => p.id);
      return session.variants.map((v: any) => {
        const variantResponses = session.responses.filter((r: any) => r.variantId === v.id && profileIds.includes(r.profileId));
        const data: any = { name: v.code };
        
        starQuestions.forEach((q: any) => {
          const qResponses = variantResponses.filter((r: any) => r.questionId === q.id);
          const scores = qResponses.map((r: any) => parseInt(r.value));
          const avg = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
          
          // Variance for polarization
          const variance = scores.length > 1 
            ? scores.reduce((a: number, b: number) => a + Math.pow(b - avg, 2), 0) / scores.length 
            : 0;

          data[q.text] = parseFloat(avg.toFixed(1));
          data[`${q.text}_var`] = variance;
        });
        
        return data;
      });
    };

    const allAverages = getVariantAverages(session.profiles);
    const ipaLoversAverages = getVariantAverages(session.profiles.filter((p: any) => p.drinksIpa));
    const casualsAverages = getVariantAverages(session.profiles.filter((p: any) => !p.drinksIpa));

    // 2. Identify Key Samples
    const favorite = [...allAverages].sort((a, b) => b[overallQ.text] - a[overallQ.text])[0];
    const polarizing = [...allAverages].sort((a, b) => b[`${overallQ.text}_var`] - a[`${overallQ.text}_var`])[0];

    // 3. Normalized Radar Data (for RadarChart)
    // We want a list of attributes, and values per variant
    const radarData = starQuestions.map((q: any) => {
      const entry: any = { subject: q.text, fullMark: 6 };
      session.variants.forEach((v: any) => {
        const avg = allAverages.find(a => a.name === v.code)[q.text];
        entry[v.code] = avg;
      });
      return entry;
    });

    // 4. Word cloud / Phrases
    const allWords = session.responses
      .filter((r: any) => session.questions.find((q: any) => q.id === r.questionId)?.text.toLowerCase().includes("palabra"))
      .map((r: any) => r.value)
      .filter(Boolean);

    return { 
      allAverages, 
      ipaLoversAverages, 
      casualsAverages, 
      radarData, 
      favorite, 
      polarizing, 
      allWords,
      overallQ
    };
  }, [session]);

  const currentChartData = activeSegment === "ALL" 
    ? insights.allAverages 
    : activeSegment === "IPA" 
      ? insights.ipaLoversAverages 
      : insights.casualsAverages;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 2rem 4rem 2rem" }}>
      {/* 2026 Header with blurred background effect */}
      <header style={{ 
        padding: "2rem 0", 
        marginBottom: "2rem", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-end",
        borderBottom: "1px solid rgba(0,0,0,0.05)"
      }}>
        <div>
           <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--muted)", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.7rem", fontWeight: "600" }}>
             <ChevronLeft size={14} /> PANEL DE CONTROL
           </Link>
           <h1 style={{ margin: 0, fontSize: "2.8rem", fontWeight: "900", color: "var(--dark)", letterSpacing: "-1px" }}>
             {session.flavor.name} <span style={{ color: "var(--gold)", fontWeight: "300" }}>Analytics</span>
           </h1>
           <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginTop: "0.4rem" }}>
             ID Sesión: <span style={{ fontWeight: "700", color: "var(--text)" }}>{session.customCode || session.id.slice(-8).toUpperCase()}</span> • {new Date(session.createdAt).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}
           </p>
        </div>

        <div style={{ display: "flex", gap: "0.8rem", background: "white", padding: "0.6rem", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
           <button 
             onClick={() => handleStatusChange("ACTIVE")}
             style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", borderRadius: "10px", border: "none", background: status === "ACTIVE" ? "var(--green)" : "transparent", color: status === "ACTIVE" ? "white" : "#888", cursor: "pointer", fontWeight: "700", fontSize: "0.85rem", transition: "all 0.3s" }}
           >
             <Play size={14} fill={status === "ACTIVE" ? "currentColor" : "none"} /> VIVO
           </button>
           <button 
             onClick={() => handleStatusChange("PAUSED")}
             style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", borderRadius: "10px", border: "none", background: status === "PAUSED" ? "#f59e0b" : "transparent", color: status === "PAUSED" ? "white" : "#888", cursor: "pointer", fontWeight: "700", fontSize: "0.85rem", transition: "all 0.3s" }}
           >
             <Pause size={14} fill={status === "PAUSED" ? "currentColor" : "none"} /> PAUSA
           </button>
           <button 
             onClick={() => handleStatusChange("TERMINATED")}
             style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", borderRadius: "10px", border: "none", background: status === "TERMINATED" ? "#4b5563" : "transparent", color: status === "TERMINATED" ? "white" : "#888", cursor: "pointer", fontWeight: "700", fontSize: "0.85rem", transition: "all 0.3s" }}
           >
             <Square size={14} fill={status === "TERMINATED" ? "currentColor" : "none"} /> SALIR
           </button>
        </div>
      </header>

      {/* Insight Highlight Cards 2026 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
         <div style={{ background: "linear-gradient(135deg, white 0%, #f9fafb 100%)", padding: "2rem", borderRadius: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: "-20px", top: "-20px", opacity: 0.05 }}><TrendingUp size={120} /></div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", color: "var(--green)", marginBottom: "1rem" }}>
               <Zap size={20} fill="currentColor" /> <span style={{ fontWeight: "800", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>Crowd Favorite</span>
            </div>
            <div style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--dark)" }}>{insights.favorite?.name || "-"}</div>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
               Dominancia en <span style={{ fontWeight: "700", color: "var(--text)" }}>{insights.overallQ.text}</span> con un promedio de {insights.favorite?.[insights.overallQ.text]} / 6.
            </p>
         </div>

         <div style={{ background: "linear-gradient(135deg, white 0%, #f9fafb 100%)", padding: "2rem", borderRadius: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: "-20px", top: "-20px", opacity: 0.05 }}><AlertTriangle size={120} /></div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", color: "var(--accent)", marginBottom: "1rem" }}>
               <AlertTriangle size={20} fill="currentColor" /> <span style={{ fontWeight: "800", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>Most Polarizing</span>
            </div>
            <div style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--dark)" }}>{insights.polarizing?.name || "-"}</div>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
               Genera mayor división de opiniones. Recomendado para <span style={{ fontWeight: "700", color: "var(--text)" }}>nichos específicos</span>.
            </p>
         </div>

         <div style={{ background: "var(--dark)", padding: "2rem", borderRadius: "24px", boxShadow: "0 20px 40px rgba(30,58,34,0.15)", color: "white", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
               <div style={{ background: "var(--gold)", color: "var(--dark)", width: "60px", height: "60px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={32} />
               </div>
               <div>
                  <div style={{ fontSize: "2rem", fontWeight: "900" }}>{session.profiles.length}</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.7, fontWeight: "700", textTransform: "uppercase" }}>Testigos Activos</div>
               </div>
            </div>
            <div style={{ marginTop: "1.5rem", height: "1px", background: "rgba(255,255,255,0.1)" }}></div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", fontSize: "0.85rem" }}>
               <span style={{ opacity: 0.8 }}>IPA Lovers: <span style={{ fontWeight: "900", color: "var(--gold)" }}>{session.profiles.filter((p:any)=>p.drinksIpa).length}</span></span>
               <span style={{ opacity: 0.8 }}>Drinkers: <span style={{ fontWeight: "900" }}>{session.profiles.filter((p:any)=>p.drinksBeer).length}</span></span>
            </div>
         </div>
      </div>

      {/* Main Analysis Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "2rem", marginBottom: "3rem" }}>
         {/* Segmented Averages */}
         <div style={{ background: "white", padding: "2.5rem", borderRadius: "32px", boxShadow: "0 10px 40px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
               <div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "0.3rem" }}>Análisis de Atributos</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Comparativa directa por variante según segmento.</p>
               </div>
               <div style={{ display: "flex", gap: "0.5rem", background: "#f3f4f6", padding: "0.4rem", borderRadius: "14px" }}>
                  {["ALL", "IPA", "NON_IPA"].map(s => (
                    <button 
                       key={s} 
                       onClick={() => setActiveSegment(s)}
                       style={{ 
                         padding: "0.5rem 1rem", border: "none", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer", 
                         background: activeSegment === s ? "white" : "transparent",
                         color: activeSegment === s ? "var(--dark)" : "#6b7280",
                         boxShadow: activeSegment === s ? "0 4px 10px rgba(0,0,0,0.05)" : "none",
                         transition: "all 0.2s"
                       }}
                    >
                       {s === "ALL" ? "Global" : s === "IPA" ? "IPA Lovers" : "Casuals"}
                    </button>
                  ))}
               </div>
            </div>

            <div style={{ height: "400px" }}>
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontWeight: 600}} />
                    <YAxis domain={[0, 6]} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                    <Tooltip 
                       contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontWeight: 700 }} 
                       cursor={{fill: 'rgba(0,0,0,0.02)'}}
                    />
                    <Legend iconType="circle" />
                    {session.questions.filter((q: any) => q.type === "STAR" && q.scope === "VARIANT").map((q: any, i: number) => (
                      <Bar 
                         key={q.id} 
                         dataKey={q.text} 
                         fill={["#1e3a22", "#c8a415", "#c45a2a", "#2d6a3f", "#9ca3af"][i % 5]} 
                         radius={[8, 8, 0, 0]} 
                         barSize={activeSegment === "ALL" ? 40 : 25}
                      />
                    ))}
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Radar Spider Comparison */}
         <div style={{ background: "white", padding: "2.5rem", borderRadius: "32px", boxShadow: "0 10px 40px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "0.3rem" }}>Perfiles Organolépticos</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>Huella sensorial comparativa.</p>
            
            <div style={{ height: "350px", display: "flex", justifyContent: "center" }}>
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={insights.radarData}>
                    <PolarGrid stroke="rgba(0,0,0,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 700, fill: "#6b7280"}} />
                    <PolarRadiusAxis angle={30} domain={[0, 6]} tick={false} axisLine={false} />
                    {session.variants.map((v: any, i: number) => (
                      <Radar
                         key={v.id}
                         name={v.code}
                         dataKey={v.code}
                         stroke={["#1e3a22", "#c8a415", "#c45a2a"][i % 3]}
                         fill={["#1e3a22", "#c8a415", "#c45a2a"][i % 3]}
                         fillOpacity={0.3}
                      />
                    ))}
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    <Legend />
                  </RadarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: "2rem", marginBottom: "3rem" }}>
         {/* Sentiment Matrix / Keyword List */}
         <div style={{ background: "white", padding: "2.5rem", borderRadius: "32px", boxShadow: "0 10px 40px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "1.5rem" }}>Matriz de Conceptos</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
               {[...new Set(insights.allWords)].map((word: string, i) => (
                 <span 
                    key={i} 
                    style={{ 
                       padding: "0.5rem 1.2rem", 
                       background: i % 3 === 0 ? "rgba(30,58,34,0.05)" : i % 3 === 1 ? "rgba(200,164,21,0.05)" : "#f3f4f6",
                       color: i % 3 === 0 ? "var(--dark)" : i % 3 === 1 ? "var(--gold)" : "#4b5563",
                       borderRadius: "100px",
                       fontSize: "0.85rem",
                       fontWeight: "700",
                       border: "1px solid rgba(0,0,0,0.03)"
                    }}
                 >
                    {word}
                 </span>
               ))}
               {insights.allWords.length === 0 && <p style={{ color: "#9ca3af", fontStyle: "italic" }}>Sin descriptores aún.</p>}
            </div>
         </div>

         {/* Preferred Variant Breakdown */}
         <div style={{ background: "white", padding: "2.5rem", borderRadius: "32px", boxShadow: "0 10px 40px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "2rem" }}>Share de Preferencia</h3>
            {session.questions.filter((q: any) => q.scope === "GLOBAL" && q.text.toLowerCase().includes("preferiste")).map((q: any) => {
               const responses = session.responses.filter((r: any) => r.questionId === q.id);
               const totalVoters = new Set(responses.map((r: any) => r.profileId)).size;
               const counts = session.variants.map((v: any) => ({
                 code: v.code,
                 count: responses.filter((r: any) => r.value === v.code).length
               })).sort((a: any, b: any) => b.count - a.count);

               return (
                 <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {counts.map((c: any, i: number) => {
                      const percentage = ((c.count / (totalVoters || 1)) * 100).toFixed(0);
                      return (
                        <div key={c.code} style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                           <div style={{ width: "50px", fontSize: "1.1rem", fontWeight: "900", color: "var(--dark)" }}>{c.code}</div>
                           <div style={{ flex: 1, background: "#f3f4f6", height: "24px", borderRadius: "100px", overflow: "hidden", position: "relative" }}>
                              <div 
                                style={{ width: `${percentage}%`, height: "100%", background: i === 0 ? "var(--green)" : i === 1 ? "var(--gold)" : "var(--dark)", borderRadius: "100px", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
                              ></div>
                              <span style={{ position: "absolute", right: "12px", top: "2px", fontSize: "0.75rem", fontWeight: "900", color: parseInt(percentage) > 90 ? "white" : "var(--text)" }}>{percentage}%</span>
                           </div>
                           <div style={{ minWidth: "80px", textAlign: "right", fontWeight: "800", fontSize: "0.9rem", color: "var(--muted)" }}>{c.count} VOTOS</div>
                        </div>
                      )
                    })}
                 </div>
               );
            })}
         </div>
      </div>

      {/* Taster Detail Table 2026 */}
      <div style={{ background: "white", padding: "2.5rem", borderRadius: "32px", boxShadow: "0 10px 40px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800" }}>Raw Data: Catadores</h3>
            <div style={{ background: "#f3f4f6", padding: "0.8rem 1.2rem", borderRadius: "100px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
               <Search size={14} color="#9ca3af" />
               <input type="text" placeholder="Buscar catador..." style={{ background: "transparent", border: "none", fontSize: "0.85rem", color: "var(--text)", width: "150px" }} />
            </div>
         </div>
         <div style={{ overflowX: "auto" }}>
           <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.8rem" }}>
             <thead>
               <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                 <th style={{ padding: "0 1.5rem" }}>Catador</th>
                 <th style={{ padding: "0" }}>Hábitos</th>
                 <th style={{ padding: "0" }}>Progreso</th>
                 <th style={{ padding: "0 1.5rem", textAlign: "right" }}>Preferencia</th>
               </tr>
             </thead>
             <tbody>
               {session.profiles.map((p: any) => {
                 const prefQ = session.questions.find((q: any) => q.scope === "GLOBAL" && q.text.toLowerCase().includes("preferiste"));
                 const prefResp = p.responses.find((r: any) => r.questionId === prefQ?.id)?.value;
                 return (
                   <tr key={p.id} style={{ background: "#f9fafb", borderRadius: "16px", transition: "transform 0.2s" }}>
                      <td style={{ padding: "1.2rem 1.5rem", fontWeight: "800", borderRadius: "16px 0 0 16px", borderLeft: "4px solid var(--gold)" }}>{p.name}</td>
                      <td style={{ padding: "1.2rem 0" }}>
                         <div style={{ display: "flex", gap: "0.5rem" }}>
                            {p.drinksBeer && <span style={{ padding: "3px 8px", background: "rgba(30,58,34,0.1)", color: "var(--dark)", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "700" }}>BEER</span>}
                            {p.drinksIpa && <span style={{ padding: "3px 8px", background: "rgba(200,164,21,0.1)", color: "var(--gold)", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "700" }}>IPA LOVER</span>}
                         </div>
                      </td>
                      <td style={{ padding: "1.2rem 0" }}>
                         <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "60px", background: "#e5e7eb", height: "6px", borderRadius: "100px" }}>
                               <div style={{ width: p.responses.length > 0 ? "100%" : "0%", height: "100%", background: "var(--green)", borderRadius: "100px" }}></div>
                            </div>
                            <span style={{ fontSize: "0.75rem", fontWeight: "700" }}>{p.responses.length > 0 ? "100%" : "INC"}</span>
                         </div>
                      </td>
                      <td style={{ padding: "1.2rem 1.5rem", fontWeight: "900", color: "var(--gold)", borderRadius: "0 16px 16px 0", textAlign: "right", fontSize: "1.1rem" }}>
                         {prefResp || "—"}
                      </td>
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