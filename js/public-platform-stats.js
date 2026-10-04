import { supabase } from "./core/supabase-client.js";

const statIds = {
  businesses: "publicStatBusinesses",
  members: "publicStatMembers",
  opportunities: "publicStatOpportunities"
};

function animateValue(id, value){
  const el=document.getElementById(id);
  const target=Number(value);
  if(!el || !Number.isFinite(target)) return;

  const current=Number(el.dataset.value || 0);
  const duration=500;
  const start=performance.now();

  const frame=(now)=>{
    const progress=Math.min((now-start)/duration,1);
    const eased=1-Math.pow(1-progress,3);
    const shown=Math.round(current+(target-current)*eased);
    el.textContent=shown.toLocaleString("es-SV")+"+";
    if(progress<1) requestAnimationFrame(frame);
    else el.dataset.value=String(target);
  };

  requestAnimationFrame(frame);
}

async function loadPublicStats(){
  try{
    const {data,error}=await supabase.rpc("get_public_platform_stats");
    if(error) throw error;

    const stats=data?.[0] || data || {};

    animateValue(statIds.businesses, stats.businesses);
    animateValue(statIds.members, stats.members);
    animateValue(statIds.opportunities, stats.opportunities);

  }catch(error){
    console.warn("No se pudieron cargar las estadísticas públicas:",error);
  }
}

function initPublicStats(){
  loadPublicStats();

  // Mantiene las cifras actualizadas sin recargar toda la página.
  window.setInterval(loadPublicStats, 60000);
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",initPublicStats,{once:true});
}else{
  initPublicStats();
}
