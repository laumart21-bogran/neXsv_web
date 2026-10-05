import BusinessService from "../services/business.service.js";
import CommunityService from "../services/community.service.js";
import AuthSession from "../auth/auth.session.js";

const state={businesses:[],publications:[],authenticated:false,term:""};
const normalize=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const escapeHtml=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
const matches=values=>{const t=normalize(state.term);return !!t&&values.map(normalize).join(" ").includes(t)};

function results(){
 const business=state.businesses.filter(b=>matches([b.nombre,b.categoria,b.descripcion])).map(b=>({kind:"Negocio",icon:"fa-store",title:b.nombre||"Negocio",url:"negocio.html?id="+encodeURIComponent(b.id)}));
 const opportunities=state.authenticated?state.publications.filter(p=>matches([p.title,p.body,p.type])).map(p=>({kind:"Oportunidad",icon:"fa-bullhorn",title:p.title||p.type||"Oportunidad",url:"comunidad.html?publicacion="+encodeURIComponent(p.id)})):[];
 const content=[
  {title:"¿Por qué mi negocio no vende?",url:"Blogs/por-que-no-vendes.html",keywords:"ventas negocio clientes marketing"},
  {title:"Cómo lograr ventas constantes teniendo presencia donde los clientes buscan",url:"Blogs/ventas-constantes.html",keywords:"ventas presencia clientes negocio"},
  {title:"Errores que hacen invisible tu negocio",url:"Blogs/errores-visibilidad.html",keywords:"visibilidad negocio marketing clientes"},
  {title:"Por qué algunos negocios venden y otros no",url:"Blogs/negocios-que-si-venden.html",keywords:"ventas negocio estrategia clientes"},
  {title:"Cómo empezar a recibir clientes reales",url:"Blogs/como-recibir-clientes.html",keywords:"clientes ventas comunidad negocio"}
 ].filter(i=>matches([i.title,i.keywords])).map(i=>({kind:"Contenido",icon:"fa-newspaper",title:i.title,url:i.url}));
 return [...business,...opportunities,...content].slice(0,5);
}

function render(){
 const box=document.getElementById("nexHeaderSearchResults");
 if(!box)return;
 const term=state.term;
 if(!term){box.classList.remove("is-open");box.innerHTML="";return}
 const items=results();
 box.classList.add("is-open");
 box.innerHTML=items.length?items.map(r=>'<a class="nex-header-search-result" href="'+escapeHtml(r.url)+'"><span class="nex-header-search-result-icon"><i class="fa-solid '+escapeHtml(r.icon)+'"></i></span><span class="nex-header-search-result-content"><span class="nex-header-search-type">'+escapeHtml(r.kind)+'</span><span class="nex-header-search-title">'+escapeHtml(r.title)+'</span></span></a>').join("")+'<a class="nex-header-search-more" href="buscar.html?q='+encodeURIComponent(term)+'">Ver todos los resultados →</a>':'<div class="nex-header-search-empty">No encontramos resultados. Prueba con otro término.</div>';
}

async function loadSources(){
 try{
  if(!AuthSession.isInitialized())await AuthSession.initialize();
  state.authenticated=AuthSession.isAuthenticated();
  const b=await BusinessService.getPublicBusinessDirectory();
  state.businesses=b.error?[]:(b.data||[]);
  if(state.authenticated){
   const p=await CommunityService.getPublications({limit:60});
   state.publications=p.error?[]:(p.data||[]);
  }
 }catch(error){console.warn("No se pudieron cargar los resultados de búsqueda:",error)}
}

function bind(){
 const input=document.getElementById("nexHeaderSearchInput");
 const box=document.getElementById("nexHeaderSearchResults");
 if(!input||!box)return;
 input.addEventListener("input",()=>{state.term=input.value.trim();render()});
 input.addEventListener("keydown",e=>{if(e.key==="Enter"&&state.term){window.location.href="buscar.html?q="+encodeURIComponent(state.term)}});
 document.addEventListener("click",e=>{if(!document.getElementById("nexHeaderSearch")?.contains(e.target))box.classList.remove("is-open")});
}
async function init(){bind();await loadSources()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();