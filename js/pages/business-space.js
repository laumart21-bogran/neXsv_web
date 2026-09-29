import BusinessService from "../services/business.service.js";
import BusinessMediaService from "../services/business-media.service.js";
import { supabase } from "../core/supabase-client.js";
import BusinessServiceCatalog from "../services/business-service.service.js";

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
  ["dias_atencion","Días de atención","text",false],
  ["horario_atencion","Horario de atención","text",false],
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
  if (module === "publications" || module === "community") {
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
    else if (module === "services") await renderServices(content);
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
async function renderServices(content) {
  const result = await BusinessServiceCatalog.getOwnerServices(currentBusiness.id);
  if (result.error) {
    content.innerHTML = '<span class="module-kicker">Servicios</span><h2 class="module-title">No pudimos cargar tus servicios</h2><p class="module-subtitle">Verifica que la estructura de servicios esté activa en Supabase.</p>';
    return;
  }

  const services = result.data || [];
  content.innerHTML =
    '<span class="module-kicker">Servicios</span>' +
    '<h2 class="module-title">Lo que ofrece tu negocio</h2>' +
    '<p class="module-subtitle">Administra los servicios que quieres mostrar públicamente en la ficha de tu negocio.</p>' +
    '<div class="services-module-toolbar"><span>' + services.length + ' servicio' + (services.length === 1 ? '' : 's') + '</span><button type="button" class="module-btn primary" id="serviceNewButton"><i class="fa-solid fa-plus"></i> Nuevo servicio</button></div>' +
    '<div id="servicesModuleList">' + renderOwnerServicesList(services) + '</div>' +
    '<div id="serviceFormContainer"></div>';

  document.getElementById("serviceNewButton")?.addEventListener("click", () => renderServiceForm());
  document.querySelectorAll("[data-edit-service]").forEach(button => {
    button.addEventListener("click", () => {
      const service = services.find(item => item.id === button.dataset.editService);
      if (service) renderServiceForm(service);
    });
  });
  document.querySelectorAll("[data-delete-service]").forEach(button => {
    button.addEventListener("click", () => deleteService(button.dataset.deleteService));
  });
  document.querySelectorAll("[data-toggle-service]").forEach(button => {
    button.addEventListener("click", () => toggleService(button.dataset.toggleService, button.dataset.active === "true"));
  });
}

function renderOwnerServicesList(services) {
  if (!services.length) {
    return '<div class="services-module-empty"><i class="fa-solid fa-list-check"></i><strong>Aún no tienes servicios publicados</strong><span>Agrega el primero para que tus clientes sepan qué ofreces.</span></div>';
  }
  return services.map(service => {
    const price = formatServicePrice(service);
    return '<article class="service-module-item">' +
      '<div class="service-module-copy"><div class="service-module-top"><strong>' + escapeText(service.nombre) + '</strong><span class="service-module-status ' + (service.activo ? 'active' : 'inactive') + '">' + (service.activo ? 'Publicado' : 'Oculto') + '</span></div>' +
      '<p>' + escapeText(service.descripcion || 'Sin descripción') + '</p>' +
      '<span class="service-module-price">' + escapeText(price) + '</span></div>' +
      '<div class="service-module-actions"><button type="button" class="service-icon-btn" data-toggle-service="' + escapeAttr(service.id) + '" data-active="' + String(service.activo) + '" title="' + (service.activo ? 'Ocultar' : 'Publicar') + '"><i class="fa-solid ' + (service.activo ? 'fa-eye-slash' : 'fa-eye') + '"></i></button><button type="button" class="service-icon-btn" data-edit-service="' + escapeAttr(service.id) + '" title="Editar"><i class="fa-solid fa-pen"></i></button><button type="button" class="service-icon-btn danger" data-delete-service="' + escapeAttr(service.id) + '" title="Eliminar"><i class="fa-solid fa-trash"></i></button></div>' +
      '</article>';
  }).join("");
}

function formatServicePrice(service) {
  if (service.precio === null || service.precio === undefined || service.precio === "") return "Consultar precio";
  const amount = Number(service.precio).toFixed(2);
  if (service.precio_tipo === "DESDE") return "Desde $" + amount;
  return "$" + amount;
}

function renderServiceForm(service = null) {
  const container = document.getElementById("serviceFormContainer");
  if (!container) return;
  const editing = Boolean(service);
  container.innerHTML =
    '<div class="service-module-form"><div class="service-module-form-head"><div><span class="module-kicker">' + (editing ? 'Editar servicio' : 'Nuevo servicio') + '</span><h3>' + (editing ? 'Actualiza la información' : 'Agrega un servicio') + '</h3></div><button type="button" class="service-form-close" id="serviceFormClose"><i class="fa-solid fa-xmark"></i></button></div>' +
    '<form id="businessServiceForm"><div class="module-form-grid">' +
    '<div class="module-field full"><label>Nombre del servicio *</label><input name="nombre" maxlength="120" required value="' + escapeAttr(service?.nombre || '') + '"></div>' +
    '<div class="module-field full"><label>Descripción</label><textarea name="descripcion" maxlength="500" placeholder="Explica brevemente qué incluye.">' + escapeText(service?.descripcion || '') + '</textarea></div>' +
    '<div class="module-field"><label>Tipo de precio</label><select name="precio_tipo"><option value="CONSULTAR"' + (service?.precio_tipo === "CONSULTAR" || !service ? ' selected' : '') + '>Consultar</option><option value="FIJO"' + (service?.precio_tipo === "FIJO" ? ' selected' : '') + '>Precio fijo</option><option value="DESDE"' + (service?.precio_tipo === "DESDE" ? ' selected' : '') + '>Desde</option></select></div>' +
    '<div class="module-field"><label>Precio</label><input name="precio" type="number" min="0" step="0.01" value="' + (service?.precio ?? '') + '" placeholder="Opcional"></div>' +
    '</div><div class="module-actions"><span id="serviceFormMessage" class="module-message"></span><button type="button" class="module-btn secondary" id="serviceFormCancel">Cancelar</button><button type="submit" class="module-btn primary"><i class="fa-solid fa-check"></i> ' + (editing ? 'Guardar cambios' : 'Agregar servicio') + '</button></div></form></div>';

  document.getElementById("serviceFormClose")?.addEventListener("click", () => { container.innerHTML = ""; });
  document.getElementById("serviceFormCancel")?.addEventListener("click", () => { container.innerHTML = ""; });
  document.getElementById("businessServiceForm")?.addEventListener("submit", event => saveService(event, service));
}

async function saveService(event, service) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.getElementById("serviceFormMessage");
  const button = form.querySelector("button[type='submit']");
  const nombre = form.elements.nombre.value.trim();
  const descripcion = form.elements.descripcion.value.trim() || null;
  const precioTipo = form.elements.precio_tipo.value;
  const rawPrice = form.elements.precio.value.trim();
  const precio = rawPrice === "" ? null : Number(rawPrice);

  if (!nombre) {
    message.textContent = "El nombre del servicio es obligatorio.";
    message.className = "module-message error";
    return;
  }
  if (rawPrice !== "" && (!Number.isFinite(precio) || precio < 0)) {
    message.textContent = "Ingresa un precio válido.";
    message.className = "module-message error";
    return;
  }

  button.disabled = true;
  button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando…';
  const payload = {
    business_id: currentBusiness.id,
    nombre,
    descripcion,
    precio,
    precio_tipo: precioTipo,
    activo: service?.activo ?? true,
    orden: service?.orden ?? 0
  };

  const result = service
    ? await BusinessServiceCatalog.updateService(service.id, payload)
    : await BusinessServiceCatalog.createService(payload);

  if (result.error) {
    message.textContent = result.error.message || "No fue posible guardar el servicio.";
    message.className = "module-message error";
    button.disabled = false;
    button.innerHTML = '<i class="fa-solid fa-check"></i> Guardar';
    return;
  }

  await renderServices(document.getElementById("businessModuleContent"));
}

async function toggleService(serviceId, active) {
  const result = await BusinessServiceCatalog.updateService(serviceId, { activo: !active });
  if (result.error) {
    alert("No fue posible actualizar el estado del servicio.");
    return;
  }
  await renderServices(document.getElementById("businessModuleContent"));
}

async function deleteService(serviceId) {
  const confirmed = window.confirm("¿Eliminar este servicio? Esta acción solo afecta este servicio del catálogo.");
  if (!confirmed) return;
  const result = await BusinessServiceCatalog.deleteService(serviceId);
  if (result.error) {
    alert("No fue posible eliminar el servicio.");
    return;
  }
  await renderServices(document.getElementById("businessModuleContent"));
}

function renderUnavailable(content,module){content.innerHTML='<span class="module-kicker">Próximamente</span><h2 class="module-title">'+(module==="services"?"Servicios":"Este módulo")+'</h2><p class="module-subtitle">La estructura ya está preparada. Lo conectaremos en el siguiente paso sin sacar al propietario de su espacio de negocio.</p>'}
function escapeAttr(value){return String(value??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function escapeText(value){return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
