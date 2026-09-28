import BusinessService from "../services/business.service.js";
import BusinessMediaService from "../services/business-media.service.js";
import { supabase } from "../core/supabase-client.js";

const businessId = new URLSearchParams(window.location.search).get("id");
let currentBusiness = null;
let currentUser = null;

const informationFields = [
  ["nombre","Nombre del negocio","text",true],
  ["categoria","Categoría","text",true],
  ["etapa_negocio","Etapa del negocio","text",false],
  ["tipo_oferta","Tipo de oferta","text",false],
  ["departamento","Departamento","text",false],
  ["municipio","Municipio","text",false],
  ["whatsapp","WhatsApp","text",false],
  ["email","Correo electrónico","email",false],
  ["sitio_web","Sitio web","url",false],
  ["google_maps_url","Enlace de ubicación","url",false],
  ["instagram","Instagram","url",false],
  ["facebook","Facebook","url",false],
  ["tiktok","TikTok","url",false],
  ["otra_red_social","Otra red social","url",false],
  ["descripcion","Descripción","textarea",false]
];

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-business-module]").forEach(button => {
    button.addEventListener("click", () => openModule(button.dataset.businessModule));
  });
  document.getElementById("businessModuleClose")?.addEventListener("click", closeModule);
  document.getElementById("businessModuleOverlay")?.addEventListener("click", event => {
    if (event.target.id === "businessModuleOverlay") closeModule();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModule();
  });
});

async function ensureOwner() {
  if (!businessId) throw new Error("NEGOCIO_NO_ESPECIFICADO");
  if (currentBusiness && currentUser) return currentBusiness;
  const { data: userResult } = await supabase.auth.getUser();
  currentUser = userResult?.user || null;
  if (!currentUser) throw new Error("AUTH_REQUIRED");

  const ownerCheck = await BusinessService.isBusinessOwner(businessId);
  if (ownerCheck.error || !ownerCheck.data) throw new Error("OWNER_REQUIRED");

  const result = await BusinessService.getBusinessById(businessId);
  if (result.error || !result.data) throw new Error("BUSINESS_NOT_FOUND");
  currentBusiness = result.data;
  return currentBusiness;
}

async function openModule(module) {
  if (module === "publish") {
    window.location.href = "comunidad.html?business=" + encodeURIComponent(businessId);
    return;
  }
  const overlay = document.getElementById("businessModuleOverlay");
  const content = document.getElementById("businessModuleContent");
  if (!overlay || !content) return;
  content.innerHTML = '<div class="loading">Cargando…</div>';
  overlay.hidden = false;
  document.body.style.overflow = "hidden";

  try {
    await ensureOwner();
    if (module === "information") renderInformation(content);
    else if (module === "presentation") await renderPresentation(content);
    else renderUnavailable(content, module);
  } catch (error) {
    content.innerHTML = '<span class="module-kicker">Acceso</span><h2 class="module-title">No pudimos abrir este módulo</h2><p class="module-subtitle">Verifica tu sesión y que este negocio pertenezca a tu cuenta.</p>';
  }
}

function closeModule() {
  const overlay = document.getElementById("businessModuleOverlay");
  if (!overlay) return;
  overlay.hidden = true;
  document.body.style.overflow = "";
}

function renderInformation(content) {
  content.innerHTML = '<span class="module-kicker">Información</span><h2 id="businessModuleTitle" class="module-title">Información del negocio</h2><p class="module-subtitle">Actualiza los datos que forman parte de la presencia pública de tu negocio en neXsv.</p><form id="businessInformationForm"><div class="module-form-grid">'+
    informationFields.map(([key,label,type,required]) => {
      const value = escapeAttr(currentBusiness?.[key] ?? "");
      if (type === "textarea") return '<div class="module-field full"><label>'+label+'</label><textarea name="'+key+'">'+escapeText(currentBusiness?.[key] ?? "")+'</textarea></div>';
      return '<div class="module-field'+(key==="nombre"||key==="descripcion"?" full":"")+'"><label>'+label+(required?" *":"")+'</label><input name="'+key+'" type="'+type+'" value="'+value+'" '+(required?"required":"")+'></div>';
    }).join("")+
    '</div><div class="module-actions"><span id="informationMessage" class="module-message"></span><button type="button" class="module-btn secondary" id="informationCancel">Cancelar</button><button type="submit" class="module-btn primary"><i class="fa-solid fa-check"></i> Guardar cambios</button></div></form>';
  document.getElementById("informationCancel")?.addEventListener("click", closeModule);
  document.getElementById("businessInformationForm")?.addEventListener("submit", saveInformation);
}

