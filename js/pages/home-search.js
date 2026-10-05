import BusinessService from "../services/business.service.js";
import CommunityService from "../services/community.service.js";
import AuthSession from "../auth/auth.session.js";

const state={businesses:[],publications:[],authenticated:false,type:"TODOS",term:""};
const normalize=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const escapeHtml=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
const matches=values=>{const t=normalize(state.term);return t&&values.map(normalize).join(" ").includes(t)};

function results(){
 const term=state.term;if(!term)return [];
 const business=state.businesses.filter(b=>matches([b.nombre,b.categoria,b.descripcion])).map(b=>({kind:"Negocio",icon:"fa-store",title:b.nombre||"Negocio",description:b.descripcion||"Negocio dentro de la comunidad neXsv.",url:"negocio.html?id="+encodeURIComponent(b.id)}));
 const opportunities=state.authenticated?state.publications.filter(p=>matches([p.title,p.body,p.type])).map(p=>({kind:"Oportunidad",icon:"fa-bullhorn",title:p.title||p.type||"Oportunidad",description:p.body||"",url:"comunidad.html?publicacion="+encodeURIComponent(p.id)})):[];
 const content=[
  {title:"¿Por qué mi negocio no vende?",url:"Blogs/por-que-no-vendes.html",description:"Razones por las que un negocio puede tener presencia pero no convertirla en ventas.",keywords:"ventas negocio clientes marketing"},
  {title:"Cómo lograr ventas constantes teniendo presencia donde los clientes buscan",url:"Blogs/ventas-constantes.html",description:"Estrategias para mejorar la presencia de un negocio y generar ventas constantes.",keywords:"ventas presencia clientes negocio"},
  {title:"Errores que hacen invisible tu negocio",url:"Blogs/errores-visibilidad.html",description:"Errores de visibilidad que pueden impedir que los clientes encuentren tu negocio.",keywords:"visibilidad negocio marketing clientes"},
  {title:"Por qué algunos negocios venden y otros no",url:"Blogs/negocios-que-si-venden.html",description:"Claves que ayudan a entender por qué algunos negocios consiguen mejores resultados.",keywords:"ventas negocio estrategia clientes"},
  {title:"Cómo empezar a recibir clientes reales",url:"Blogs/como-recibir-clientes.html",description:"Ideas para comenzar a conectar con clientes reales dentro de una comunidad.",keywords:"clientes ventas comunidad negocio"}
 ].filter(i=>matches([i.title,i.description,i.keywords])).map(i=>({kind:"Contenido",icon:"fa-newspaper",title:i.title,description:i.description,url:i.url}));
 if(state.type==="NEGOCIOS")return business;
 if(state.type==="OPORTUNIDADES")return opportunities;
 if(state.type==="CONTENIDO")return content;
 return [...business,...opportunities,...content];
}

function render(){
 const resultsEl=document.getElementById("homeSearchResults");
 const status=document.getElementById("homeSearchStatus");
 if(!resultsEl||!status)return;
 const items=results().slice(0,6);
 if(!state.term){status.textContent="Busca un negocio, servicio, oportunidad o contenido.";resultsEl.innerHTML="";return}
 status.textContent=items.length?items.length+" resultado"+(items.length===1?"":"s")+" encontrados":"No encontramos resultados.";
 resultsEl.innerHTML=items.length?items.map(r=>'<a class="home-search-result" href="'+escapeHtml(r.url)+'"><span class="home-search-result-icon"><i class="fa-solid '+escapeHtml(r.icon)+'"></i></span><span class="home-search-result-content"><span class="home-search-result-type">'+escapeHtml(r.kind)+'</span><h3>'+escapeHtml(r.title)+'</h3><p>'+escapeHtml(r.description)+'</p></span></a>').join(""):'<div class="home-search-empty">Prueba con otro término o cambia el tipo de resultado.</div>';
 document.getElementById("homeSearchAll").hidden=!state.term;
}

async function loadSources(){
 if(!AuthSession.isInitialized())await AuthSession.initialize();
 state.authenticated=AuthSession.isAuthenticated();
 const b=await BusinessService.getPublicBusinessDirectory();
 state.businesses=b.error?[]:(b.data||[]);
 if(state.authenticated){
  const p=await CommunityService.getPublications({limit:60});
  state.publications=p.error?[]:(p.data||[]);
 }
}

function openModal(){
 const modal=document.getElementById("homeSearchModal");
 if(!modal)return;
 modal.classList.add("is-open");modal.setAttribute("aria-hidden","false");
 document.body.classList.add("home-search-open");
 setTimeout(()=>document.getElementById("homeSearchInput")?.focus(),30);
}
function closeModal(){
 const modal=document.getElementById("homeSearchModal");
 if(!modal)return;
 modal.classList.remove("is-open");modal.setAttribute("aria-hidden","true");
 document.body.classList.remove("home-search-open");
}
function bind(){
 document.getElementById("homeSearchTrigger")?.addEventListener("click",openModal);
 document.getElementById("homeSearchClose")?.addEventListener("click",closeModal);
 document.getElementById("homeSearchModal")?.addEventListener("click",e=>{if(e.target.id==="homeSearchModal")closeModal()});
 document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
 const input=document.getElementById("homeSearchInput");
 input?.addEventListener("input",()=>{state.term=input.value.trim();document.getElementById("homeSearchClear").hidden=!state.term;render()});
 document.getElementById("homeSearchClear")?.addEventListener("click",()=>{input.value="";state.term="";document.getElementById("homeSearchClear").hidden=true;render();input.focus()});
 document.querySelectorAll(".home-search-tab").forEach(tab=>tab.addEventListener("click",()=>{state.type=tab.dataset.searchType||"TODOS";document.querySelectorAll(".home-search-tab").forEach(t=>t.classList.toggle("active",t===tab));render()}));
}
async function init(){bind();await loadSources();render()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();