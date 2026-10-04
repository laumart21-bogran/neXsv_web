import { supabase } from "./core/supabase-client.js";

async function loadPublicStats(){
  const set=(id,value)=>{
    const el=document.getElementById(id);
    if(el) el.textContent=Number.isFinite(Number(value)) ? Number(value).toLocaleString("es-SV") : "—";
  };

  try{
    const {data,error}=await supabase.rpc("get_public_platform_stats");
    if(error) throw error;
    const stats=data?.[0] || data || {};
    set("publicStatBusinesses",stats.businesses);
    set("publicStatMembers",stats.members);
    set("publicStatSchools",stats.schools);
  }catch(error){
    console.warn("No se pudieron cargar las estadísticas públicas:",error);
  }
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",loadPublicStats,{once:true});
}else{
  loadPublicStats();
}
