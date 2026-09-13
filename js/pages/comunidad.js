import CommunityService from "../services/community.service.js";
import MessagingService from "../services/messaging.service.js";
import { supabase } from "../core/supabase-client.js";

const publicationList = document.getElementById("publicationList");
const composer = document.getElementById("publicationComposer");
const publicationForm = document.getElementById("publicationForm");
const newPublicationBtn = document.getElementById("newPublicationBtn");
const closeComposer = document.getElementById("closeComposer");
const publicationMessage = document.getElementById("publicationMessage");

let currentUser = null;
let currentFilter = "TODAS";

const TYPE_LABELS = { VENTA:"Vendo", INTERCAMBIO:"Intercambio", BUSCO:"Busco", REGALO:"Regalo", RECOMENDACION:"Recomendación", OFERTA:"Ofrezco", EVENTO:"Evento" };

function escapeHtml(value) {
    return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function initials(name="Miembro") { return String(name).trim().split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]?.toUpperCase()).join("") || "M"; }
function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("es-SV",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(date);
}
function showMessage(text,type="") { publicationMessage.textContent=text||""; publicationMessage.className=`form-message ${type}`.trim(); }

async function getAuthorProfile(userId) {
    const {data,error}=await supabase.from("profiles").select("nombre, apellido, foto").eq("auth_user_id",userId).maybeSingle();
    if(error || !data) return {name:"Miembro neXsv",photo:null};
    return {name:[data.nombre,data.apellido].filter(Boolean).join(" ").trim()||"Miembro neXsv",photo:data.foto||null};
}
async function enrichPublications(publications) { return Promise.all((publications||[]).map(async p=>({...p,author:await getAuthorProfile(p.author_id)}))); }
function renderEmpty() {
    publicationList.innerHTML=`<div class="community-empty"><div class="community-empty-icon"><i class="fa-regular fa-comments"></i></div><h2>Aún no hay publicaciones</h2><p>Sé de las primeras personas en compartir algo con la comunidad.</p><button type="button" class="community-secondary-btn" id="emptyCreateBtn">Crear publicación</button></div>`;
    document.getElementById("emptyCreateBtn")?.addEventListener("click",openComposer);
}
function renderError(error) {
    console.error("Error en Comunidad:",error);
    publicationList.innerHTML=`<div class="community-empty"><div class="community-empty-icon warning"><i class="fa-solid fa-triangle-exclamation"></i></div><h2>No pudimos cargar la comunidad</h2><p>${escapeHtml(error?.message||"Actualiza la página e inténtalo nuevamente.")}</p></div>`;
}
function renderPublications(publications) {
    if(!publications.length) return renderEmpty();
    publicationList.innerHTML=publications.map(p=>{
        const isMine=p.author_id===currentUser.id;
        return `<article class="publication-card" data-publication-id="${escapeHtml(p.id)}"><div class="publication-author"><div class="author-avatar">${escapeHtml(initials(p.author.name))}</div><div class="author-info"><strong>${escapeHtml(p.author.name)}</strong><span>${escapeHtml(formatDate(p.created_at))}</span></div><span class="publication-type">${escapeHtml(TYPE_LABELS[p.type]||p.type)}</span></div>${p.title?`<h2>${escapeHtml(p.title)}</h2>`:""}<p class="publication-body">${escapeHtml(p.body)}</p><div class="publication-actions">${isMine?`<span class="publication-owner-note"><i class="fa-solid fa-user"></i> Tu publicación</span>`:`<button class="interest-btn" type="button" data-interest="${escapeHtml(p.id)}" data-author="${escapeHtml(p.author_id)}"><i class="fa-regular fa-comment-dots"></i> Me interesa</button>`}</div></article>`;
    }).join("");
    publicationList.querySelectorAll("[data-interest]").forEach(button=>button.addEventListener("click",()=>startConversation(button)));
}
async function loadPublications() {
    publicationList.innerHTML=`<div class="community-loading"><i class="fa-solid fa-circle-notch fa-spin"></i><span>Cargando comunidad...</span></div>`;
    const {data,error}=await CommunityService.getPublications({type:currentFilter});
    if(error) return renderError(error);
    renderPublications(await enrichPublications(data));
}
async function startConversation(button) {
    const publicationId=button.dataset.interest, authorId=button.dataset.author;
    if(!publicationId||!authorId||authorId===currentUser.id)return;
    button.disabled=true; const original=button.innerHTML; button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> Abriendo...`;
    try {
        const {data:conversationId,error:conversationError}=await MessagingService.getOrCreateDirectConversation(authorId);
        if(conversationError||!conversationId) throw conversationError||new Error("No fue posible iniciar la conversación.");
        const {error:originError}=await CommunityService.setConversationOrigin(conversationId,publicationId);
        if(originError) console.warn("No se pudo asociar el origen de la publicación:",originError);
        window.location.href=`mensajes.html?conversation=${encodeURIComponent(conversationId)}`;
    } catch(error) {
        console.error("Error iniciando conversación:",error); alert(error?.message||"No fue posible iniciar la conversación."); button.disabled=false; button.innerHTML=original;
    }
}
function openComposer() {
    composer.hidden=false;
    showMessage();
    document.getElementById("publicationBody")?.focus();
    composer.scrollIntoView({behavior:"smooth",block:"center"});
}
function closePublicationComposer(){composer.hidden=true;showMessage();}

newPublicationBtn?.addEventListener("click",openComposer);
closeComposer?.addEventListener("click",closePublicationComposer);
document.querySelectorAll(".type-option input").forEach(input=>input.addEventListener("change",()=>document.querySelectorAll(".type-option").forEach(o=>o.classList.toggle("active",o.querySelector("input")?.checked))));
document.querySelectorAll(".filter-btn").forEach(button=>button.addEventListener("click",async()=>{currentFilter=button.dataset.filter||"TODAS";document.querySelectorAll(".filter-btn").forEach(item=>item.classList.toggle("active",item===button));await loadPublications();}));
publicationForm?.addEventListener("submit",async event=>{
    event.preventDefault(); showMessage();
    const type=publicationForm.querySelector("input[name='type']:checked")?.value;
    const title=document.getElementById("publicationTitle")?.value.trim()||"";
    const body=document.getElementById("publicationBody")?.value.trim()||"";
    const submitButton=publicationForm.querySelector("button[type='submit']");
    if(!type||!body){showMessage("Escribe algo para poder publicar.","error");return;}
    if(!currentUser){showMessage("Tu sesión no está disponible. Recarga la página e inténtalo nuevamente.","error");return;}
    submitButton.disabled=true;submitButton.textContent="Publicando...";
    const {error}=await CommunityService.createPublication({type,title,body});
    submitButton.disabled=false;submitButton.textContent="Publicar";
    if(error){console.error("Error creando publicación:",error);showMessage(error.message||"No fue posible publicar.","error");return;}
    publicationForm.reset();document.querySelectorAll(".type-option").forEach(o=>o.classList.toggle("active",o.querySelector("input")?.checked));closePublicationComposer();await loadPublications();
});

function applyUrlShortcut(){
    const params=new URLSearchParams(window.location.search);
    const type=params.get("type");
    const create=params.get("create")==="1";
    if(type && TYPE_LABELS[type]){
        const input=document.querySelector(`.type-option input[value="${CSS.escape(type)}"]`);
        if(input){input.checked=true;document.querySelectorAll(".type-option").forEach(o=>o.classList.toggle("active",o.querySelector("input")?.checked));}
        currentFilter=type;
        document.querySelectorAll(".filter-btn").forEach(o=>o.classList.toggle("active",o.dataset.filter===type));
    }
    if(create) setTimeout(openComposer,100);
}

async function initialize(){
    try{
        const {data,error}=await supabase.auth.getUser();
        if(error)throw error;
        currentUser=data.user||null;
        if(!currentUser){window.location.href="login.html";return;}
        applyUrlShortcut();
        await loadPublications();
    }catch(error){renderError(error);}
}
initialize();
