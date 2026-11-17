import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildPushPayload } from "npm:@block65/webcrypto-web-push@2.0.0";
const PROJECT_URL="https://hxlkshoexhbhsebkzjbk.supabase.co";
const VAPID_PUBLIC_KEY="BGY__39TQ9LmwXuTQ1hRaqKajPesPsehwbF3Rp6Jw5FMganSMemF_jBgnH-sujLxs8VcEEOiZHd79omSJg0aLls";
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json"}});
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!serviceKey)return reply({error:"Server configuration missing"},500);
 const admin=createClient(PROJECT_URL,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:secrets,error:secretError}=await admin.rpc("get_push_runtime_secrets");
 if(secretError||!secrets?.nexsv_vapid_private_key||!secrets?.nexsv_push_hook_secret){console.error("Push secrets unavailable",secretError?.message);return reply({error:"Push service is not configured"},503)}
 if(req.headers.get("x-nexsv-push-hook")!==secrets.nexsv_push_hook_secret)return reply({error:"Unauthorized"},401);
 let body:{notification_id?:string};try{body=await req.json()}catch{return reply({error:"Invalid payload"},400)}
 if(!body.notification_id)return reply({error:"Missing notification id"},400);
 const {data:n,error:nError}=await admin.from("notifications").select("id,recipient_id,notification_type,publication_id,conversation_id").eq("id",body.notification_id).maybeSingle();
 if(nError||!n)return reply({error:"Notification not found"},404);
 if(!["MESSAGE","COMMENT","SAVE"].includes(n.notification_type))return reply({skipped:true});
 const {data:subs,error:sError}=await admin.from("push_subscriptions").select("id,endpoint,p256dh,auth").eq("user_id",n.recipient_id);
 if(sError)return reply({error:"Could not load subscriptions"},500);
 if(!subs?.length)return reply({sent:0,reason:"No registered devices"});
 const vapid={subject:"mailto:soporte@nexsv.com",publicKey:VAPID_PUBLIC_KEY,privateKey:secrets.nexsv_vapid_private_key};
 const url=n.conversation_id?"/mensajes.html":n.publication_id?"/comunidad.html?publicacion="+encodeURIComponent(n.publication_id):"/comunidad.html";
 const title=n.notification_type==="MESSAGE"?"Nuevo mensaje en neXsv":"Novedades en tu comunidad";
 const payloadData={title,body:"Abre neXsv para ver la novedad.",url,tag:"nexsv-"+n.notification_type.toLowerCase()+"-"+n.id};
 let sent=0,expired=0;
 const results=await Promise.allSettled(subs.map(async(row)=>{
  const subscription={endpoint:row.endpoint,expirationTime:null,keys:{p256dh:row.p256dh,auth:row.auth}};
  const payload=await buildPushPayload({data:payloadData,options:{ttl:43200,urgency:"normal"}},subscription,vapid);
  const res=await fetch(row.endpoint,payload);
  if(res.status===404||res.status===410){await admin.from("push_subscriptions").delete().eq("id",row.id);expired++;return}
  if(!res.ok)throw new Error("Push service returned "+res.status);
  sent++;
 }));
 const failed=results.filter(x=>x.status==="rejected").length;
 if(failed)console.warn("Some push deliveries failed",{failed,sent,expired});
 return reply({sent,expired,failed});
});