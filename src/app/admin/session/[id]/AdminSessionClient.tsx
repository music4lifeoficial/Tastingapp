'use client'

import { useState, useMemo, useEffect, useCallback } from "react";
import { updateSessionStatus } from "../../../actions";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  Play, Pause, Square, Users, ChevronLeft,
  AlertTriangle, Copy, Check, Download, RefreshCw, MessageSquare,
  Award, Target, ShoppingCart
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const VARIANT_COLORS = ["#1e3a22", "#c8a415", "#c45a2a", "#2d6a3f", "#7c3aed", "#0891b2"];

export default function AdminSessionClient({ session }: { session: any }) {
  const router = useRouter();
  const [status, setStatus] = useState(session.status);
  const [activeSegment, setActiveSegment] = useState("ALL");
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (status !== 'ACTIVE') return;
    const interval = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(interval);
  }, [status, router]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleStatusChange = async (newStatus: any) => {
    setStatus(newStatus);
    await updateSessionStatus(session.id, newStatus);
  };

  const copySessionUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/tasting/${session.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 25000);
  };

  const insights = useMemo(() => {
    const starQs = session.questions.filter((q: any) => q.type === "STAR" && q.scope === "VARIANT").sort((a: any, b: any) => a.order - b.order);
    const optionQs = session.questions.filter((q: any) => q.type === "OPTION" && q.scope === "VARIANT").sort((a: any, b: any) => a.order - b.order);
    const buyQ = optionQs.find((q: any) => q.text.toLowerCase().includes("comprar"));
    const overallQ = starQs.find((q: any) => q.text.toLowerCase().includes("general")) || starQs[0];

    const calcAvg = (profiles: any[]) => {
      const ids = profiles.map((p: any) => p.id);
      return session.variants.map((v: any) => {
        const vR = session.responses.filter((r: any) => r.variantId === v.id && ids.includes(r.profileId));
        const d: any = { code: v.code, id: v.id, totalResponses: vR.length };
        starQs.forEach((q: any) => {
          const scores = vR.filter((r: any) => r.questionId === q.id).map((r: any) => parseFloat(r.value));
          const avg = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
          const variance = scores.length > 1 ? scores.reduce((a: number, b: number) => a + Math.pow(b - avg, 2), 0) / scores.length : 0;
          d[q.text] = parseFloat(avg.toFixed(1));
          d[`${q.text}_var`] = parseFloat(variance.toFixed(2));
        });
        if (buyQ) {
          const bQs = vR.filter((r: any) => r.questionId === buyQ.id);
          const buyVotes = bQs.filter((r: any) => r.value.toLowerCase().includes("si")).length;
          d.purchaseIntent = bQs.length > 0 ? (buyVotes / bQs.length) * 100 : 0;
        } else { d.purchaseIntent = 0; }
        const varianceVal = d[`${overallQ?.text}_var`] || 0;
        const normSatisfaction = (d[overallQ?.text] || 0) / 6;
        const normIntent = d.purchaseIntent / 100;
        const normConsensus = Math.max(0, 1 - (varianceVal / 2));
        d.industrialScore = ((normSatisfaction * 0.5) + (normIntent * 0.3) + (normConsensus * 0.2)) * 100;
        return d;
      });
    };

    const allAvg = calcAvg(session.profiles);
    const ipaAvg = calcAvg(session.profiles.filter((p: any) => p.drinksIpa));
    const casualAvg = calcAvg(session.profiles.filter((p: any) => !p.drinksIpa));

    const radarData = starQs.map((q: any) => {
      const e: any = { subject: q.text, fullMark: 6 };
      allAvg.forEach((v: any) => { e[v.code] = v[q.text]; });
      return e;
    });

    const categoryComparisons = optionQs.map((q: any) => {
      const opts = (q.options || "").split(",").map((o: string) => o.trim());
      const data = opts.map((opt: string) => {
        const entry: any = { option: opt };
        session.variants.forEach((v: any) => {
          entry[v.code] = session.responses.filter((r: any) => r.questionId === q.id && r.variantId === v.id && r.value === opt).length;
        });
        return entry;
      });
      return { id: q.id, text: q.text, data };
    });

    const recommendation = [...allAvg].sort((a, b) => b.industrialScore - a.industrialScore)[0];
    const polarizing = overallQ ? [...allAvg].sort((a, b) => (b[`${overallQ.text}_var`] as number) - (a[`${overallQ.text}_var`] as number))[0] : null;
    const wordQ = session.questions.find((q: any) => q.scope === "VARIANT" && q.type === "TEXT" && q.text.toLowerCase().includes("palabra"));
    const wordsByVariant: Record<string, string[]> = {};
    if (wordQ) {
      session.variants.forEach((v: any) => {
        const ws = session.responses.filter((r: any) => r.questionId === wordQ.id && r.variantId === v.id && r.value).map((r: any) => (r.value as string).trim());
        wordsByVariant[v.id] = [...new Set(ws)] as string[];
      });
    }
    const whyQ = session.questions.find((q: any) => q.scope === "GLOBAL" && (q.text.toLowerCase().includes("por q") || q.text.toLowerCase().includes("por qu")));
    const whyComments = whyQ ? session.responses.filter((r: any) => r.questionId === whyQ.id && r.value) : [];
    const prefQ = session.questions.find((q: any) => q.scope === "GLOBAL" && q.text.toLowerCase().includes("preferiste"));
    const prefVotes = session.variants.map((v: any) => ({
      code: v.code, id: v.id,
      count: session.responses.filter((r: any) => r.questionId === prefQ?.id && r.value === v.code).length
    })).sort((a: any, b: any) => b.count - a.count);
    const totalPrefVoters = prefVotes.reduce((s: number, v: any) => s + v.count, 0);

    return { starQs, optionQs, allAvg, ipaAvg, casualAvg, radarData, recommendation, polarizing, categoryComparisons, wordsByVariant, whyComments, prefVotes, totalPrefVoters, overallQ };
  }, [session]);

  const curAvg = activeSegment === "ALL" ? insights.allAvg : activeSegment === "IPA" ? insights.ipaAvg : insights.casualAvg;
  const attrData = insights.starQs.map((q: any) => {
    const e: any = { attribute: q.text };
    curAvg.forEach((v: any) => { e[v.code] = v[q.text]; });
    return e;
  });

  const exportCSV = useCallback(() => {
    const sq = insights.starQs;
    const headers = ["Nombre","Cerveza","IPA",...session.variants.flatMap((v: any) => sq.map((q: any) => `${v.code}-${q.text}`)),"Preferida","Por que"];
    const rows = session.profiles.map((p: any) => {
      const row: string[] = [p.name, p.drinksBeer?"Si":"No", p.drinksIpa?"Si":"No"];
      session.variants.forEach((v: any) => sq.forEach((q: any) => {
        const resp = session.responses.find((x: any) => x.profileId===p.id && x.questionId===q.id && x.variantId===v.id);
        row.push(resp?.value||"");
      }));
      const pQ = session.questions.find((q: any) => q.scope==="GLOBAL" && q.text.toLowerCase().includes("preferiste"));
      const pR = session.responses.find((x: any) => x.profileId===p.id && x.questionId===pQ?.id);
      const wQ = session.questions.find((q: any) => q.scope==="GLOBAL" && q.text.toLowerCase().includes("por q"));
      const wR = session.responses.find((x: any) => x.profileId===p.id && x.questionId===wQ?.id);
      row.push(pR?.value||"", wR?.value||"");
      return row;
    });
    const csv = [headers,...rows].map(row => row.map((c: any) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    const a = Object.assign(document.createElement("a"),{href:url,download:`admin_export_${session.flavor.name}.csv`});
    a.click(); URL.revokeObjectURL(url);
  }, [session, insights]);

  return (
    <div style={{maxWidth:"1400px",margin:"0 auto",padding:"0 1.5rem 4rem"}}>
      <header style={{padding:"2.5rem 0",marginBottom:"2rem",display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
        <div>
          <Link href="/admin" style={{display:"flex",alignItems:"center",gap:"0.3rem",color:"var(--muted)",textDecoration:"none",fontSize:"0.7rem",marginBottom:"0.5rem",fontWeight:"700",textTransform:"uppercase"}}>
            <ChevronLeft size={12}/> Panel Lupulus
          </Link>
          <h1 style={{margin:0,fontSize:"2.8rem",fontWeight:"950",color:"var(--dark)",letterSpacing:"-2px",lineHeight:0.9}}>
            {session.flavor.name} <span style={{color:"var(--gold)",fontWeight:"300"}}>Analytics</span>
          </h1>
          <div style={{color:"var(--muted)",fontSize:"0.8rem",marginTop:"0.6rem",display:"flex",gap:"0.8rem",fontWeight:"600"}}>
            <span>ID: <code style={{color:"var(--dark)"}}>{session.customCode||session.id.slice(-8).toUpperCase()}</code></span>
            <span></span><span>{new Date(session.createdAt).toLocaleDateString()}</span>
            <span></span>
            <span style={{color:status==="ACTIVE"?"var(--green)":status==="PAUSED"?"#f59e0b":"#6b7280"}}> {status}</span>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"0.6rem",alignItems:"flex-end"}}>
          <div style={{display:"flex",gap:"0.3rem",background:"white",padding:"0.4rem",borderRadius:"12px",boxShadow:"0 10px 25px rgba(0,0,0,0.06)"}}>
            {[["ACTIVE","var(--green)","LIVE"],["PAUSED","#f59e0b","PAUSA"],["TERMINATED","#4b5563","CERRAR"]].map(([s,bg,label])=>(
              <button key={s} onClick={()=>handleStatusChange(s)} style={{padding:"0.5rem 1rem",borderRadius:"8px",border:"none",background:status===s?bg:"transparent",color:status===s?"white":"#9ca3af",cursor:"pointer",fontWeight:"800",fontSize:"0.7rem"}}>
                {label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:"0.5rem"}}>
            <button onClick={handleManualRefresh} style={{padding:"0.5rem 1rem",borderRadius:"8px",border:"1px solid #e5e7eb",background:"white",cursor:"pointer",fontSize:"0.7rem",fontWeight:"800"}}>
              Refrescar
            </button>
            <button onClick={copySessionUrl} style={{padding:"0.5rem 1rem",borderRadius:"8px",border:"1px solid #e5e7eb",background:"white",color:copied?"var(--green)":"inherit",cursor:"pointer",fontSize:"0.7rem",fontWeight:"800"}}>
              {copied?"Copiado!":"Link Cata"}
            </button>
            <button onClick={exportCSV} style={{padding:"0.5rem 1rem",borderRadius:"8px",border:"none",background:"var(--dark)",color:"white",cursor:"pointer",fontSize:"0.7rem",fontWeight:"800"}}>
              CSV
            </button>
          </div>
        </div>
      </header>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1.5rem",marginBottom:"2rem"}}>
        <div style={{background:"var(--dark)",padding:"1.8rem",borderRadius:"28px",boxShadow:"0 20px 40px rgba(30,58,34,0.2)",color:"white"}}>
          <div style={{color:"var(--gold)",marginBottom:"1rem",fontSize:"0.7rem",fontWeight:"900",textTransform:"uppercase",letterSpacing:"1px"}}>Industrial Pick</div>
          <div style={{fontSize:"3.8rem",fontWeight:"950",lineHeight:1,marginBottom:"0.5rem"}}>{insights.recommendation?.code||"—"}</div>
          <div style={{fontSize:"0.8rem",opacity:0.7}}>Basado en satisfaccin e intencin de compra.</div>
        </div>
        <div style={{background:"white",padding:"1.8rem",borderRadius:"28px",boxShadow:"0 4px 20px rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.5rem"}}>
            <div style={{background:"#f0fdf4",color:"var(--green)",width:48,height:48,borderRadius:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}><Users/></div>
            <div><div style={{fontSize:"2rem",fontWeight:"950"}}>{session.profiles.length}</div><div style={{fontSize:"0.6rem",color:"var(--muted)",fontWeight:"800",textTransform:"uppercase"}}>Catadores</div></div>
          </div>
          <div style={{display:"flex",gap:"0.5rem"}}>{session.profiles.filter((p: any)=>p.drinksIpa).length} IPA / {session.profiles.filter((p: any)=>!p.drinksIpa).length} Casual</div>
        </div>
        <div style={{background:"#fff7ed",padding:"1.8rem",borderRadius:"28px",border:"1px solid #ffedd5"}}>
          <div style={{color:"#f97316",marginBottom:"1rem",fontSize:"0.7rem",fontWeight:"900",textTransform:"uppercase"}}>Polarization</div>
          <div style={{fontSize:"2.8rem",fontWeight:"950",color:"#7c2d12"}}>{insights.polarizing?.code || "—"}</div>
          <div style={{fontSize:"0.8rem",color:"#9a3412"}}>Altamente divisiva.</div>
        </div>
      </div>

      <div style={{background:"var(--dark)",padding:"2.5rem",borderRadius:"32px",marginBottom:"2rem",color:"white"}}>
        <h2 style={{fontSize:"1.6rem",fontWeight:"950",marginBottom:"1.5rem"}}>Huella Sensorial Absoluta</h2>
        <div style={{height:450,width:"100%"}}>
          <ResponsiveContainer><RadarChart data={insights.radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)"/><PolarAngleAxis dataKey="subject" tick={{fontSize:12,fill:"rgba(255,255,255,0.7)",fontWeight:700}}/><PolarRadiusAxis domain={[0,6]} tick={false} axisLine={false}/>
            {session.variants.map((v: any,i: number)=>(<Radar key={v.id} name={v.code} dataKey={v.code} stroke={VARIANT_COLORS[i%VARIANT_COLORS.length]} fill={VARIANT_COLORS[i%VARIANT_COLORS.length]} fillOpacity={0.2} strokeWidth={3}/>))}
            <Tooltip contentStyle={{background:"#111",border:"none",borderRadius:12}}/><Legend iconType="circle"/>
          </RadarChart></ResponsiveContainer>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(500px, 1fr))",gap:"1.5rem",marginBottom:"2rem"}}>
        {insights.categoryComparisons.map((cat:any)=>(
          <div key={cat.id} style={{background:"white",padding:"1.5rem",borderRadius:"28px",boxShadow:"0 4px 20px rgba(0,0,0,0.04)"}}>
            <h3 style={{fontWeight:"900",fontSize:"1.1rem",marginBottom:"1.2rem"}}>{cat.text}</h3>
            <div style={{height:250}}>
              <ResponsiveContainer><BarChart data={cat.data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)"/><XAxis dataKey="option" tick={{fontSize:10,fontWeight:700}}/><YAxis hide/><Tooltip cursor={{fill:"rgba(0,0,0,0.02)"}}/><Legend iconType="circle"/>
                {session.variants.map((v: any,i: number)=>(<Bar key={v.id} dataKey={v.code} fill={VARIANT_COLORS[i%VARIANT_COLORS.length]} radius={[4,4,0,0]} barSize={20}/>))}
              </BarChart></ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      <div style={{background:"white",padding:"2rem",borderRadius:"32px",boxShadow:"0 10px 40px rgba(0,0,0,0.05)"}}>
        <h3 style={{fontWeight:"950",fontSize:"1.6rem",marginBottom:"1.5rem"}}>Matriz Final</h3>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"separate",borderSpacing:"0 0.5rem"}}>
          <thead><tr style={{fontSize:"0.7rem",textTransform:"uppercase",textAlign:"left"}}><th>Catador</th>{insights.starQs.map((q: any)=>session.variants.map((v: any)=>(<th key={`${v.id}_${q.id}`} style={{textAlign:"center"}}>{v.code}/{q.text.slice(0,4)}</th>)))}<th style={{textAlign:"right"}}>Favorita</th></tr></thead>
          <tbody>{session.profiles.map((p: any)=>{
            const prefQ=session.questions.find((q: any)=>q.scope==="GLOBAL"&&q.text.toLowerCase().includes("preferiste"));
            const pref=session.responses.find((r: any)=>r.profileId===p.id && r.questionId===prefQ?.id)?.value;
            const doneQs=session.responses.filter((r: any)=>r.profileId===p.id).length;
            const totalTargetQs=(insights.starQs.length+insights.optionQs.length)*session.variants.length;
            const pct=Math.min(100,Math.round(doneQs/totalTargetQs*100));
            const vi=session.variants.findIndex((v: any)=>v.code===pref);
            const pc=vi>=0?VARIANT_COLORS[vi%VARIANT_COLORS.length]:"#e5e7eb";
            return(<tr key={p.id}>
              <td style={{padding:"1rem",background:"#f9fafb",borderRadius:"14px 0 0 14px",borderLeft:`8px solid ${pc}`}}>
                <div style={{fontWeight:800}}>{p.name}</div>
                <div style={{fontSize:"0.6rem",color:"var(--muted)"}}>{pct}% completado</div>
              </td>
              {insights.starQs.map((q: any)=>session.variants.map((v: any)=>{
                const s=session.responses.find((r: any)=>r.profileId===p.id&&r.questionId===q.id&&r.variantId===v.id)?.value;
                return(<td key={`${v.id}_${q.id}`} style={{textAlign:"center",background:"#f9fafb",fontWeight:700}}>{s??"-"}</td>);
              }))}
              <td style={{padding:"1rem",background:"#f9fafb",borderRadius:"0 14px 14px 0",textAlign:"right",fontWeight:900,color:pc,fontSize:"1.2rem"}}>{pref??"-"}</td>
            </tr>);
          })}</tbody>
        </table></div>
      </div>
    </div>
  );
}