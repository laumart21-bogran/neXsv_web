import BusinessService from "../services/business.service.js";
import BusinessMediaService from "../services/business-media.service.js";

const LEGACY_URL="https://script.google.com/macros/s/AKfycbz2iBCu10uZ_BZMkZUqDrWSTQdHkNSqWTpFxedVMfepEmbb43Eat5U5FQTEE_I8Eko/exec";
const params=new URLSearchParams(window.location.search);
const businessId=params.get("id");
const requestedAction=params.get("action");

function escapeHtml(value){return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\x27/g,"&#039;");}
function slugify(text){return String(text??"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\w\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-+|-+$/g,"");}
function convertirDrive(link){const value=String(link||"").trim();if(!value)return "";if(!value.includes("drive.google.com"))return value;const match=value.match(/\/d\/([A-Za-z0-9_-]+)/)||value.match(/id=([A-Za-z0-9_-]+)/);return match?"https://drive.google.com/uc?export=view&id="+match[1]:value;}
function normalizeWhatsapp(value){const raw=String(value||"").trim();if(!raw)return "";if(/^https?:\/\//i.test(raw))return raw;const digits=raw.replace(/\D/g,"");return digits?"https://wa.me/"+(digits.startsWith("503")?digits:"503"+digits):"";}
function firstValue(data,keys){for(const key of keys){const value=data?.[key];if(value!==null&&value!==undefined&&String(value).trim()!=="")return String(value).trim();}return "";}
async function loadLegacy(){try{const response=await fetch(LEGACY_URL);if(!response.ok)throw new Error("LEGACY_FETCH");return await response.json();}catch(error){console.warn("No se pudo consultar la fuente histórica:",error);return null;}}
function findLegacyBusiness(data,name){const target=slugify(name);return (data?.negocios||[]).find(item=>{const normalized=Object.keys(item).reduce((acc,key)=>{acc[key.trim()]=item[key];return acc;},{});return slugify(normalized["Nombre de tu negocio"]||"")===target;})||null;}
function legacyImages(item){if(!item)return [];const k=Object.keys(item).reduce((acc,key)=>{acc[key.trim()]=item[key];return acc;},{});return [k["Link de imagen resp"]||k["Imagen_final"],k["Imagen2"],k["Imagen3"]].map(convertirDrive).filter(Boolean);}
function legacyReviews(data,name){const target=slugify(name);return (data?.reviews||[]).filter(review=>slugify(review.slug||"")===target);}
function stars(value){const count=Math.max(0,Math.min(5,Number(value)||0));return "★★★★★".slice(0,count)+"☆☆☆☆☆".slice(0,5-count);}
function reviewsHtml(reviews){return reviews.map(review=>"<article class=\"review-card\"><div class=\"review-name\">"+stars(review.estrellas)+" — "+escapeHtml(review.nombre||"Miembro")+"</div><div class=\"review-comment\">"+escapeHtml(review.comentario||"")+"</div></article>").join("")||"<div class=\"review-empty\">Este negocio aún no tiene reviews.</div>";}
function renderBusiness(data,images,reviews){
 const container=document.getElementById("contenido");
 const name=escapeHtml(data.nombre||"Negocio"), category=escapeHtml(data.categoria||"Comunidad"), description=escapeHtml(data.descripcion||"");
 const logo=String(data.logo||"").trim(), whatsapp=normalizeWhatsapp(data.whatsapp), maps=firstValue(data,["google_maps_url","maps_url","ubicacion_url"]), safeSlug=slugify(data.nombre||"");
 const total=reviews.length, average=total?(reviews.reduce((sum,item)=>sum+Number(item.estrellas||0),0)/total).toFixed(1):"0.0";
 container.innerHTML="<div class=\"galeria\">"+(images.length?images.map((img,index)=>"<div class=\"galeria-item\"><img src=\""+escapeHtml(img)+"\" alt=\"Foto "+(index+1)+" de "+name+"\" loading=\""+(index===0?"eager":"lazy")+"\"></div>").join(""):"<div class=\"galeria-item galeria-empty\">Este negocio aún no tiene fotografías.</div>")+"</div>"+
 "<div class=\"info\"><div class=\"identity\"><div class=\"logo-box\">"+(logo?"<img src=\""+escapeHtml(logo)+"\" alt=\"Logo de "+name+"\">":"<i class=\"fa-solid fa-store\"></i>")+"</div><div><span class=\"badge\">"+category+"</span><span class=\"verified\"><i class=\"fa-solid fa-circle-check\"></i> Verificado en neXsv</span><h1>"+name+"</h1><p class=\"descripcion\">"+description+"</p></div></div>"+
 "<div class=\"review-summary\"><div class=\"review-score\">⭐ "+average+"</div><div class=\"review-count\">"+total+" "+(total===1?"review":"reviews")+"</div></div>"+
 "<div class=\"botones\">"+(whatsapp?"<a href=\""+escapeHtml(whatsapp)+"\" target=\"_blank\" rel=\"noopener\" class=\"btn btn-whatsapp\"><i class=\"fa-brands fa-whatsapp\"></i> WhatsApp</a>":"")+(maps?"<a href=\""+escapeHtml(maps)+"\" target=\"_blank\" rel=\"noopener\" class=\"btn btn-mapa\"><i class=\"fa-solid fa-location-dot\"></i> Cómo llegar</a>":"")+"<button type=\"button\" id=\"shareBusiness\" class=\"btn btn-share\"><i class=\"fa-solid fa-share-nodes\"></i> Compartir</button></div>"+
 "<section class=\"reviews-section\"><h2>Reviews</h2>"+reviewsHtml(reviews)+"</section><section class=\"review-form\"><h2>Deja tu review</h2><input type=\"text\" id=\"reviewNombre\" placeholder=\"Tu nombre\"><select id=\"reviewEstrellas\"><option value=\"5\">⭐⭐⭐⭐⭐ Excelente</option><option value=\"4\">⭐⭐⭐⭐ Muy bueno</option><option value=\"3\">⭐⭐⭐ Bueno</option><option value=\"2\">⭐⭐ Regular</option><option value=\"1\">⭐ Malo</option></select><textarea id=\"reviewComentario\" placeholder=\"Comparte tu experiencia...\"></textarea><button type=\"button\" id=\"enviarReview\"><i class=\"fa-regular fa-paper-plane\"></i> Enviar review</button><div id=\"mensajeReview\"></div></section><div class=\"detail-footer\"><a href=\"negocios.html\" class=\"btn btn-share\"><i class=\"fa-solid fa-arrow-left\"></i> Volver a negocios</a></div></div>";
 const share=async()=>{const url=window.location.href.split("&action=")[0];const shareData={title:data.nombre||"Negocio en neXsv",text:"Descubre este negocio en neXsv",url};if(navigator.share){try{await navigator.share(shareData);}catch(_){}}else{try{await navigator.clipboard.writeText(url);alert("Enlace copiado.");}catch(_){window.prompt("Copia este enlace:",url);}}};
 document.getElementById("shareBusiness")?.addEventListener("click",share);
 document.getElementById("enviarReview")?.addEventListener("click",async()=>{const nombre=document.getElementById("reviewNombre")?.value.trim(),estrellas=document.getElementById("reviewEstrellas")?.value,comentario=document.getElementById("reviewComentario")?.value.trim(),mensaje=document.getElementById("mensajeReview");if(!nombre||!comentario){mensaje.textContent="Completa todos los campos.";return;}mensaje.textContent="Enviando review…";try{const response=await fetch(LEGACY_URL,{method:"POST",body:JSON.stringify({slug:safeSlug,nombre,estrellas,comentario})});if(!response.ok)throw new Error("REVIEW_POST");mensaje.textContent="✅ Review enviada correctamente.";document.getElementById("reviewNombre").value="";document.getElementById("reviewComentario").value="";setTimeout(()=>location.reload(),900);}catch(error){console.error(error);mensaje.textContent="No fue posible enviar la review en este momento.";}});
 if(requestedAction==="whatsapp"&&whatsapp)window.open(whatsapp,"_blank","noopener");
 if(requestedAction==="location"&&maps)window.open(maps,"_blank","noopener");
}
async function init(){
 const container=document.getElementById("contenido");if(!container)return;if(!businessId){container.innerHTML="<div class=\"loading\">Negocio no especificado.</div>";return;}
 const publicResult=await BusinessService.getPublicBusinessDetail(businessId);let data=publicResult.data||null;let legacyData=null;
 if(!data)legacyData=await loadLegacy();
 if(!data&&legacyData){const fallback=findLegacyBusiness(legacyData,params.get("nombre")||"");if(fallback){const k=Object.keys(fallback).reduce((acc,key)=>{acc[key.trim()]=fallback[key];return acc;},{});data={nombre:k["Nombre de tu negocio"],categoria:k["Categoría de tu negocio"],descripcion:k["Descripcion_final"]||k["Describe tu negocio"],whatsapp:k["WhatsApp del negocio"],google_maps_url:k["Link de ubicación del Negocio (Link de Google Maps)"]||k["Ubicación del Negocio (Link de Google Maps)"],logo:convertirDrive(k["Link de imagen resp"]||k["Imagen_final"])};}}
 if(!data){container.innerHTML="<div class=\"loading\">No fue posible cargar este negocio.</div>";return;}
 const mediaResult=await BusinessMediaService.getPublicBusinessMedia(businessId);let images=(mediaResult.data||[]).filter(item=>item.tipo==="FOTO").map(item=>item.url).filter(Boolean).slice(0,3);
 legacyData=legacyData||await loadLegacy();const legacyBusiness=findLegacyBusiness(legacyData,data.nombre);if(!images.length)images=legacyImages(legacyBusiness).slice(0,3);
 const reviews=legacyReviews(legacyData,data.nombre);renderBusiness(data,images,reviews);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();