async function saveInformation(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  const message = document.getElementById("informationMessage");
  const data = {};
  informationFields.forEach(([key]) => {
    const value = form.elements[key]?.value?.trim() || null;
    data[key] = value;
  });
  if (!data.nombre || !data.categoria) {
    message.textContent = "Nombre y categoría son obligatorios.";
    message.className = "module-message error";
    return;
  }
  button.disabled = true;
  button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando…';
  try {
    const result = await BusinessService.updateBusiness(currentBusiness.id, data);
    if (result.error) throw result.error;
    currentBusiness = result.data;
    message.textContent = "Cambios guardados.";
    message.className = "module-message success";
    setTimeout(() => window.location.reload(), 650);
  } catch (error) {
    message.textContent = error.message || "No fue posible guardar los cambios.";
    message.className = "module-message error";
    button.disabled = false;
    button.innerHTML = '<i class="fa-solid fa-check"></i> Guardar cambios';
  }
}

async function renderPresentation(content) {
  const mediaResult = await BusinessMediaService.getPresentationMedia(currentBusiness.id);
  const bySlot = new Map((mediaResult.data || []).map(item => [Number(item.slot), item]));
  content.innerHTML = '<span class="module-kicker">Presentación pública</span><h2 id="businessModuleTitle" class="module-title">Así se presenta tu negocio</h2><p class="module-subtitle">Tú controlas el logotipo y las dos fotografías que forman la presentación pública de tu negocio.</p>'+
    '<div class="presentation-module-preview"><div class="presentation-module-logo" id="moduleLogoPreview">'+(currentBusiness.logo?'<img src="'+escapeAttr(currentBusiness.logo)+'" alt="Logotipo">':'<i class="fa-solid fa-store"></i>')+'</div><div class="presentation-module-copy"><strong>Imagen principal / portada</strong><span>Sube únicamente el logotipo oficial de tu empresa sobre fondo blanco.</span><label for="moduleLogoInput" class="presentation-upload"><i class="fa-solid fa-upload"></i> Cambiar logotipo</label><input id="moduleLogoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden></div></div>'+
    '<div class="presentation-slots">'+
    presentationSlot(2,bySlot.get(2)?.url||"")+
    presentationSlot(3,bySlot.get(3)?.url||"")+
    '</div><div id="presentationModuleStatus" class="presentation-status"></div>';
  document.getElementById("moduleLogoInput")?.addEventListener("change", async event => {
    const file=event.target.files?.[0]; event.target.value=""; if(file) await replaceLogo(file);
  });
  document.querySelectorAll("[data-presentation-slot]").forEach(input => input.addEventListener("change", async event => {
    const file=event.target.files?.[0]; const slot=Number(event.target.dataset.presentationSlot); event.target.value=""; if(file) await replaceImage(slot,file);
  }));
}

function presentationSlot(slot,url) {
  return '<article class="presentation-module-slot"><div class="presentation-module-media" id="moduleSlot'+slot+'">'+(url?'<img src="'+escapeAttr(url)+'" alt="Fotografía '+slot+'">':'<i class="fa-regular fa-image"></i>')+'</div><h3>Imagen complementaria '+slot+'</h3><p><strong>Medida obligatoria: 1600 × 900 px (16:9).</strong><br>JPG, PNG o WebP, máximo 5 MB.</p><label for="moduleImage'+slot+'" class="presentation-upload"><i class="fa-solid fa-upload"></i> Cambiar imagen</label><input id="moduleImage'+slot+'" type="file" accept="image/jpeg,image/png,image/webp" hidden data-presentation-slot="'+slot+'"></article>';
}

