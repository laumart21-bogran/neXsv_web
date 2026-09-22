import AuthSession from "../auth/auth.session.js";
import BusinessService from "../services/business.service.js";

const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const loading = document.getElementById("invitationLoading");
const content = document.getElementById("invitationContent");
const errorBox = document.getElementById("invitationError");
const loggedOutActions = document.getElementById("loggedOutActions");
const loggedInActions = document.getElementById("loggedInActions");
const message = document.getElementById("invitationMessage");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function invitationUrl() {
  return "gestiona-tu-negocio.html?token=" + encodeURIComponent(token);
}
function showError() {
  loading.hidden = true; content.hidden = true; errorBox.hidden = false;
}
async function init() {
  if (!token) return showError();
  const result = await BusinessService.getBusinessManagementInvite(token);
  if (result.error || !result.data) return showError();
  const business = result.data;
  document.getElementById("invitedBusinessName").textContent = business.nombre || "Tu negocio";
  document.getElementById("invitedBusinessCategory").textContent = business.categoria || "Negocio";
  document.getElementById("invitedBusinessDescription").textContent = business.descripcion || "Tu presencia digital dentro de neXsv.";
  const logo = document.getElementById("invitedBusinessLogo");
  if (business.logo) logo.innerHTML = '<img src="' + escapeHtml(business.logo) + '" alt="Logo de ' + escapeHtml(business.nombre || "negocio") + '">';
  loading.hidden = true; content.hidden = false;
  const returnUrl = invitationUrl();
  document.getElementById("loginInviteLink").href = "acceso/login-usuario.html?return=" + encodeURIComponent(returnUrl);
  document.getElementById("registerInviteLink").href = "acceso/registro.html?return=" + encodeURIComponent(returnUrl);
  if (!AuthSession.isInitialized()) await AuthSession.initialize();
  if (AuthSession.isAuthenticated()) {
    loggedInActions.hidden = false;
    document.getElementById("acceptInviteBtn").addEventListener("click", acceptInvite);
  } else loggedOutActions.hidden = false;
}
async function acceptInvite() {
  const button = document.getElementById("acceptInviteBtn");
  button.disabled = true;
  button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Vinculando negocio...';
  message.textContent = "";
  const result = await BusinessService.acceptBusinessManagementInvite(token);
  if (result.error) {
    button.disabled = false;
    button.innerHTML = '<i class="fa-solid fa-store"></i> Comenzar a gestionar';
    message.textContent = "No pudimos vincular este negocio. Verifica que estés usando el correo al que llegó la invitación.";
    return;
  }
  message.textContent = "¡Listo! Tu negocio ya está vinculado a tu cuenta.";
  setTimeout(() => { window.location.href = "dashboard-negocio.html?business=" + encodeURIComponent(result.data.business_id); }, 700);
}
init();