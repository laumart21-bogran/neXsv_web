import CommunityService from "../services/community.service.js";

let selectedFiles = [];

function renderPreview(){
    const count=document.getElementById("dashboardPhotoCount");
    const preview=document.getElementById("dashboardPhotoPreview");
    if(count)count.textContent=selectedFiles.length?`${selectedFiles.length} foto${selectedFiles.length===1?"":"s"} seleccionada${selectedFiles.length===1?"":"s"}`:"Ninguna foto seleccionada";
    if(!preview)return;
    preview.innerHTML="";
    selectedFiles.forEach((file,index)=>{const url=URL.createObjectURL(file),item=document.createElement("div");item.className="dashboard-photo-item";item.innerHTML=`<img src="${url}" alt="Vista previa"><button type="button" aria-label="Quitar foto"><i class="fa-solid fa-xmark"></i></button>`;item.querySelector("button").addEventListener("click",()=>{selectedFiles.splice(index,1);URL.revokeObjectURL(url);renderPreview();});preview.appendChild(item);});
}

function installPhotoComposer(){
    const input=document.getElementById("dashboardPublicationImages");
    const addButton=document.getElementById("dashboardAddPhotosBtn");
    const publishButton=document.getElementById("dashboardPublishBtn");
    if(!input||!addButton||!publishButton)return;
    addButton.addEventListener("click",()=>input.click());
    input.addEventListener("change",()=>{const incoming=Array.from(input.files||[]);const result=CommunityService.validateImages([...selectedFiles,...incoming]);if(!result.valid){const message=document.getElementById("dashboardPublicationMessage");if(message)message.textContent=result.error;input.value="";return;}selectedFiles=result.files;input.value="";renderPreview();});
    publishButton.addEventListener("click",async event=>{
        event.preventDefault();event.stopImmediatePropagation();
        const bodyInput=document.getElementById("dashboardPublicationBody"),titleInput=document.getElementById("dashboardPublicationTitle"),message=document.getElementById("dashboardPublicationMessage");
        const body=bodyInput?.value.trim()||"";
        if(!body){if(message)message.textContent="Escribe algo antes de publicar.";return;}
        const validation=CommunityService.validateImages(selectedFiles);if(!validation.valid){if(message)message.textContent=validation.error;return;}
        publishButton.disabled=true;publishButton.textContent="Publicando...";
        const type=document.querySelector("[data-compose-type].active")?.dataset.composeType||"VENTA";
        const {data:publication,error}=await CommunityService.createPublication({type,title:titleInput?.value.trim()||"",body});
        if(error){publishButton.disabled=false;publishButton.textContent="Publicar";if(message)message.textContent=error.message||"No fue posible publicar.";return;}
        if(selectedFiles.length){const imageResult=await CommunityService.uploadPublicationImages(publication.id,selectedFiles);if(imageResult.error){await CommunityService.deletePublication(publication.id);publishButton.disabled=false;publishButton.textContent="Publicar";if(message)message.textContent=`No se pudo guardar la publicación con sus fotos. ${imageResult.error.message||"Inténtalo nuevamente."}`;return;}}
        selectedFiles=[];renderPreview();bodyInput.value="";if(titleInput)titleInput.value="";publishButton.disabled=false;publishButton.textContent="Publicar";if(message)message.textContent="¡Publicado!";setTimeout(()=>{if(message)message.textContent="";},2500);
    },true);
}

function installPublicationLinks(){
    const root=document.getElementById("communityHighlights");if(!root)return;
    const addLinks=()=>root.querySelectorAll(".dashboard-publication-card").forEach(card=>{if(card.querySelector(".dashboard-publication-link"))return;const copy=card.querySelector(".dashboard-publication-copy"),id=card.closest("[data-publication-id]")?.dataset.publicationId;if(!copy||!id)return;const link=document.createElement("a");link.className="dashboard-publication-link";link.href=`comunidad.html?publicacion=${encodeURIComponent(id)}`;link.innerHTML=`Ver publicación <i class="fa-solid fa-arrow-right"></i>`;copy.appendChild(link);});
    new MutationObserver(addLinks).observe(root,{childList:true,subtree:true});addLinks();
}

document.addEventListener("DOMContentLoaded",()=>{installPhotoComposer();installPublicationLinks();});
