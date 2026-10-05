import { supabase } from "./core/supabase-client.js";

const statIds = {
  businesses: "publicStatBusinesses",
  members: "publicStatMembers",
  opportunities: "publicStatOpportunities"
};

function startContinuousCounter(id, value){
  const el = document.getElementById(id);
  const target = Number(value);

  if(!el || !Number.isFinite(target)) return;

  el.dataset.target = String(target);

  // El contador se inicia una sola vez por elemento y continúa
  // haciendo ciclos para que las estadísticas se perciban activas.
  if(el.dataset.counterRunning === "true") return;

  el.dataset.counterRunning = "true";

  const duration = 3200;

  const runCycle = () => {
    const currentTarget = Number(el.dataset.target || 0);
    const start = performance.now();

    const frame = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const shown = Math.round(currentTarget * eased);

      el.textContent = shown.toLocaleString("es-SV") + "+";

      if(progress < 1){
        requestAnimationFrame(frame);
      }else{
        // Reinicia inmediatamente para mantener el movimiento continuo.
        requestAnimationFrame(runCycle);
      }
    };

    requestAnimationFrame(frame);
  };

  runCycle();
}

async function loadPublicStats(){
  try{
    const {data,error} = await supabase.rpc("get_public_platform_stats");
    if(error) throw error;

    const stats = data?.[0] || data || {};

    startContinuousCounter(statIds.businesses, stats.businesses);
    startContinuousCounter(statIds.members, stats.members);
    startContinuousCounter(statIds.opportunities, stats.opportunities);

  }catch(error){
    console.warn("No se pudieron cargar las estadísticas públicas:", error);
  }
}

function initPublicStats(){
  loadPublicStats();

  // Las cifras reales se vuelven a consultar periódicamente.
  window.setInterval(loadPublicStats, 60000);
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", initPublicStats, {once:true});
}else{
  initPublicStats();
}
