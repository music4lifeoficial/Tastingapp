'use client'

import { useState, useMemo, useEffect, useCallback } from "react";
import { updateSessionStatus } from "../../../actions";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  Play, Pause, Square, Users, ChevronLeft,
  Zap, AlertTriangle, Copy, Check, Download, RefreshCw, MessageSquare
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
    setTimeout(() => setCopied(false), 2500);
  };

  const insights = useMemo(() => {
    const starQs = session.questions
      .filter((q: any) => q.type === "STAR" && q.scope === "VARIANT")
      .sort((a: any, b: any) => a.order - b.order);
    const optionQs = session.questions
      .filter((q: any) => q.type === "OPTION" && q.scope === "VARIANT")
      .sort((a: any, b: any) => a.order - b.order);
    const overallQ = starQs.find((q: any) => q.text.toLowerCase().includes("general")) || starQs[0];

    const calcAvg = (profiles: any[]) => {
      const ids = profiles.map((p: any) => p.id);
      return session.variants.map((v: any) => {
        const vR = session.responses.filter((r: any) => r.variantId === v.id && ids.includes(r.profileId));
        const d: any = { code: v.code, id: v.id };
        starQs.forEach((q: any) => {
          const scores = vR.filter((r: any) => r.questionId === q.id).map((r: any) => parseFloat(r.value));
          const avg = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
          const variance = scores.length > 1 ? scores.reduce((a: number, b: number) => a + Math.pow(b - avg, 2), 0) / scores.length : 0;
          d[q.text] = parseFloat(avg.toFixed(1));
          d[`${q.text}_var`] = parseFloat(variance.toFixed(2));
        });
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

    const favorite = overallQ ? [...allAvg].sort((a, b) => b[overallQ.text] - a[overallQ.text])[0] : null;
    const polarizing = overallQ ? [...allAvg].sort((a, b) => b[`${overallQ.text}_var`] - a[`${overallQ.text}_var`])[0] : null;

    const optionDist: Record<string, any> = {};
    optionQs.forEach((q: any) => {
      optionDist[q.id] = {
        question: q.text,
        byVariant: session.variants.map((v: any) => {
          const vR = session.responses.filter((r: any) => r.questionId === q.id && r.variantId === v.id);
          const opts = (q.options || "").split(",").map((o: string) => o.trim());
          return {
            code: v.code, id: v.id,
            dist: opts.map((opt: string) => ({ option: opt, count: vR.filter((r: any) => r.value === opt).length, total: vR.length }))
          };
        })
      };
    });

    const wordQ = session.questions.find((q: any) => q.scope === "VARIANT" && q.type === "TEXT" && q.text.toLowerCase().includes("palabra"));
    const wordsByVariant: Record<string, string[]> = {};
    if (wordQ) {
      session.variants.forEach((v: any) => {
        const ws = session.responses.filter((r: any) => r.questionId === wordQ.id && r.variantId === v.id && r.value).map((r: any) => (r.value as string).trim());
        wordsByVariant[v.id] = [...new Set(ws)] as string[];
      });
    }

    const whyQ = session.questions.find((q: any) => q.scope === "GLOBAL" && q.text.toLowerCase().includes("por q"));
    const whyComments = whyQ ? session.responses.filter((r: any) => r.questionId === whyQ.id && r.value) : [];

    const prefQ = session.questions.find((q: any) => q.scope === "GLOBAL" && q.text.toLowerCase().includes("preferiste"));
    const prefVotes = session.variants.map((v: any) => ({
      code: v.code, id: v.id,
      count: session.responses.filter((r: any) => r.questionId === prefQ?.id && r.value === v.code).length
    })).sort((a: any, b: any) => b.count - a.count);
    const totalPrefVoters = prefVotes.reduce((s: number, v: any) => s + v.count, 0);

    return { starQs, optionQs, overallQ, allAvg, ipaAvg, casualAvg, radarData, favorite, polarizing, optionDist, wordsByVariant, whyComments, prefVotes, totalPrefVoters };
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
      const r: string[] = [p.name, p.drinksBeer?"Si":"No", p.drinksIpa?"Si":"No"];
      session.variants.forEach((v: any) => sq.forEach((q: any) => {
        const resp = session.responses.find((x: any) => x.profileId===p.id && x.questionId===q.id && x.variantId===v.id);
        r.push(resp?.value||"");
      }));
      const pQ = session.questions.find((q: any) => q.scope==="GLOBAL" && q.text.toLowerCase().includes("preferiste"));
      const pR = session.responses.find((x: any) => x.profileId===p.id && x.questionId===pQ?.id);
      const wQ = session.questions.find((q: any) => q.scope==="GLOBAL" && q.text.toLowerCase().includes("por q"));
      const wR = session.responses.find((x: any) => x.profileId===p.id && x.questionId===wQ?.id);
      r.push(pR?.value||"", wR?.value||"");
      return r;
    });
    const csv = [headers,...rows].map(row => row.map((c:any)=>`"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    const a = Object.assign(document.createElement("a"),{href:url,download:`cata_${session.flavor.name}_${session.id.slice(-6)}.csv`});
    a.click(); URL.revokeObjectURL(url);
  }, [session, insights]);
  return (
    <div style={{maxWidth:"1400px",margin:"0 auto",padding:"0 1.5rem 4rem"}}>

      <header style={{padding:"2rem 0",marginBottom:"2rem",display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
        <div>
          <Link href="/admin" style={{display:"flex",alignItems:"center",gap:"0.4rem",color:"var(--muted)",textDecoration:"none",fontSize:"0.75rem",marginBottom:"0.7rem",fontWeight:"700",textTransform:"uppercase",letterSpacing:"1px"}}>
            <ChevronLeft size={12}/> Panel de Control
          </Link>
          <h1 style={{margin:0,fontSize:"2.5rem",fontWeight:"900",color:"var(--dark)",letterSpacing:"-1.5px",lineHeight:1}}>
            {session.flavor.name} <span style={{color:"var(--gold)",fontWeight:"300"}}>Analytics</span>
          </h1>
          <div style={{color:"var(--muted)",fontSize:"0.85rem",marginTop:"0.5rem",display:"flex",gap:"1rem",flexWrap:"wrap"}}>
            <span>ID: <strong style={{color:"var(--text)"}}>{session.customCode||session.id.slice(-8).toUpperCase()}</strong></span>
            <span>�</span><span>{new Date(session.createdAt).toLocaleDateString()}</span>
            <span>�</span>
            <span style={{color:status==="ACTIVE"?"var(--green)":status==="PAUSED"?"#f59e0b":"#6b7280",fontWeight:700}}>? {status}</span>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"0.8rem",alignItems:"flex-end"}}>
          <div style={{display:"flex",gap:"0.4rem",background:"white",padding:"0.5rem",borderRadius:"14px",boxShadow:"0 4px 15px rgba(0,0,0,0.06)"}}>
            {[["ACTIVE","var(--green)","LIVE"],["PAUSED","#f59e0b","PAUSA"],["TERMINATED","#4b5563","CERRAR"]].map(([s,bg,label])=>(
              <button key={s} onClick={()=>handleStatusChange(s)} style={{display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.5rem 1rem",borderRadius:"10px",border:"none",background:status===s?bg:"transparent",color:status===s?"white":"#9ca3af",cursor:"pointer",fontWeight:"700",fontSize:"0.78rem"}}>
                {s==="ACTIVE"?<Play size={11} fill="currentColor"/>:s==="PAUSED"?<Pause size={11} fill="currentColor"/>:<Square size={11} fill="currentColor"/>} {label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:"0.5rem"}}>
            <button onClick={handleManualRefresh} style={{display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.55rem 1rem",borderRadius:"10px",border:"1px solid #e5e7eb",background:"white",color:"#6b7280",cursor:"pointer",fontSize:"0.78rem",fontWeight:"700"}}>
              <RefreshCw size={12} style={{animation:isRefreshing?"spin 0.8s linear infinite":"none"}}/> Actualizar
            </button>
            <button onClick={copySessionUrl} style={{display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.55rem 1rem",borderRadius:"10px",border:"1px solid #e5e7eb",background:"white",color:copied?"var(--green)":"#6b7280",cursor:"pointer",fontSize:"0.78rem",fontWeight:"700"}}>
              {copied?<Check size={12}/>:<Copy size={12}/>} {copied?"Copiado!":"Compartir URL"}
            </button>
            <button onClick={exportCSV} style={{display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.55rem 1rem",borderRadius:"10px",border:"none",background:"var(--dark)",color:"white",cursor:"pointer",fontSize:"0.78rem",fontWeight:"700"}}>
              <Download size={12}/> CSV
            </button>
          </div>
        </div>
      </header>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"1.5rem",marginBottom:"2.5rem"}}>
        <div style={{background:"linear-gradient(145deg,white,#f0fdf4)",padding:"1.8rem",borderRadius:"24px",boxShadow:"0 4px 20px rgba(0,0,0,0.04)",border:"1px solid rgba(45,106,63,0.1)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.6rem",color:"var(--green)",marginBottom:"1rem",fontSize:"0.7rem",fontWeight:"800",textTransform:"uppercase",letterSpacing:"1px"}}>
            <Zap size={14} fill="currentColor"/> Crowd Favorite
          </div>
          <div style={{fontSize:"3rem",fontWeight:"900",color:"var(--dark)",lineHeight:1}}>{insights.favorite?.code||"�"}</div>
          {insights.overallQ&&insights.favorite&&(
            <div style={{marginTop:"0.5rem",color:"var(--muted)",fontSize:"0.85rem"}}>
              Puntaje General: <strong style={{color:"var(--dark)"}}>{insights.favorite[insights.overallQ.text]} / 6</strong>
            </div>
          )}
        </div>

        <div style={{background:"linear-gradient(145deg,white,#fff7ed)",padding:"1.8rem",borderRadius:"24px",boxShadow:"0 4px 20px rgba(0,0,0,0.04)",border:"1px solid rgba(196,90,42,0.1)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.6rem",color:"var(--accent)",marginBottom:"1rem",fontSize:"0.7rem",fontWeight:"800",textTransform:"uppercase",letterSpacing:"1px"}}>
            <AlertTriangle size={14} fill="currentColor"/> Most Polarizing
          </div>
          <div style={{fontSize:"3rem",fontWeight:"900",color:"var(--dark)",lineHeight:1}}>{insights.polarizing?.code||"�"}</div>
          <div style={{marginTop:"0.5rem",color:"var(--muted)",fontSize:"0.85rem"}}>Alta varianza. <strong style={{color:"var(--dark)"}}>Sabor de nicho.</strong></div>
        </div>

        <div style={{background:"var(--dark)",padding:"1.8rem",borderRadius:"24px",boxShadow:"0 20px 40px rgba(30,58,34,0.15)",color:"white"}}>
          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
            <div style={{background:"var(--gold)",color:"var(--dark)",width:"52px",height:"52px",borderRadius:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Users size={26}/>
            </div>
            <div>
              <div style={{fontSize:"2.5rem",fontWeight:"900",lineHeight:1}}>{session.profiles.length}</div>
              <div style={{fontSize:"0.65rem",opacity:0.6,fontWeight:"700",textTransform:"uppercase",letterSpacing:"1px"}}>Catadores</div>
            </div>
          </div>
          <div style={{marginTop:"1.2rem",paddingTop:"1.2rem",borderTop:"1px solid rgba(255,255,255,0.1)",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.5rem"}}>
            {[
              [session.profiles.filter((p:any)=>p.drinksIpa).length,"IPA"],
              [session.profiles.filter((p:any)=>p.drinksBeer&&!p.drinksIpa).length,"Beer"],
              [session.profiles.filter((p:any)=>!p.drinksBeer).length,"Casual"]
            ].map(([n,l])=>(
              <div key={l as string} style={{textAlign:"center"}}>
                <div style={{fontSize:"1.4rem",fontWeight:"900",color:l==="IPA"?"var(--gold)":"white"}}>{n}</div>
                <div style={{fontSize:"0.6rem",opacity:0.6,textTransform:"uppercase"}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.2fr 0.8fr",gap:"2rem",marginBottom:"2rem"}}>
        <div style={{background:"white",padding:"2rem",borderRadius:"28px",boxShadow:"0 4px 20px rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.05)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.5rem"}}>
            <div>
              <h3 style={{fontWeight:"800",fontSize:"1.2rem",margin:0}}>Comparativa por Atributo</h3>
              <p style={{color:"var(--muted)",fontSize:"0.82rem",margin:"0.3rem 0 0"}}>En cada barra: �cu�l variante gana en ese atributo?</p>
            </div>
            <div style={{display:"flex",gap:"0.3rem",background:"#f3f4f6",padding:"0.3rem",borderRadius:"12px"}}>
              {[["ALL","Global"],["IPA","IPA"],["NON_IPA","Casuals"]].map(([s,l])=>(
                <button key={s} onClick={()=>setActiveSegment(s)} style={{padding:"0.4rem 0.8rem",border:"none",borderRadius:"8px",fontSize:"0.7rem",fontWeight:"800",cursor:"pointer",background:activeSegment===s?"white":"transparent",color:activeSegment===s?"var(--dark)":"#9ca3af",boxShadow:activeSegment===s?"0 2px 8px rgba(0,0,0,0.07)":"none",transition:"all 0.2s"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div style={{height:"340px"}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attrData} margin={{top:5,right:10,left:-10,bottom:5}} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)"/>
                <XAxis dataKey="attribute" axisLine={false} tickLine={false} tick={{fill:"#9ca3af",fontWeight:700,fontSize:11}}/>
                <YAxis domain={[0,6]} axisLine={false} tickLine={false} tick={{fill:"#9ca3af",fontSize:11}}/>
                <Tooltip contentStyle={{borderRadius:"14px",border:"none",boxShadow:"0 8px 25px rgba(0,0,0,0.08)",fontWeight:700,fontSize:13}} cursor={{fill:"rgba(0,0,0,0.02)"}} formatter={(v:any)=>[`${v}/6`,""]}/>
                <Legend iconType="circle" wrapperStyle={{paddingTop:"1rem",fontSize:"12px",fontWeight:700}}/>
                {session.variants.map((v:any,i:number)=>(
                  <Bar key={v.id} dataKey={v.code} fill={VARIANT_COLORS[i%VARIANT_COLORS.length]} radius={[6,6,0,0]} barSize={36}/>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{background:"white",padding:"2rem",borderRadius:"28px",boxShadow:"0 4px 20px rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.05)"}}>
          <h3 style={{fontWeight:"800",fontSize:"1.2rem",margin:"0 0 0.3rem"}}>Huella Sensorial</h3>
          <p style={{color:"var(--muted)",fontSize:"0.82rem",margin:"0 0 1rem"}}>Perfil organol�ptico comparativo</p>
          <div style={{height:"360px"}}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={insights.radarData}>
                <PolarGrid stroke="rgba(0,0,0,0.08)"/>
                <PolarAngleAxis dataKey="subject" tick={{fontSize:11,fontWeight:700,fill:"#6b7280"}}/>
                <PolarRadiusAxis domain={[0,6]} tick={false} axisLine={false}/>
                {session.variants.map((v:any,i:number)=>(
                  <Radar key={v.id} name={v.code} dataKey={v.code} stroke={VARIANT_COLORS[i%VARIANT_COLORS.length]} fill={VARIANT_COLORS[i%VARIANT_COLORS.length]} fillOpacity={0.25} strokeWidth={2}/>
                ))}
                <Tooltip contentStyle={{borderRadius:"12px",border:"none",boxShadow:"0 4px 15px rgba(0,0,0,0.1)"}} formatter={(v:any)=>[`${v}/6`,""]}/>
                <Legend iconType="circle" wrapperStyle={{paddingTop:"0.5rem",fontSize:"12px",fontWeight:700}}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {insights.optionQs.length>0&&(
        <div style={{background:"white",padding:"2rem",borderRadius:"28px",boxShadow:"0 4px 20px rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.05)",marginBottom:"2rem"}}>
          <h3 style={{fontWeight:"800",fontSize:"1.2rem",margin:"0 0 0.3rem"}}>Distribuci�n de Opciones</h3>
          <p style={{color:"var(--muted)",fontSize:"0.82rem",margin:"0 0 2rem"}}>Respuestas a preguntas de selecci�n, por variante.</p>
          <div style={{display:"flex",flexDirection:"column",gap:"2rem"}}>
            {insights.optionQs.map((q:any)=>{
              const dist=insights.optionDist[q.id];
              if(!dist)return null;
              return(
                <div key={q.id}>
                  <div style={{fontWeight:"700",fontSize:"0.9rem",marginBottom:"1rem",color:"var(--dark)"}}>{q.text}</div>
                  <div style={{display:"grid",gridTemplateColumns:`repeat(${session.variants.length},1fr)`,gap:"1rem"}}>
                    {dist.byVariant.map((v:any,vi:number)=>(
                      <div key={v.id} style={{background:"#f9fafb",borderRadius:"16px",padding:"1.2rem",borderTop:`4px solid ${VARIANT_COLORS[vi%VARIANT_COLORS.length]}`}}>
                        <div style={{fontWeight:"900",fontSize:"1rem",marginBottom:"0.8rem",color:VARIANT_COLORS[vi%VARIANT_COLORS.length]}}>{v.code}</div>
                        {v.dist.map((item:any)=>{
                          const pct=item.total>0?Math.round(item.count/item.total*100):0;
                          return(
                            <div key={item.option} style={{marginBottom:"0.6rem"}}>
                              <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem",fontWeight:"700",color:"#4b5563",marginBottom:"0.2rem"}}>
                                <span>{item.option}</span><span>{pct}%</span>
                              </div>
                              <div style={{height:"6px",background:"#e5e7eb",borderRadius:"100px",overflow:"hidden"}}>
                                <div style={{width:`${pct}%`,height:"100%",background:VARIANT_COLORS[vi%VARIANT_COLORS.length],borderRadius:"100px",transition:"width 0.8s"}}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2rem",marginBottom:"2rem"}}>
        <div style={{background:"white",padding:"2rem",borderRadius:"28px",boxShadow:"0 4px 20px rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.05)"}}>
          <h3 style={{fontWeight:"800",fontSize:"1.2rem",margin:"0 0 1.5rem"}}>Share de Preferencia</h3>
          {insights.prefVotes.map((v:any,i:number)=>{
            const varIdx=session.variants.findIndex((sv:any)=>sv.id===v.id);
            const color=VARIANT_COLORS[varIdx%VARIANT_COLORS.length];
            const pct=insights.totalPrefVoters>0?Math.round(v.count/insights.totalPrefVoters*100):0;
            return(
              <div key={v.id} style={{marginBottom:"1.2rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:color}}></div>
                    <span style={{fontWeight:"900",fontSize:"1.1rem"}}>{v.code}</span>
                    {i===0&&insights.totalPrefVoters>0&&<span style={{fontSize:"0.6rem",background:"rgba(45,106,63,0.1)",color:"var(--green)",padding:"2px 7px",borderRadius:"100px",fontWeight:"800"}}>WINNER</span>}
                  </div>
                  <span style={{fontWeight:"700",color:"var(--muted)",fontSize:"0.85rem"}}>{v.count} votos</span>
                </div>
                <div style={{height:20,background:"#f3f4f6",borderRadius:"100px",overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:"100px",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:8,transition:"width 1s"}}>
                    {pct>15&&<span style={{fontSize:"0.7rem",fontWeight:"900",color:"white"}}>{pct}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {insights.totalPrefVoters===0&&<p style={{color:"var(--muted)",fontStyle:"italic",fontSize:"0.9rem"}}>Sin votos a�n.</p>}
        </div>

        <div style={{background:"white",padding:"2rem",borderRadius:"28px",boxShadow:"0 4px 20px rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"1.5rem"}}>
            <h3 style={{fontWeight:"800",fontSize:"1.2rem",margin:0}}>�Por qu� esa variante?</h3>
            <MessageSquare size={16} color="var(--muted)"/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"0.8rem",maxHeight:"280px",overflowY:"auto"}}>
            {insights.whyComments.map((r:any,i:number)=>{
              const profile=session.profiles.find((p:any)=>p.id===r.profileId);
              const prefQ=session.questions.find((q:any)=>q.scope==="GLOBAL"&&q.text.toLowerCase().includes("preferiste"));
              const pref=session.responses.find((x:any)=>x.profileId===r.profileId&&x.questionId===prefQ?.id)?.value;
              const vi=session.variants.findIndex((v:any)=>v.code===pref);
              const color=vi>=0?VARIANT_COLORS[vi%VARIANT_COLORS.length]:"var(--gold)";
              return(
                <div key={i} style={{padding:"0.9rem",background:"#f9fafb",borderRadius:"14px",borderLeft:`4px solid ${color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.3rem"}}>
                    <span style={{fontWeight:"800",fontSize:"0.72rem",color:"var(--muted)"}}>{profile?.name||"An�nimo"}</span>
                    {pref&&<span style={{fontWeight:"900",fontSize:"0.72rem",color}}>{pref}</span>}
                  </div>
                  <div style={{fontSize:"0.88rem",color:"var(--text)",fontStyle:"italic"}}>"{r.value}"</div>
                </div>
              );
            })}
            {insights.whyComments.length===0&&<p style={{color:"var(--muted)",fontStyle:"italic",fontSize:"0.9rem"}}>Sin comentarios a�n.</p>}
          </div>
        </div>
      </div>

      {Object.keys(insights.wordsByVariant).length>0&&(
        <div style={{background:"white",padding:"2rem",borderRadius:"28px",boxShadow:"0 4px 20px rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.05)",marginBottom:"2rem"}}>
          <h3 style={{fontWeight:"800",fontSize:"1.2rem",margin:"0 0 0.3rem"}}>Descriptores por Variante</h3>
          <p style={{color:"var(--muted)",fontSize:"0.82rem",margin:"0 0 1.5rem"}}>Una palabra o frase que describe cada muestra.</p>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${session.variants.length},1fr)`,gap:"1.5rem"}}>
            {session.variants.map((v:any,vi:number)=>(
              <div key={v.id} style={{borderTop:`4px solid ${VARIANT_COLORS[vi%VARIANT_COLORS.length]}`,paddingTop:"1rem"}}>
                <div style={{fontWeight:"900",fontSize:"1.1rem",color:VARIANT_COLORS[vi%VARIANT_COLORS.length],marginBottom:"0.8rem"}}>{v.code}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem"}}>
                  {(insights.wordsByVariant[v.id]||[]).map((word:string,wi:number)=>(
                    <span key={wi} style={{padding:"0.4rem 1rem",background:`${VARIANT_COLORS[vi%VARIANT_COLORS.length]}12`,color:VARIANT_COLORS[vi%VARIANT_COLORS.length],borderRadius:"100px",fontSize:"0.8rem",fontWeight:"700",border:`1px solid ${VARIANT_COLORS[vi%VARIANT_COLORS.length]}30`}}>{word}</span>
                  ))}
                  {(insights.wordsByVariant[v.id]||[]).length===0&&<span style={{color:"var(--muted)",fontSize:"0.85rem",fontStyle:"italic"}}>Sin descriptores</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{background:"white",padding:"2rem",borderRadius:"28px",boxShadow:"0 4px 20px rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.05)"}}>
        <h3 style={{fontWeight:"800",fontSize:"1.2rem",margin:"0 0 1.5rem"}}>Catadores � Raw Data</h3>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"separate",borderSpacing:"0 0.6rem"}}>
            <thead>
              <tr style={{color:"var(--muted)",fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"1px",textAlign:"left"}}>
                <th style={{padding:"0 1.5rem 0.5rem"}}>Catador</th>
                <th style={{padding:"0 0 0.5rem"}}>Segmento</th>
                {insights.starQs.map((q:any)=>session.variants.map((v:any)=>(
                  <th key={`${v.id}_${q.id}`} style={{padding:"0 0.8rem 0.5rem",textAlign:"center",whiteSpace:"nowrap"}}>{v.code}/{q.text.slice(0,5)}.</th>
                )))}
                <th style={{padding:"0 1.5rem 0.5rem",textAlign:"right"}}>Elige</th>
              </tr>
            </thead>
            <tbody>
              {session.profiles.map((p:any)=>{
                const prefQ=session.questions.find((q:any)=>q.scope==="GLOBAL"&&q.text.toLowerCase().includes("preferiste"));
                const prefResp=session.responses.find((r:any)=>r.profileId===p.id&&r.questionId===prefQ?.id)?.value;
                const totalQs=insights.starQs.length*session.variants.length;
                const doneQs=session.responses.filter((r:any)=>r.profileId===p.id&&insights.starQs.some((q:any)=>q.id===r.questionId)).length;
                const pct=totalQs>0?Math.round(doneQs/totalQs*100):0;
                const pvi=session.variants.findIndex((v:any)=>v.code===prefResp);
                const pc=pvi>=0?VARIANT_COLORS[pvi%VARIANT_COLORS.length]:"#e5e7eb";
                return(
                  <tr key={p.id}>
                    <td style={{padding:"1rem 1.5rem",background:"#f9fafb",borderRadius:"14px 0 0 14px",borderLeft:`4px solid ${pc}`}}>
                      <div style={{fontWeight:"800"}}>{p.name}</div>
                      <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginTop:"0.3rem"}}>
                        <div style={{width:50,background:"#e5e7eb",height:4,borderRadius:"100px"}}>
                          <div style={{width:`${pct}%`,height:"100%",background:pct===100?"var(--green)":"var(--gold)",borderRadius:"100px"}}></div>
                        </div>
                        <span style={{fontSize:"0.65rem",color:"var(--muted)",fontWeight:"700"}}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{padding:"1rem 0",background:"#f9fafb"}}>
                      <div style={{display:"flex",gap:"0.3rem"}}>
                        {p.drinksBeer&&<span style={{padding:"2px 6px",background:"rgba(30,58,34,0.08)",color:"var(--dark)",borderRadius:"6px",fontSize:"0.6rem",fontWeight:"800"}}>BEER</span>}
                        {p.drinksIpa&&<span style={{padding:"2px 6px",background:"rgba(200,164,21,0.1)",color:"var(--gold)",borderRadius:"6px",fontSize:"0.6rem",fontWeight:"800"}}>IPA</span>}
                        {!p.drinksBeer&&!p.drinksIpa&&<span style={{padding:"2px 6px",background:"#f3f4f6",color:"#9ca3af",borderRadius:"6px",fontSize:"0.6rem",fontWeight:"800"}}>CASUAL</span>}
                      </div>
                    </td>
                    {insights.starQs.map((q:any)=>session.variants.map((v:any)=>{
                      const r=session.responses.find((r:any)=>r.profileId===p.id&&r.questionId===q.id&&r.variantId===v.id);
                      const score=r?parseInt(r.value):null;
                      return(
                        <td key={`${v.id}_${q.id}`} style={{padding:"1rem 0.8rem",background:"#f9fafb",textAlign:"center",fontWeight:"800",fontSize:"0.9rem",color:score?(score>=5?"var(--green)":score<=2?"var(--accent)":"var(--text)"):"#d1d5db"}}>
                          {score??"-"}
                        </td>
                      );
                    }))}
                    <td style={{padding:"1rem 1.5rem",background:"#f9fafb",borderRadius:"0 14px 14px 0",textAlign:"right",fontWeight:"900",fontSize:"1rem",color:pc}}>
                      {prefResp||"�"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}