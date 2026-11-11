import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(req.method!=="POST") return json({error:"Método no permitido."},405);
 const auth=req.headers.get("Authorization");
 if(!auth?.startsWith("Bearer ")) return json({error:"Sesión no válida."},401);
 const url=Deno.env.get("SUPABASE_URL"), anon=Deno.env.get("SUPABASE_ANON_KEY"), service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!service) return json({error:"Configuración del servidor incompleta."},500);
 const token=auth.slice(7), client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await client.auth.getUser(token);
 if(authError||!user) return json({error:"No se pudo validar la sesión."},401);
 let body:Record<string,unknown>; try{body=await req.json()}catch{return json({error:"Solicitud inválida."},400)}
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 if(body.action==="remove"){
  const endpoint=typeof body.endpoint==="string"?body.endpoint:"";
  if(!endpoint.startsWith("https://")) return json({error:"Dispositivo no válido."},400);
  const {error}=await admin.from("push_subscriptions").delete().eq("user_id",user.id).eq("endpoint",endpoint);
  return error?json({error:"No se pudo desactivar este dispositivo."},500):json({success:true});
 }
 if(body.action!=="save"||!body.subscription||typeof body.subscription!=="object") return json({error:"Solicitud de registro no válida."},400);
 const sub=body.subscription as Record<string,unknown>, keys=sub.keys&&typeof sub.keys==="object"?sub.keys as Record<string,unknown>:{};
 const endpoint=typeof sub.endpoint==="string"?sub.endpoint:"",p256dh=typeof keys.p256dh==="string"?keys.p256dh:"",secret=typeof keys.auth==="string"?keys.auth:"";
 if(!endpoint.startsWith("https://")||!p256dh||!secret) return json({error:"Datos incompletos."},400);
 const now=new Date().toISOString();
 const {error}=await admin.from("push_subscriptions").upsert({user_id:user.id,endpoint,p256dh,auth:secret,device_label:(req.headers.get("user-agent")||"Dispositivo").slice(0,180),updated_at:now,last_seen_at:now},{onConflict:"endpoint"});
 if(error){console.error("push subscription save failed",error.message);return json({error:"No se pudo registrar este dispositivo."},500)}
 return json({success:true});
});