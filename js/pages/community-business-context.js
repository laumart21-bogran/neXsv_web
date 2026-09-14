import BusinessService from "../services/business.service.js";
import CommunityService from "../services/community.service.js";
import AuthSession from "../auth/auth.session.js";

/* Contexto ligero: Comunidad reutiliza el mismo compositor, pero puede publicar para el negocio seleccionado. */
document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("publicationForm");
    const typeOptions = document.getElementById("typeOptions");
    if (!form || !typeOptions) return;

    if (!AuthSession.isInitialized()) await AuthSession.initialize();
    if (!AuthSession.isAuthenticated()) return;
    const user = AuthSession.getCurrentUser();
    const { data: businesses, error } = await BusinessService.getBusinessesByOwner(user.id);
    if (error || !businesses?.length) return;

    const row = document.createElement("div");
    row.className = "community-business-context";
    row.innerHTML = `<label for="communityBusinessSelector"><i class="fa-solid fa-store"></i> Publicar como</label><select id="communityBusinessSelector"><option value="">Publicación personal</option>${businesses.map(b => `<option value="${escapeAttr(b.id)}">${escapeHtml(b.nombre || "Mi negocio")}</option>`).join("")}</select>`;
    typeOptions.insertAdjacentElement("afterend", row);

    const selector = document.getElementById("communityBusinessSelector");
    const stored = sessionStorage.getItem("nexsv_selected_business_id");
    if (stored && businesses.some(b => b.id === stored)) selector.value = stored;
    selector.addEventListener("change", () => {
        if (selector.value) sessionStorage.setItem("nexsv_selected_business_id", selector.value);
    });

    const originalCreatePublication = CommunityService.createPublication.bind(CommunityService);
    CommunityService.createPublication = (payload = {}) => originalCreatePublication({ ...payload, businessId: selector.value || null });
});

function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function escapeAttr(value) { return escapeHtml(value); }
