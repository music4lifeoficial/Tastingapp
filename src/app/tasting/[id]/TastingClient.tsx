'use client'

import { useState, useMemo } from "react";
import { submitAllResponses, createProfile } from "../../actions";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Star, CheckCircle2, Lock } from "lucide-react";

export default function TastingClient({ session, profile: initialProfile }: { session: any, profile: any }) {
  const router = useRouter();
  const [step, setStep] = useState(initialProfile ? "evaluating" : "code");
  const [profile, setProfile] = useState(initialProfile);
  const [codeAttempt, setCodeAttempt] = useState("");
  const [codeError, setCodeError] = useState(false);
  
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter questions
  const variantQuestions = session.questions.filter((q: any) => q.scope === "VARIANT").sort((a: any, b: any) => a.order - b.order);
  const globalQuestions = session.questions.filter((q: any) => q.scope === "GLOBAL").sort((a: any, b: any) => a.order - b.order);

  const currentVariant = session.variants[activeVariantIdx];

  // Logic for code check
  const handleCodeSubmit = () => {
    if (!session.customCode || codeAttempt === session.customCode) {
      setStep("profile");
    } else {
      setCodeError(true);
    }
  };

  if (!session.customCode && step === "code") {
    setStep("profile");
  }

  // Helper to update responses
  const updateResponse = (questionId: string, variantId: string | null, value: string) => {
    setResponses(prev => {
      const filtered = prev.filter(r => !(r.questionId === questionId && r.variantId === variantId));
      return [...filtered, { questionId, variantId, value }];
    });
  };

  const getResponseValue = (questionId: string, variantId: string | null) => {
    return responses.find(r => r.questionId === questionId && r.variantId === variantId)?.value;
  };

  const isStepComplete = () => {
    if (step === "evaluating") {
      return variantQuestions.every((q: any) => getResponseValue(q.id, currentVariant.id));
    }
    if (step === "global") {
      return globalQuestions.every((q: any) => getResponseValue(q.id, null));
    }
    return true;
  };

  const handleNext = async () => {
    if (step === "evaluating") {
      if (activeVariantIdx < session.variants.length - 1) {
        setActiveVariantIdx(prev => prev + 1);
        window.scrollTo(0, 0);
      } else {
        setStep("global");
        window.scrollTo(0, 0);
      }
    } else if (step === "global") {
      setIsSubmitting(true);
      await submitAllResponses({
        sessionId: session.id,
        profileId: profile.id,
        responses
      });
      setStep("finish");
    }
  };

  // --- RENDERING ---

  if (step === "code") {
    return (
      <div className="card-container" style={{ padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Lock size={48} color="var(--gold)" style={{ margin: "0 auto", marginBottom: "1rem" }} />
          <h2>Sesión Privada</h2>
          <p style={{ color: "var(--muted)" }}>Esta sesión requiere un código de acceso.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input 
            type="text" 
            placeholder="Introduce el código" 
            value={codeAttempt}
            onChange={(e) => setCodeAttempt(e.target.value)}
            style={{ padding: "1rem", borderRadius: "12px", border: codeError ? "2px solid var(--accent)" : "1px solid #ddd", textAlign: "center", fontSize: "1.2rem", fontWeight: "bold" }}
          />
          {codeError && <p style={{ color: "var(--accent)", fontSize: "0.8rem", textAlign: "center" }}>Código incorrecto</p>}
          <button onClick={handleCodeSubmit} style={{ padding: "1rem", background: "var(--dark)", color: "white", borderRadius: "12px", border: "none", fontWeight: "bold" }}>Entrar</button>
        </div>
      </div>
    );
  }

  if (step === "profile") {
    return (
      <div className="card-container" style={{ padding: "2rem" }}>
         <header style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "var(--muted)", textTransform: "uppercase" }}>Paso 1 / 3</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--dark)" }}>Perfil de Catador</h2>
        </header>
        <form action={async (fd) => {
          // Note: In a real app we'd call an action here and redirect or update state.
          // For simplicity, we'll use our server action and then update local state manually.
          // Since createProfile redirects, we have to handle that. 
          // Let's just use the profile form as a client form here.
          const name = fd.get('name') as string;
          const drinksBeer = fd.get('drinksBeer') === 'on';
          const drinksIpa = fd.get('drinksIpa') === 'on';
          
          setIsSubmitting(true);
          // Manually call action 
          const result = await fetch('/api/profile', {
            method: 'POST',
            body: JSON.stringify({ sessionId: session.id, name, drinksBeer, drinksIpa })
          }).then(r => r.json());
          
          setProfile(result);
          setStep("evaluating");
          setIsSubmitting(false);
        }} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: "bold", fontSize: "0.9rem" }}>Tu nombre o apodo</label>
            <input name="name" required placeholder="Ej: Juan H." style={{ padding: "1rem", borderRadius: "12px", border: "1px solid #ddd" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
             <label style={{ display: "flex", gap: "1rem", alignItems: "center", background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #eee" }}>
                <input type="checkbox" name="drinksBeer" style={{ width: "20px", height: "20px" }} />
                <span>¿Tomas cerveza regularmente?</span>
             </label>
             <label style={{ display: "flex", gap: "1rem", alignItems: "center", background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #eee" }}>
                <input type="checkbox" name="drinksIpa" style={{ width: "20px", height: "20px" }} />
                <span>¿Te gustan las IPAs o cervezas lupuladas?</span>
             </label>
          </div>

          <button type="submit" disabled={isSubmitting} style={{ padding: "1rem", background: "var(--dark)", color: "white", borderRadius: "12px", border: "none", fontWeight: "bold" }}>
             Comenzar Cata →
          </button>
        </form>
      </div>
    );
  }

  if (step === "evaluating") {
    return (
      <div className="evaluation-container">
        <header style={{ padding: "1.5rem 1rem", background: "var(--dark)", color: "white", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>
             <span>{session.flavor.name}</span>
             <span>Muestra {activeVariantIdx + 1} de {session.variants.length}</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "900" }}>Código: {currentVariant.code}</div>
          <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", marginTop: "1rem" }}>
             <div style={{ width: `${((activeVariantIdx) / (session.variants.length)) * 100}%`, height: "100%", background: "var(--gold)", borderRadius: "2px", transition: "width 0.3s" }}></div>
          </div>
        </header>

        <div style={{ padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {variantQuestions.map((q: any, i: number) => (
            <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
                <span style={{ background: "var(--gold)", color: "white", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "bold", flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--dark)", lineHeight: 1.2 }}>{q.text}</span>
              </div>

              {q.type === "STAR" && (
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between" }}>
                  {[1, 2, 3, 4, 5, 6].map(val => (
                    <button 
                      key={val} 
                      onClick={() => updateResponse(q.id, currentVariant.id, String(val))}
                      style={{ 
                        flex: 1, height: "45px", borderRadius: "10px", border: "2px solid", 
                        borderColor: getResponseValue(q.id, currentVariant.id) === String(val) ? "var(--dark)" : "#ddd",
                        background: getResponseValue(q.id, currentVariant.id) === String(val) ? "var(--dark)" : "white",
                        color: getResponseValue(q.id, currentVariant.id) === String(val) ? "white" : "#666",
                        fontWeight: "bold", fontSize: "1.1rem"
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "OPTION" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                   {q.options?.split(',').map((opt: string) => (
                     <button
                        key={opt}
                        onClick={() => updateResponse(q.id, currentVariant.id, opt)}
                        style={{
                          padding: "1rem", borderRadius: "12px", border: "2px solid",
                          borderColor: getResponseValue(q.id, currentVariant.id) === opt ? "var(--dark)" : "#eee",
                          background: getResponseValue(q.id, currentVariant.id) === opt ? "var(--dark)" : "white",
                          color: getResponseValue(q.id, currentVariant.id) === opt ? "white" : "var(--dark)",
                          fontWeight: "600", textAlign: "left"
                        }}
                     >
                        {opt}
                     </button>
                   ))}
                </div>
              )}

              {q.type === "TEXT" && (
                <textarea 
                  placeholder="Tu respuesta..." 
                  value={getResponseValue(q.id, currentVariant.id) || ""}
                  onChange={(e) => updateResponse(q.id, currentVariant.id, e.target.value)}
                  style={{ padding: "1rem", borderRadius: "12px", border: "1px solid #ddd", minHeight: "80px", fontFamily: "inherit" }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: "2rem 1rem", background: "white", borderTop: "1px solid #eee", position: "sticky", bottom: 0, display: "flex", gap: "1rem" }}>
           {activeVariantIdx > 0 && (
             <button onClick={() => setActiveVariantIdx(prev => prev - 1)} style={{ flex: 1, padding: "1rem", borderRadius: "12px", border: "1px solid #ddd", background: "white", color: "#666", fontWeight: "bold" }}>Atrás</button>
           )}
           <button 
              onClick={handleNext} 
              disabled={!isStepComplete()}
              style={{ flex: 2, padding: "1rem", borderRadius: "12px", border: "none", background: isStepComplete() ? "var(--dark)" : "#ddd", color: "white", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              {activeVariantIdx < session.variants.length - 1 ? "Siguiente Muestra" : "Siguiente Paso"} <ChevronRight size={20} />
           </button>
        </div>
      </div>
    );
  }

  if (step === "global") {
    return (
      <div className="card-container" style={{ padding: "2rem" }}>
         <header style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "var(--muted)", textTransform: "uppercase" }}>Paso 3 / 3</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--dark)" }}>Preferencias Finales</h2>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {globalQuestions.map((q: any) => (
             <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--dark)" }}>{q.text}</span>
                
                {q.type === "OPTION" && (
                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      {session.variants.map((v: any) => (
                        <button
                           key={v.id}
                           onClick={() => updateResponse(q.id, null, v.code)}
                           style={{
                             padding: "1.2rem", borderRadius: "12px", border: "2px solid",
                             borderColor: getResponseValue(q.id, null) === v.code ? "var(--dark)" : "#eee",
                             background: getResponseValue(q.id, null) === v.code ? "var(--dark)" : "white",
                             color: getResponseValue(q.id, null) === v.code ? "white" : "var(--dark)",
                             fontWeight: "800", fontSize: "1.2rem"
                           }}
                        >
                           {v.code}
                        </button>
                      ))}
                   </div>
                )}

                {q.type === "TEXT" && (
                  <textarea 
                    placeholder="Tu respuesta..." 
                    value={getResponseValue(q.id, null) || ""}
                    onChange={(e) => updateResponse(q.id, null, e.target.value)}
                    style={{ padding: "1rem", borderRadius: "12px", border: "1px solid #ddd", minHeight: "100px", fontFamily: "inherit" }}
                  />
                )}
             </div>
          ))}
        </div>

        <button 
          onClick={handleNext} 
          disabled={!isStepComplete() || isSubmitting}
          style={{ width: "100%", marginTop: "3rem", padding: "1.2rem", borderRadius: "12px", border: "none", background: isStepComplete() ? "var(--green)" : "#ddd", color: "white", fontWeight: "bold", fontSize: "1.1rem" }}
        >
          {isSubmitting ? "Enviando..." : "Finalizar y Enviar"}
        </button>
      </div>
    );
  }

  if (step === "finish") {
    return (
      <div className="card-container" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <CheckCircle2 size={72} color="var(--green)" style={{ margin: "0 auto", marginBottom: "2rem" }} />
          <h2 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "1rem" }}>¡Muchas gracias!</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.5 }}>
            Tus respuestas han sido registradas. Tu opinión nos ayuda a crear la mejor Hop Water posible.
          </p>
          <button onClick={() => window.location.href = '/'} style={{ marginTop: "3rem", padding: "1rem 2rem", background: "var(--dark)", color: "white", borderRadius: "12px", border: "none", fontWeight: "bold" }}>
             Volver al Inicio
          </button>
      </div>
    );
  }

  return null;
}