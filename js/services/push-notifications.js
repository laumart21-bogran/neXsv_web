import { supabase } from "../core/supabase-client.js";
import { APP_CONFIG } from "../core/config.js";
const DISMISSED="nexsv-push-invite-dismissed";
function decodeKey(value){const pad="=".repeat((4-value.length%4)%4);return Uint8Array.from(atob((value+pad).replaceAll("-","+").replaceAll("_","/")),c=>c.charCodeAt(0))}
function createInvite(){
 const anchor=document.querySelector(".dashboard-content .dashboard-header");if(!anchor)return null;
 const el=document.createElement("section");el.id="nexsvPushInvite";el.className="nexsv-push-invite";
 el.innerHTML='<span class="nexsv-push-invite-icon"><i class="fa-regular fa-bell"></i></span><div class="nexsv-push-invite-copy"><strong>Mantente conectado con tu comunidad</strong><p>No te pierdas mensajes y novedades importantes de neXsv.</p><small id="nexsvPushStatus" role="status"></small></div><div class="nexsv-push-invite-actions"><button type="button" id="nexsvPushEnable">Activar notificaciones</button><button type="button" id="nexsvPushLater">Ahora no</button></div>';
 anchor.insertAdjacentElement("afterend",el);return el;
}
async function activate(el,button){
 const status=el.querySelector("#nexsvPushStatus"),key=APP_CONFIG.push?.vapidPublicKey;
 if(!key){status.textContent="El servicio aún está terminando de configurarse.";return}
 button.disabled=true;
 try{
  const permission=await Notification.requestPermission();
  if(permission!=="granted"){status.textContent=permission==="denied"?"El permiso fue rechazado en el navegador. Puedes cambiarlo desde su configuración.":"No se activaron las notificaciones.";button.disabled=false;return}
  const reg=await navigator.serviceWorker.register("/sw.js",{scope:"/"});
  let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(key)});
  const {error}=await supabase.functions.invoke("manage-push-subscription",{body:{action:"save",subscription:sub.toJSON()}});
  if(error)throw error;
  status.textContent="¡Listo! Este dispositivo quedó registrado.";
  window.setTimeout(()=>el.remove(),2500);
 }catch(error){console.error("Error activando push:",error);status.textContent="No fue posible completar la activación. Inténtalo nuevamente.";button.disabled=false}
}
async function init(){
 const key=APP_CONFIG.push?.vapidPublicKey;
 if(!key||!("Notification"in window)||!("serviceWorker"in navigator)||!("PushManager"in window)||Notification.permission!=="default"||localStorage.getItem(DISMISSED)==="1")return;
 const {data:{user}}=await supabase.auth.getUser();if(!user)return;
 const el=createInvite();if(!el)return;
 const button=el.querySelector("#nexsvPushEnable");
 button.addEventListener("click",()=>activate(el,button));
 el.querySelector("#nexsvPushLater").addEventListener("click",()=>{localStorage.setItem(DISMISSED,"1");el.remove()});
}
document.addEventListener("DOMContentLoaded",init);
