import BusinessService from "../services/business.service.js";
import BusinessMediaService from "../services/business-media.service.js?v=20260924-3";
import BusinessServiceCatalog from "../services/business-service.service.js";
import CommunityService from "../services/community.service.js";
import { supabase } from "../core/supabase-client.js";
import AuthSession from "../auth/auth.session.js";
import ProfileService from "../services/profile.service.js";

const LEGACY_URL="https://script.google.com/macros/s/AKfycbz2iBCu10uZ_BZMkZUqDrWSTQdHkNSqWTpFxedVMfepEmbb43Eat5U5FQTEE_I8Eko/exec";
const params=new URLSearchParams(window.location.search);
const businessId=params.get("id");
const requestedAction=params.get("action");
const ownerPreview=params.get("preview")==="owner";

function initials(nombre){
 const parts=String(nombre||"").trim().split(/\\s+/).filter(Boolean);
 return parts.slice(0,2).map(part=>part.charAt(0).toUpperCase()).join("")||"U";
}
async function syncBusinessHeaderAvatar(){
 const avatar=document.getElementById("businessHeaderAvatar");
 if(!avatar)return;
 try{
   if(!AuthSession.isInitialized()) await AuthSession.initialize();
   const user=AuthSession.getCurrentUser();
   if(!user){return;}
   const result=await ProfileService.getProfile(user.id);
   const profile=result.data||{};
   const nombre=[profile.nombre,profile.apellido].filter(Boolean).join(" ")||user.email?.split("@")[0]||"Usuario";
   if(profile.foto){
     avatar.innerHTML='<img src="'+escapeHtml(profile.foto)+'" alt="">';
     avatar.classList.add("has-photo");
   }else{
     avatar.textContent=initials(nombre);
     avatar.classList.remove("has-photo");
   }
 }catch(error){
   console.warn("No se pudo cargar el avatar del usuario:",error);
 }
}

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
function formatPublicServicePrice(service){if(service.precio===null||service.precio===undefined||service.precio==="")return "Consultar";const amount=Number(service.precio).toFixed(2);return service.precio_tipo==="DESDE"?"Desde $"+amount:"$"+amount;}
function reviewsHtml(reviews){return reviews.map(review=>"<article class=\"review-card\"><div class=\"review-name\">"+stars(review.estrellas)+" — "+escapeHtml(review.nombre||"Miembro")+"</div><div class=\"review-comment\">"+escapeHtml(review.comentario||"")+"</div></article>").join("")||"<div class=\"review-empty\">Este negocio aún no tiene reviews.</div>";}
function renderBusiness(data,images,reviews,services=[],publications=[]){
 const container=document.getElementById("contenido");
 const name=escapeHtml(data.nombre||"Negocio");
 const category=escapeHtml(data.categoria||"Comunidad");
 const description=escapeHtml(data.descripcion||"");
 const logo=String(data.logo||"").trim();
 const whatsapp=normalizeWhatsapp(data.whatsapp);
 const maps=firstValue(data,["google_maps_url","maps_url","ubicacion_url"]);
 const website=firstValue(data,["sitio_web","website","web"]);
 const departamento=firstValue(data,["departamento"]);
 const municipio=firstValue(data,["municipio"]);
 const horario=firstValue(data,["horario_atencion","horario","horario_de_atencion","horario_negocio"]);
 const safeSlug=slugify(data.nombre||"");
 const locationText=[municipio,departamento].filter(Boolean).join(", ");
 const total=reviews.length;
 const average=total?(reviews.reduce((sum,item)=>sum+Number(item.estrellas||0),0)/total).toFixed(1):"0.0";
 const ownerMode=document.getElementById("businessSpace")?.classList.contains("owner-active");

 const gallerySlides=images.length
   ? images.map((img,index)=>'<div class="galeria-item"><img src="'+escapeHtml(img)+'" alt="Foto '+(index+1)+' de '+name+'" loading="'+(index===0?"eager":"lazy")+'">'+(ownerMode&&index===0?'<div class="owner-hero-overlay"><span>Espacio de negocio</span><strong>'+name+'</strong><p>'+description+'</p><small>Datos · Estrategia · Resultados</small></div>':"")+"</div>").join("")
   : '<div class="galeria-item galeria-empty">Este negocio aún no tiene fotografías.</div>';
 const galleryDots=images.length>1
   ? '<div class="galeria-controls">'+images.map((_,index)=>'<button type="button" class="galeria-dot'+(index===0?" active":"")+'" data-gallery-index="'+index+'" aria-label="Ver imagen '+(index+1)+'"></button>').join("")+"</div>"
   : "";

 const managementTabs='<nav class="public-tabs management-tabs" aria-label="Gestión del negocio"><a href="#gestion-resumen" class="active">Resumen</a><a href="#gestion-publicaciones">Publicaciones</a><a href="#gestion-estadisticas">Estadísticas</a><a href="#gestion-resenas">Reseñas</a><a href="#gestion-aprende">Aprende</a></nav>';
 const publicTabs='<nav class="public-tabs" aria-label="Contenido del negocio"><a href="#sobre-negocio" class="active">Información</a><a href="#fotografias-negocio">Fotografías</a><a href="#servicios-negocio">Servicios</a><a href="#reviews-negocio">Reviews</a></nav>';

 const managementSections=`
 <section id="gestion-resumen" class="public-section management-section">
   <div class="public-section-heading"><div><span class="management-kicker">Resumen</span><h2>Actividad de tu negocio</h2><p>Un vistazo rápido a lo que está pasando con tu presencia en neXsv.</p></div><span>Visión general</span></div>
   <div class="management-summary-grid">
     <article><span class="management-summary-icon blue"><i class="fa-regular fa-newspaper"></i></span><div><strong id="ownerStatPublications">0</strong><small>Publicaciones</small></div></article>
     <article><span class="management-summary-icon green"><i class="fa-regular fa-eye"></i></span><div><strong>0</strong><small>Vistas</small></div></article>
     <article><span class="management-summary-icon yellow"><i class="fa-regular fa-comments"></i></span><div><strong>0</strong><small>Conversaciones</small></div></article>
   </div>
 </section>

 <section id="gestion-publicar" class="public-section management-section management-publish-section">
   <div class="management-publish-box">
     <span class="management-publish-icon"><i class="fa-solid fa-bullhorn"></i></span>
     <div><span class="management-kicker">Publicar ahora</span><h2>Comparte algo nuevo</h2><p>Una novedad, promoción, recomendación o contenido útil puede ayudarte a mantener activa tu presencia.</p></div>
     <button type="button" class="management-publish-btn" data-business-module="publish">Publicar ahora <i class="fa-solid fa-arrow-right"></i></button>
   </div>
 </section>

 <section id="gestion-publicaciones" class="public-section management-section">
   <div class="public-section-heading"><div><span class="management-kicker">Actividad reciente</span><h2>Tus publicaciones recientes</h2><p>Revisa rápidamente lo último que has compartido con tu comunidad.</p></div><button type="button" class="management-inline-action" data-business-module="publications">Ver todas <i class="fa-solid fa-arrow-right"></i></button></div>
   <div class="management-publication-empty">
     <span class="management-empty-icon blue"><i class="fa-regular fa-images"></i></span>
     <div><strong>Aún no tienes publicaciones para este negocio</strong><p>Cuando publiques para este negocio, tus publicaciones aparecerán aquí.</p></div>
     <button type="button" class="management-empty-btn" data-business-module="publish">Crear mi primera publicación</button>
   </div>
 </section>
 <section id="gestion-estadisticas" class="public-section management-section">
   <div class="public-section-heading"><div><span class="management-kicker">Rendimiento</span><h2>Qué está pasando con tu contenido</h2><p>Estas señales muestran cómo las personas interactúan con lo que publicas en neXsv.</p></div><button type="button" class="management-inline-action" data-business-module="results">Ver resultados <i class="fa-solid fa-arrow-right"></i></button></div>
   <div class="management-stats-grid dashboard-stat-grid">
     <article><span class="management-summary-icon"><i class="fa-regular fa-circle-check"></i></span><div><strong id="ownerStatInterests">—</strong><small>Me interesa</small></div></article>
     <article><span class="management-summary-icon"><i class="fa-regular fa-message"></i></span><div><strong id="ownerStatMessages">0</strong><small>Mensajes</small></div></article>
     <article><span class="management-summary-icon"><i class="fa-regular fa-comment"></i></span><div><strong id="ownerStatComments">0</strong><small>Comentarios</small></div></article>
     <article><span class="management-summary-icon"><i class="fa-regular fa-share-from-square"></i></span><div><strong id="ownerStatShares">0</strong><small>Compartidos</small></div></article>
     <article><span class="management-summary-icon"><i class="fa-regular fa-bookmark"></i></span><div><strong id="ownerStatSaves">0</strong><small>Guardados</small></div></article>
     <article><span class="management-summary-icon"><i class="fa-solid fa-chart-line"></i></span><div><strong id="ownerStatRate">0%</strong><small>Tasa de conversación</small></div></article>
   </div>
 </section>
 <section id="gestion-resenas" class="public-section management-section">
   <div class="public-section-heading"><div><span class="management-kicker">Reputación</span><h2>Últimas reseñas</h2><p>Así se ve la experiencia que las personas comparten sobre tu negocio.</p></div><span>${reviews.length} ${reviews.length===1?"reseña":"reseñas"}</span></div>
   ${reviews.length
      ? '<div class="management-reviews-list">'+reviews.slice(0,3).map(review=>'<article class="management-review-card"><div class="management-review-avatar"><i class="fa-solid fa-user"></i></div><div class="management-review-content"><div class="management-review-top"><div><strong>'+escapeHtml(review.nombre||"Miembro")+'</strong><span class="management-review-date">Experiencia compartida</span></div><span class="management-review-stars">'+stars(review.estrellas)+'</span></div><p>'+escapeHtml(review.comentario||"")+'</p></div></article>').join("")+'</div>'
      : '<div class="management-publication-empty management-review-empty"><span class="management-empty-icon"><i class="fa-regular fa-star"></i></span><div><strong>Aún no hay reseñas</strong><p>Cuando las personas compartan su experiencia, aparecerá aquí.</p></div></div>'}
 </section>

 <section id="gestion-aprende" class="public-section management-section">
   <div class="public-section-heading"><div><span class="management-kicker">Aprende</span><h2>Aprende más sobre cómo vender más</h2><p>Ideas prácticas para aprovechar mejor tu presencia en neXsv.</p></div></div>
   <div class="management-learning-grid">
     <a href="blog.html" class="management-learning-card-link"><article><span class="management-learning-icon blue"><i class="fa-solid fa-bullhorn"></i></span><div><strong>Publica con intención</strong><p>Ideas para crear contenido útil y relevante.</p></div><i class="fa-solid fa-arrow-right"></i></article></a>
     <a href="blog.html" class="management-learning-card-link"><article><span class="management-learning-icon yellow"><i class="fa-solid fa-image"></i></span><div><strong>Haz que tu negocio destaque</strong><p>Consejos para mejorar tu presentación.</p></div><i class="fa-solid fa-arrow-right"></i></article></a>
     <a href="blog.html" class="management-learning-card-link"><article><span class="management-learning-icon green"><i class="fa-solid fa-comments"></i></span><div><strong>Convierte interés en conversación</strong><p>Aprende estrategias prácticas para vender más.</p></div><i class="fa-solid fa-arrow-right"></i></article></a>
   </div>
   <div class="management-blog-link"><a href="blog.html">Ver todos los artículos del blog <i class="fa-solid fa-arrow-right"></i></a></div>
 </section>`;

 const publicSections=`
 <section id="sobre-negocio" class="public-section about-business"><h2>Sobre ${name}</h2><p>${description}</p></section>
 <section id="publicaciones-negocio" class="public-section business-publications-section">
   <div class="public-section-heading"><div><h2>Últimas publicaciones</h2><p class="public-section-subtitle">Lo más reciente que este negocio comparte con su comunidad.</p></div><span>${publications.length} ${publications.length===1?"publicación":"publicaciones"}</span></div>
   ${publications.length
     ? '<div class="business-publications-carousel" data-publication-count="'+publications.length+'"><button type="button" class="business-publication-arrow prev" aria-label="Publicación anterior"><i class="fa-solid fa-chevron-left"></i></button><div class="business-publications-viewport"><div class="business-publications-track">'+publications.map((item,index)=>{const image=item.images?.[0]?.public_url||item.images?.[0]?.storage_path||"";return '<article class="business-publication-card" data-publication-index="'+index+'">'+(image?'<div class="business-publication-media"><img src="'+escapeHtml(image)+'" alt="" loading="lazy"></div>':'<div class="business-publication-media business-publication-placeholder"><i class="fa-regular fa-newspaper"></i></div>')+'<div class="business-publication-body"><span class="business-publication-type">'+escapeHtml(item.type||"PUBLICACIÓN")+'</span><h3>'+escapeHtml(item.title||"Sin título")+'</h3><p>'+escapeHtml(item.body||"")+'</p><small>'+new Date(item.created_at).toLocaleDateString("es-SV",{day:"2-digit",month:"short",year:"numeric"})+'</small><a href="comunidad.html?business='+encodeURIComponent(businessId)+'">Ver publicación <i class="fa-solid fa-arrow-right"></i></a></div></article>';}).join("")+'</div></div><button type="button" class="business-publication-arrow next" aria-label="Siguiente publicación"><i class="fa-solid fa-chevron-right"></i></button><div class="business-publication-dots">'+publications.map((_,index)=>'<button type="button" class="business-publication-dot'+(index===0?" active":"")+'" data-publication-index="'+index+'" aria-label="Ver publicación '+(index+1)+'"></button>').join("")+'</div></div>'
     : '<div class="review-empty">Este negocio aún no ha publicado contenido.</div>'}
 </section>
 <section id="fotografias-negocio" class="public-section"><div class="public-section-heading"><h2>Fotografías</h2><span>${images.length} ${images.length===1?"foto":"fotos"}</span></div>
 ${images.length?'<div class="public-photo-grid">'+images.map((img,index)=>'<a href="'+escapeHtml(img)+'" target="_blank" rel="noopener" class="public-photo"><img src="'+escapeHtml(img)+'" alt="Fotografía '+(index+1)+' de '+name+'"></a>').join("")+"</div>":'<div class="review-empty">Este negocio aún no tiene fotografías.</div>'}
 </section>
 <section id="servicios-negocio" class="public-section"><div class="public-section-heading"><h2>Servicios</h2><span>${services.length} ${services.length===1?"servicio":"servicios"}</span></div>
 ${services.length?'<div class="public-services-grid">'+services.map(service=>'<article class="public-service-card"><div class="public-service-card-head"><h3>'+escapeHtml(service.nombre||"Servicio")+'</h3><span>'+escapeHtml(formatPublicServicePrice(service))+'</span></div>'+(service.descripcion?'<p>'+escapeHtml(service.descripcion)+'</p>':"")+"</article>").join("")+"</div>":'<div class="review-empty">Este negocio aún no ha agregado servicios.</div>'}
 </section>
 <section id="reviews-negocio" class="reviews-section public-section"><h2>Reviews</h2>${reviewsHtml(reviews)}</section>
 <section class="review-form"><h2>Deja tu review</h2><input type="text" id="reviewNombre" placeholder="Tu nombre"><select id="reviewEstrellas"><option value="5">⭐⭐⭐⭐⭐ Excelente</option><option value="4">⭐⭐⭐⭐ Muy bueno</option><option value="3">⭐⭐⭐ Bueno</option><option value="2">⭐⭐ Regular</option><option value="1">⭐ Malo</option></select><textarea id="reviewComentario" placeholder="Comparte tu experiencia..."></textarea><button type="button" id="enviarReview"><i class="fa-regular fa-paper-plane"></i> Enviar review</button><div id="mensajeReview"></div></section>`;

 container.innerHTML='<div class="galeria"><div class="galeria-track" id="businessGalleryTrack">'+gallerySlides+'</div>'+galleryDots+'</div>'+
 '<div class="info"><div class="identity"><div class="logo-box">'+(logo?'<img src="'+escapeHtml(logo)+'" alt="Logo de '+name+'">':'<i class="fa-solid fa-store"></i>')+'</div><div><span class="badge">'+category+'</span><span class="verified"><i class="fa-solid fa-circle-check"></i> Verificado en neXsv</span>'+(ownerMode?'<span class="owner-badge"><i class="fa-solid fa-circle"></i> Propietario<small>Estás viendo tu negocio</small></span>':"")+'<h1>'+name+'</h1><p class="descripcion">'+description+'</p></div></div>'+
 '<div class="datos-practicos">'+
 (locationText?'<div class="dato-practico"><span class="dato-practico-icon"><i class="fa-solid fa-location-dot"></i></span><span class="dato-practico-content"><span class="dato-practico-label">Ubicación</span><span class="dato-practico-value">'+escapeHtml(locationText)+'</span></span></div>':"")+
 (horario?'<div class="dato-practico"><span class="dato-practico-icon"><i class="fa-regular fa-clock"></i></span><span class="dato-practico-content"><span class="dato-practico-label">Horario de atención</span><span class="dato-practico-value">'+escapeHtml(horario)+'</span></span></div>':"")+
 (website?'<div class="dato-practico"><span class="dato-practico-icon"><i class="fa-solid fa-globe"></i></span><span class="dato-practico-content"><span class="dato-practico-label">Sitio web</span><a class="dato-practico-value dato-practico-link" href="'+escapeHtml(website)+'" target="_blank" rel="noopener">'+escapeHtml(website.replace(/^https?:\/\//i,"").replace(/\/$/,""))+'</a></span></div>':"")+
 '</div><div class="review-summary"><div class="review-score">⭐ '+average+'</div><div class="review-count">'+total+' '+(total===1?"review":"reviews")+'</div></div>'+
 '<div class="botones">'+(whatsapp?'<a href="'+escapeHtml(whatsapp)+'" target="_blank" rel="noopener" class="btn btn-whatsapp"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>':"")+(maps?'<a href="'+escapeHtml(maps)+'" target="_blank" rel="noopener" class="btn btn-mapa"><i class="fa-solid fa-location-dot"></i> Cómo llegar</a>':"")+(website?'<a href="'+escapeHtml(website)+'" target="_blank" rel="noopener" class="btn btn-web"><i class="fa-solid fa-globe"></i> Visitar sitio web</a>':"")+'<button type="button" id="shareBusiness" class="btn btn-share"><i class="fa-solid fa-share-nodes"></i> Compartir</button></div>'+
 (ownerMode?managementTabs:publicTabs)+
 (ownerMode?managementSections:publicSections)+
 '<div class="detail-footer"><a href="negocios.html" class="btn btn-share"><i class="fa-solid fa-arrow-left"></i> Volver a negocios</a></div></div>';

 const ownerInfoValues={ownerInfoName:data.nombre||"—",ownerInfoCategory:data.categoria||"—",ownerInfoLocation:locationText||"—",ownerInfoSchedule:horario||"—",ownerInfoWebsite:website?website.replace(/^https?:\/\//i,"").replace(/\/$/,""):"—",ownerInfoWhatsapp:whatsapp?whatsapp.replace(/^https?:\/\//i,"").replace(/^https?:\/\/wa\.me\//i,"+"):"—"};
 Object.entries(ownerInfoValues).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=value;});

 const share=async()=>{const url=window.location.href.split("&action=")[0];const shareData={title:data.nombre||"Negocio en neXsv",text:"Descubre este negocio en neXsv",url};if(navigator.share){try{await navigator.share(shareData);}catch(_){}}else{try{await navigator.clipboard.writeText(url);alert("Enlace copiado.");}catch(_){window.prompt("Copia este enlace:",url);}}};
 document.querySelectorAll(".management-section [data-business-module]").forEach(action=>{action.addEventListener("click",()=>{document.querySelector('[data-business-module="'+action.dataset.businessModule+'"]')?.click();});});
 document.getElementById("shareBusiness")?.addEventListener("click",share);


 const publicationCarousel=document.querySelector(".business-publications-carousel");
 if(publicationCarousel&&publications.length>1){
   const track=publicationCarousel.querySelector(".business-publications-track");
   const cards=[...publicationCarousel.querySelectorAll(".business-publication-card")];
   const dots=[...publicationCarousel.querySelectorAll(".business-publication-dot")];
   const prev=publicationCarousel.querySelector(".business-publication-arrow.prev");
   const next=publicationCarousel.querySelector(".business-publication-arrow.next");
   let pubIndex=0;
   let pubTimer;
   const visibleCount=()=>window.innerWidth<=700?1:Math.min(3,publications.length);
   const updatePublications=()=>{
     const count=visibleCount();
     const maxIndex=Math.max(0,publications.length-count);
     pubIndex=Math.min(pubIndex,maxIndex);
     const cardWidth=cards[0]?.getBoundingClientRect().width||0;
     const gap=18;
     track.style.transform="translateX(-"+((cardWidth+gap)*pubIndex)+"px)";
     dots.forEach((dot,index)=>dot.classList.toggle("active",index===pubIndex));
   };
   const startPubTimer=()=>{
     clearInterval(pubTimer);
     pubTimer=setInterval(()=>{
       const count=visibleCount();
       const maxIndex=Math.max(0,publications.length-count);
       pubIndex=pubIndex>=maxIndex?0:pubIndex+1;
       updatePublications();
     },5000);
   };
   prev?.addEventListener("click",()=>{const count=visibleCount();const maxIndex=Math.max(0,publications.length-count);pubIndex=pubIndex<=0?maxIndex:pubIndex-1;updatePublications();startPubTimer();});
   next?.addEventListener("click",()=>{const count=visibleCount();const maxIndex=Math.max(0,publications.length-count);pubIndex=pubIndex>=maxIndex?0:pubIndex+1;updatePublications();startPubTimer();});
   dots.forEach(dot=>dot.addEventListener("click",()=>{pubIndex=Number(dot.dataset.publicationIndex)||0;updatePublications();startPubTimer();}));
   window.addEventListener("resize",updatePublications,{passive:true});
   updatePublications();
   startPubTimer();
 }
 
 const galleryTrack=document.getElementById("businessGalleryTrack");
 const galleryDotButtons=[...document.querySelectorAll(".galeria-dot")];
 if(galleryTrack&&images.length>1){
   let galleryIndex=0;
   let galleryTimer=setInterval(()=>{galleryIndex=(galleryIndex+1)%images.length;updateGallery();},4500);
   const updateGallery=()=>{galleryTrack.style.transform="translateX(-"+(galleryIndex*100)+"%)";galleryDotButtons.forEach((dot,index)=>dot.classList.toggle("active",index===galleryIndex));};
   galleryDotButtons.forEach(dot=>dot.addEventListener("click",()=>{galleryIndex=Number(dot.dataset.galleryIndex)||0;updateGallery();clearInterval(galleryTimer);galleryTimer=setInterval(()=>{galleryIndex=(galleryIndex+1)%images.length;updateGallery();},4500);}));
 }

 document.getElementById("enviarReview")?.addEventListener("click",async()=>{const nombre=document.getElementById("reviewNombre")?.value.trim(),estrellas=document.getElementById("reviewEstrellas")?.value,comentario=document.getElementById("reviewComentario")?.value.trim(),mensaje=document.getElementById("mensajeReview");if(!nombre||!comentario){mensaje.textContent="Completa todos los campos.";return;}mensaje.textContent="Enviando review…";try{const response=await fetch(LEGACY_URL,{method:"POST",body:JSON.stringify({slug:safeSlug,nombre,estrellas,comentario})});if(!response.ok)throw new Error("REVIEW_POST");mensaje.textContent="✅ Review enviada correctamente.";document.getElementById("reviewNombre").value="";document.getElementById("reviewComentario").value="";setTimeout(()=>location.reload(),900);}catch(error){console.error(error);mensaje.textContent="No fue posible enviar la review en este momento.";}});

 if(requestedAction==="whatsapp"&&whatsapp)window.open(whatsapp,"_blank","noopener");
 if(requestedAction==="location"&&maps)window.open(maps,"_blank","noopener");
}
async function loadOwnerRecentPublications(businessId){
  try{
    const result=await CommunityService.getPublications({businessId,limit:6});
    const container=document.querySelector("#gestion-publicaciones .management-publication-empty");
    if(!container||!result.data?.length)return;
    container.outerHTML='<div class="management-publication-grid">'+result.data.slice(0,3).map(item=>{const image=item.images?.[0]?.public_url||item.images?.[0]?.storage_path||"";return '<article class="management-publication-card">'+(image?'<img src="'+escapeHtml(image)+'" alt="">':'<div class="management-publication-placeholder"><i class="fa-regular fa-newspaper"></i></div>')+'<div class="management-publication-card-body"><span>'+escapeHtml(item.type||"PUBLICACIÓN")+'</span><h3>'+escapeHtml(item.title||"Sin título")+'</h3><p>'+escapeHtml(item.body||"")+'</p><a href="comunidad.html?business='+encodeURIComponent(businessId)+'">Ver publicación <i class="fa-solid fa-arrow-right"></i></a></div></article>';}).join("")+'</div>';
  }catch(error){console.warn("No se pudieron cargar las publicaciones recientes:",error);}
}
async function loadOwnerStatistics(businessId){
  try{
    const pubs=await CommunityService.getPublications({businessId,limit:100});
    const ids=(pubs.data||[]).map(item=>item.id).filter(Boolean);
    const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
    set("ownerStatPublications",ids.length);
    if(!ids.length)return;
    const metricsResult=await supabase.rpc("get_my_community_publication_metrics");
    const engagementResult=await supabase.rpc("get_my_community_publication_engagement_metrics");
    const metrics=(metricsResult.data||[]).filter(item=>ids.includes(item.publication_id));
    const engagement=new Map((engagementResult.data||[]).map(item=>[item.publication_id,item]));
    const totals=metrics.reduce((a,item)=>({views:a.views+Number(item.views||0),comments:a.comments+Number(item.comments||0),conversations:a.conversations+Number(item.conversations||0)}),{views:0,comments:0,conversations:0});
    let shares=0,saves=0;
    metrics.forEach(item=>{const extra=engagement.get(item.publication_id)||{};shares+=Number(extra.shares||0);saves+=Number(extra.saves||0);});
    set("ownerStatViews",totals.views);set("ownerStatInterests","—");set("ownerStatConversations",totals.conversations);set("ownerStatSaves",saves);set("ownerStatShares",shares);set("ownerStatComments",totals.comments);set("ownerStatRate",totals.views?Math.round((totals.conversations/totals.views)*1000)/10+"%":"0%");
    try{
      const {data: conversations}=await supabase.from("conversations").select("id").in("origin_publication_id",ids);
      const conversationIds=(conversations||[]).map(item=>item.id);
      if(!conversationIds.length){set("ownerStatMessages",0);}
      else{
        const {data: messages}=await supabase.from("messages").select("id").in("conversation_id",conversationIds);
        set("ownerStatMessages",(messages||[]).length);
      }
    }catch(_){set("ownerStatMessages","—");}
  }catch(error){console.warn("No se pudieron cargar las estadísticas del negocio:",error);}
}

function setupOwnerMode(isOwner, refreshView){
 const bar=document.getElementById("businessOwnerBar");
 const space=document.getElementById("businessSpace");
 const manage=document.getElementById("ownerManageMode");
 const publicMode=document.getElementById("ownerPublicMode");
 if(!bar||!space)return;
 if(!isOwner){
   bar.classList.remove("visible");
   space.classList.remove("owner-active");
   return;
 }

 bar.classList.add("visible");

 const showPublic=()=>{
   space.classList.remove("owner-active");
   refreshView?.();
   window.scrollTo({top:0,behavior:"smooth"});
 };

 const showManage=()=>{
   space.classList.add("owner-active");
   refreshView?.();
   window.scrollTo({top:0,behavior:"smooth"});
 };

 manage?.addEventListener("click",showManage);
 publicMode?.addEventListener("click",showPublic);
 document.getElementById("ownerSidebarManageMode")?.addEventListener("click",showManage);
 document.getElementById("ownerSidebarPublicMode")?.addEventListener("click",showPublic);

 showManage();
}
function withTimeout(promise,ms,fallback){return Promise.race([promise,new Promise(resolve=>setTimeout(()=>resolve(fallback),ms))]);}
async function init(){
 syncBusinessHeaderAvatar();
 const container=document.getElementById("contenido");
 if(!container)return;
 if(!businessId){
     container.innerHTML='<div class="loading">Negocio no especificado.</div>';
     return;
 }

 const directoryResult=await withTimeout(
     BusinessService.getPublicBusinessDirectory(),
     5000,
     {data:[],error:new Error("DIRECTORY_TIMEOUT")}
 );
 const basicData=(directoryResult.data||[]).find(item=>String(item.id)===String(businessId));

 if(!basicData){
     container.innerHTML='<div class="loading">No fue posible cargar este negocio.</div>';
     return;
 }

 let data={...basicData};
 let images=data.logo?[data.logo]:[];
 let reviews=[];
 let services=[];
 let publications=[];

 // El mismo contenido tiene dos presentaciones: gestión y vista pública.
 // Al cambiar de modo hay que volver a renderizar el contenido para que
 // la vista pública recupere exactamente la tarjeta que ve un visitante.
 const refreshView=()=>renderBusiness(data,images,reviews,services,publications);

 const ownerResult=await withTimeout(
     BusinessService.isBusinessOwner(businessId),
     4000,
     {data:false,error:new Error("OWNER_CHECK_TIMEOUT")}
 );
 setupOwnerMode(ownerResult.data===true,refreshView);

 refreshView();

 const detailResult=await withTimeout(
     BusinessService.getPublicBusinessDetail(businessId),
     5000,
     {data:null,error:new Error("DETAIL_TIMEOUT")}
 );

 if(detailResult.data){
     data={...data,...detailResult.data};
     images=data.logo?[data.logo]:[];
     refreshView();
 }

 const [mediaResult,publicReviewsResult,servicesResult,publicationsResult]=await Promise.all([
     withTimeout(
         BusinessMediaService.getPublicBusinessMedia(businessId),
         5000,
         {data:[],error:new Error("MEDIA_TIMEOUT")}
     ),
     withTimeout(
         BusinessService.getPublicBusinessReviews(businessId),
         5000,
         {data:[],error:new Error("REVIEWS_TIMEOUT")}
     ),
     withTimeout(
         BusinessServiceCatalog.getPublicServices(businessId),
         5000,
         {data:[],error:new Error("SERVICES_TIMEOUT")}
     ),
     withTimeout(
         CommunityService.getPublications({businessId,limit:8}),
         5000,
         {data:[],error:new Error("PUBLICATIONS_TIMEOUT")}
     )
 ]);

 images=[];
 if(data.logo)images.push(data.logo);
 images.push(...(mediaResult.data||[])
     .filter(item=>item.tipo==="FOTO")
     .map(item=>item.url)
     .filter(Boolean));
 images=[...new Set(images)].slice(0,3);

 reviews=publicReviewsResult.data||[];
 services=servicesResult.data||[];
 publications=publicationsResult.data||[];
 refreshView();

 if(ownerResult.data===true){
     loadOwnerStatistics(businessId);
     loadOwnerRecentPublications(businessId);
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();