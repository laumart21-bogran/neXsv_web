import BusinessService from "../services/business.service.js";
import CommunityService from "../services/community.service.js";
import AuthSession from "../auth/auth.session.js";

const BLOG_CONTENT=[
{title:"¿Por qué mi negocio no vende?",url:"Blogs/por-que-no-vendes.html",description:"Razones por las que un negocio puede tener presencia pero no convertirla en ventas.",keywords:"ventas negocio clientes marketing"},
{title:"Cómo lograr ventas constantes teniendo presencia donde los clientes buscan",url:"Blogs/ventas-constantes.html",description:"Estrategias para mejorar la presencia de un negocio y generar ventas constantes.",keywords:"ventas presencia clientes negocio"},
{title:"Errores que hacen invisible tu negocio",url:"Blogs/errores-visibilidad.html",description:"Errores de visibilidad que pueden impedir que los clientes encuentren tu negocio.",keywords:"visibilidad negocio marketing clientes"},
{title:"Por qué algunos negocios venden y otros no",url:"Blogs/negocios-que-si-venden.html",description:"Claves que ayudan a entender por qué algunos negocios consiguen mejores resultados.",keywords:"ventas negocio estrategia clientes"},
{title:"Cómo empezar a recibir clientes reales",url:"Blogs/como-recibir-clientes.html",description:"Ideas para comenzar a conectar con clientes reales dentro de una comunidad.",keywords:"clientes ventas comunidad negocio"}
];

const state={businesses:[],publications:[],authenticated:false,type:"TODOS",term:""};
const normalize=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const escapeHtml=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
const matchesText=values=>{const term=normalize(state.term);return !term||values.map(normalize).join(" ").includes(term)};

function businessResults(){return state.businesses.filter(b=>matchesText([b.nombre,b.categoria,b.descripcion])).map(b=>({kind:"Negocio",icon:"fa-store",title:b.nombre||"Negocio",description:b.descripcion||"Negocio dentro de la comunidad neXsv.",meta:b.categoria||"Negocio",url:"negocio.html?id="+encodeURIComponent(b.id)}))}
function opportunityResults(){if(!state.authenticated)return [];return state.publications.filter(p=>matchesText([p.title,p.body,p.type])).map(p=>({kind:"Oportunidad",icon:"fa-bullhorn",title:p.title||p.type||"Oportunidad",description:p.body,meta:p.type||"Publicación",url:"comunidad.html?publicacion="+encodeURIComponent(p.id)}))}
function contentResults(){return BLOG_CONTENT.filter(i=>matchesText([i.title,i.description,i.keywords])).map(i=>({kind:"Contenido",icon:"fa-newspaper",title:i.title,description:i.description,meta:"Blog neXsv",url:i.url}))}

function render(){
 const container=document.getElementById("searchResults"),status=document.getElementById("searchStatus");
 if(!container||!status)return;
 if(!state.term){status.textContent="Escribe algo para comenzar.";container.innerHTML="";return}
 let results=[];
 if(state.type==="TODOS")results=[...businessResults(),...opportunityResults(),...contentResults()];
 if(state.type==="NEGOCIOS")results=businessResults();
 if(state.type==="OPORTUNIDADES")results=opportunityResults();
 if(state.type==="CONTENIDO")results=contentResults();
 results=results.slice(0,30);
 status.textContent=results.length?results.length+" resultado"+(results.length===1?"":"s"):"No encontramos resultados.";
 if(!results.length){
   container.innerHTML=state.type==="OPORTUNIDADES"&&!state.authenticated
   ?'<div class="search-login-note"><strong>Las oportunidades son parte de la comunidad privada.</strong> Inicia sesión para buscar publicaciones y oportunidades de tu comunidad.</div>'
   :'<div class="search-empty"><strong>No encontramos lo que buscas.</strong><span>Prueba con otro término o cambia el tipo de resultado.</span></div>';
   return;
 }
 container.innerHTML=results.map(r=>'<a class="search-result" href="'+escapeHtml(r.url)+'"><span class="search-result-icon"><i class="fa-solid '+escapeHtml(r.icon)+'"></i></span><span class="search-result-content"><span class="search-result-type">'+escapeHtml(r.kind)+'</span><h2>'+escapeHtml(r.title)+'</h2><p>'+escapeHtml(r.description)+'</p><span class="search-result-meta">'+escapeHtml(r.meta)+'</span></span></a>').join("");
}

async function loadSources(){
 if(!AuthSession.isInitialized())await AuthSession.initialize();
 state.authenticated=AuthSession.isAuthenticated();
 const businessResult=await BusinessService.getPublicBusinessDirectory();
 state.businesses=businessResult.error?[]:(businessResult.data||[]);
 if(state.authenticated){
   const publicationResult=await CommunityService.getPublications({limit:60});
   state.publications=publicationResult.error?[]:(publicationResult.data||[]);
 }
 render();
}

function bind(){
 const input=document.getElementById("globalSearchInput"),clear=document.getElementById("clearSearchBtn");
 input?.addEventListener("input",()=>{state.term=input.value.trim();if(clear)clear.hidden=!state.term;render()});
 clear?.addEventListener("click",()=>{input.value="";state.term="";clear.hidden=true;input.focus();render()});
 document.querySelectorAll(".search-tab").forEach(tab=>tab.addEventListener("click",()=>{state.type=tab.dataset.searchType||"TODOS";document.querySelectorAll(".search-tab").forEach(i=>i.classList.toggle("active",i===tab));render()}));
}
async function init(){
 bind();
 await loadSources();
 const term=new URLSearchParams(window.location.search).get("q");
 if(term){const input=document.getElementById("globalSearchInput");if(input){input.value=term;state.term=term;document.getElementById("clearSearchBtn").hidden=false;render()}}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();