async function replaceLogo(file) {
  if (!validateImage(file)) return;
  setPresentationStatus("Guardando logotipo…");
  const extension=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";
  const path=currentUser.id+"/"+currentBusiness.id+"/presentation-logo-"+crypto.randomUUID()+"."+extension;
  const {error:uploadError}=await supabase.storage.from("business-logos").upload(path,file,{contentType:file.type,upsert:false});
  if(uploadError){setPresentationStatus("No se pudo guardar el logotipo.","error");return;}
  const publicUrl=supabase.storage.from("business-logos").getPublicUrl(path).data.publicUrl;
  const result=await BusinessService.updateBusiness(currentBusiness.id,{logo:publicUrl});
  if(result.error){await supabase.storage.from("business-logos").remove([path]);setPresentationStatus(result.error.message||"No se pudo actualizar el logotipo.","error");return;}
  currentBusiness=result.data;
  const preview=document.getElementById("moduleLogoPreview");
  if(preview)preview.innerHTML='<img src="'+escapeAttr(publicUrl)+'" alt="Logotipo">';
  setPresentationStatus("Logotipo actualizado.","success");
}

async function replaceImage(slot,file) {
  if(!await validatePresentationImage(file))return;
  setPresentationStatus("Guardando imagen…");
  const optimized=await optimizePresentationImage(file);
  const result=await BusinessMediaService.replacePresentationImage(currentBusiness.id,slot,optimized);
  if(result.error){setPresentationStatus(result.error.message||"No se pudo guardar la imagen.","error");return;}
  const preview=document.getElementById("moduleSlot"+slot);
  if(preview)preview.innerHTML='<img src="'+escapeAttr(result.data?.url||"")+'" alt="Fotografía '+slot+'">';
  setPresentationStatus("Imagen actualizada.","success");
}

function validateImage(file){
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setPresentationStatus("Solo JPG, PNG o WebP.","error");return false}
  if(file.size>5*1024*1024){setPresentationStatus("La imagen no puede superar 5 MB.","error");return false}
  return true;
}
async function validatePresentationImage(file){
  if(!validateImage(file))return false;
  try{const dimensions=await readDimensions(file);if(dimensions.width!==1600||dimensions.height!==900){setPresentationStatus("La imagen debe medir exactamente 1600 × 900 px (16:9).","error");return false}return true}catch(_){setPresentationStatus("No pudimos comprobar las dimensiones.","error");return false}
}
function readDimensions(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),image=new Image();image.onload=()=>{URL.revokeObjectURL(url);resolve({width:image.naturalWidth,height:image.naturalHeight})};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("INVALID_IMAGE"))};image.src=url})}
async function optimizePresentationImage(file){
  try{const url=URL.createObjectURL(file),image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url});const canvas=document.createElement("canvas");canvas.width=1600;canvas.height=900;canvas.getContext("2d").drawImage(image,0,0,1600,900);URL.revokeObjectURL(url);const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",.82));if(!blob)return file;return new File([blob],"presentation-"+Date.now()+".webp",{type:"image/webp",lastModified:Date.now()})}catch(_){return file}
}
function setPresentationStatus(text,type=""){const el=document.getElementById("presentationModuleStatus");if(!el)return;el.textContent=text;el.className="presentation-status "+type}
function renderUnavailable(content,module){content.innerHTML='<span class="module-kicker">Próximamente</span><h2 class="module-title">'+(module==="services"?"Servicios":"Este módulo")+'</h2><p class="module-subtitle">La estructura ya está preparada. Lo conectaremos en el siguiente paso sin sacar al propietario de su espacio de negocio.</p>'}
function escapeAttr(value){return String(value??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function escapeText(value){return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
