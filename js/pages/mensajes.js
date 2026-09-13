import AuthSession from "../auth/auth.session.js";
import messagingService from "../services/messaging.service.js";
import { supabase } from "../core/supabase-client.js";

const conversationList = document.getElementById("conversationList");
const conversationCount = document.getElementById("conversationCount");
const conversationSearch = document.getElementById("conversationSearch");
const chatPanel = document.getElementById("chatPanel");
const chatEmpty = document.getElementById("chatEmpty");
const chatContent = document.getElementById("chatContent");
const chatName = document.getElementById("chatName");
const chatContext = document.getElementById("chatContext");
const chatAvatar = document.getElementById("chatAvatar");
const messageList = document.getElementById("messageList");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const topAvatar = document.getElementById("topAvatar");

let currentUser = null;
let conversations = [];
let activeConversationId = null;
let activeChannel = null;

function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function initials(name = "Miembro") {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    return parts.length ? parts.slice(0, 2).map(part => part[0].toUpperCase()).join("") : "M";
}

function avatarMarkup(profile, className = "messages-avatar") {
    const name = profile?.name || "Miembro neXsv";
    const photo = profile?.photo;
    return `<div class="${className}">${photo ? `<img src="${escapeHtml(photo)}" alt="Foto de perfil" loading="lazy">` : ""}<span>${escapeHtml(initials(name))}</span></div>`;
}

function setAvatar(element, profile) {
    if (!element) return;
    const name = profile?.name || "Miembro neXsv";
    const photo = profile?.photo;
    element.innerHTML = `${photo ? `<img src="${escapeHtml(photo)}" alt="Foto de perfil" loading="lazy">` : ""}<span>${escapeHtml(initials(name))}</span>`;
}

function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("es-SV", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatConversationTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    return date.toDateString() === now.toDateString()
        ? new Intl.DateTimeFormat("es-SV", { hour: "2-digit", minute: "2-digit" }).format(date)
        : new Intl.DateTimeFormat("es-SV", { day: "2-digit", month: "short" }).format(date);
}

async function getOtherParticipant(conversationId) {
    const { data, error } = await supabase.from("conversation_participants").select("user_id").eq("conversation_id", conversationId).neq("user_id", currentUser.id).limit(1);
    if (error || !data?.length) return null;
    return data[0].user_id;
}

async function getProfile(userId) {
    if (!userId) return { name: "Miembro neXsv", photo: null };
    const { data, error } = await supabase.from("profiles").select("nombre, apellido, foto").eq("auth_user_id", userId).maybeSingle();
    if (error || !data) return { name: "Miembro neXsv", photo: null };
    return { name: [data.nombre, data.apellido].filter(Boolean).join(" ").trim() || "Miembro neXsv", photo: data.foto || null };
}

async function getLastMessage(conversationId) {
    const { data, error } = await supabase.from("messages").select("body, created_at, sender_id").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(1);
    if (error || !data?.length) return null;
    return data[0];
}

async function enrichConversations(rows) {
    return Promise.all((rows || []).map(async row => {
        const conversation = row.conversations || {};
        const otherUserId = await getOtherParticipant(conversation.id);
        const profile = await getProfile(otherUserId);
        const lastMessage = await getLastMessage(conversation.id);
        const lastRead = row.last_read_at ? new Date(row.last_read_at).getTime() : 0;
        const hasUnread = Boolean(lastMessage && lastMessage.sender_id !== currentUser.id && new Date(lastMessage.created_at).getTime() > lastRead);
        return { ...row, conversation, otherUserId, profile, name: profile.name, lastMessage, hasUnread, sortDate: new Date(lastMessage?.created_at || conversation.updated_at || conversation.created_at || 0).getTime() };
    }));
}

function renderConversationList(items = conversations) {
    if (!items.length) {
        conversationList.innerHTML = `<div class="messages-empty-list"><i class="fa-regular fa-comments"></i><strong>Aún no tienes conversaciones</strong><span>Cuando alguien contacte contigo desde la comunidad, aparecerá aquí.</span></div>`;
        conversationCount.textContent = "0";
        return;
    }
    conversationCount.textContent = String(items.length);
    conversationList.innerHTML = items.map(item => {
        const preview = item.lastMessage?.body || "Nueva conversación";
        const isActive = item.conversation.id === activeConversationId;
        return `<button class="conversation-item ${isActive ? "active" : ""} ${item.hasUnread ? "unread" : ""}" type="button" data-conversation-id="${escapeHtml(item.conversation.id)}">${avatarMarkup(item.profile)}<div class="conversation-meta"><div class="conversation-name-row"><span class="conversation-name">${escapeHtml(item.name)}</span><span class="conversation-time">${escapeHtml(formatConversationTime(item.lastMessage?.created_at || item.conversation.updated_at))}</span></div><div class="conversation-preview">${escapeHtml(preview)}</div></div>${item.hasUnread ? '<span class="unread-dot" aria-label="Mensaje no leído"></span>' : ""}</button>`;
    }).join("");
    conversationList.querySelectorAll("[data-conversation-id]").forEach(button => button.addEventListener("click", () => openConversation(button.dataset.conversationId)));
}

async function loadConversations() {
    const result = await messagingService.getMyConversations();
    if (result.error) {
        console.error("Error cargando conversaciones:", result.error);
        conversationList.innerHTML = `<div class="messages-empty-list"><i class="fa-solid fa-triangle-exclamation"></i><strong>No pudimos cargar tus mensajes</strong><span>Intenta actualizar la página.</span></div>`;
        return;
    }
    conversations = await enrichConversations(result.data);
    conversations.sort((a, b) => b.sortDate - a.sortDate);
    renderConversationList();
}

function renderMessages(messages = []) {
    if (!messages.length) {
        messageList.innerHTML = `<div class="message-system-empty">Inicia la conversación con un mensaje.</div>`;
        return;
    }
    const other = conversations.find(item => item.conversation.id === activeConversationId)?.profile || { name: "Miembro neXsv", photo: null };
    messageList.innerHTML = messages.map(message => {
        const mine = message.sender_id === currentUser.id;
        const sender = mine ? { name: "Tú", photo: null } : other;
        return `<div class="message-row ${mine ? "mine" : "received"}"><div class="message-group"><span class="message-sender">${escapeHtml(sender.name)}</span><div class="message-bubble">${escapeHtml(message.body)}<div class="message-time">${escapeHtml(formatDate(message.created_at))}</div></div></div></div>`;
    }).join("");
    messageList.scrollTop = messageList.scrollHeight;
}

async function loadMessages(conversationId) {
    const result = await messagingService.getMessages(conversationId);
    if (result.error) {
        messageList.innerHTML = `<div class="message-system-empty">No pudimos cargar los mensajes.</div>`;
        console.error("Error cargando mensajes:", result.error);
        return;
    }
    renderMessages(result.data);
}

async function openConversation(conversationId) {
    const item = conversations.find(entry => entry.conversation.id === conversationId);
    if (!item) return;
    if (activeChannel) {
        await messagingService.unsubscribe(activeChannel);
        activeChannel = null;
    }
    activeConversationId = conversationId;
    chatEmpty.hidden = true;
    chatContent.hidden = false;
    chatPanel.classList.add("mobile-open");
    chatName.textContent = item.name;
    setAvatar(chatAvatar, item.profile);
    chatContext.textContent = item.conversation.origin_publication_id ? "Conversación desde una publicación" : "Conversación directa";
    renderConversationList();
    await loadMessages(conversationId);
    await messagingService.markConversationRead(conversationId);
    item.hasUnread = false;
    renderConversationList();
    activeChannel = await messagingService.subscribeToMessages(conversationId, async message => {
        if (message.sender_id !== currentUser.id) {
            await loadMessages(conversationId);
            await messagingService.markConversationRead(conversationId);
        }
    });
    messageInput.focus();
}

messageForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!activeConversationId) return;
    const text = messageInput.value.trim();
    if (!text) return;
    const button = messageForm.querySelector("button[type='submit']");
    button.disabled = true;
    const result = await messagingService.sendMessage(activeConversationId, text);
    button.disabled = false;
    if (result.error) {
        console.error("Error enviando mensaje:", result.error);
        alert(result.error.message || "No fue posible enviar el mensaje.");
        return;
    }
    messageInput.value = "";
    messageInput.style.height = "48px";
    await loadMessages(activeConversationId);
    await loadConversations();
    const refreshed = conversations.find(entry => entry.conversation.id === activeConversationId);
    if (refreshed) { refreshed.hasUnread = false; renderConversationList(); }
    messageInput.focus();
});

messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = `${Math.min(messageInput.scrollHeight, 140)}px`;
});

conversationSearch.addEventListener("input", () => {
    const term = conversationSearch.value.trim().toLowerCase();
    renderConversationList(!term ? conversations : conversations.filter(item => item.name.toLowerCase().includes(term) || (item.lastMessage?.body || "").toLowerCase().includes(term)));
});

function chatHeaderBackHandler() {
    if (!window.matchMedia("(max-width: 650px)").matches) return;
    const header = document.querySelector(".chat-header");
    header?.addEventListener("click", event => {
        if (event.target.closest(".chat-person-avatar, .chat-person-info")) return;
        chatPanel.classList.remove("mobile-open");
    });
}

async function initialize() {
    try {
        await AuthSession.initialize();
        currentUser = AuthSession.getCurrentUser();
        if (!currentUser) { window.location.href = "login.html"; return; }
        const currentProfile = await getProfile(currentUser.id);
        setAvatar(topAvatar, currentProfile);
        await loadConversations();
        const requestedConversation = new URLSearchParams(window.location.search).get("conversation");
        if (requestedConversation) await openConversation(requestedConversation);
    } catch (error) {
        console.error("Error inicializando mensajería:", error);
    }
}

window.addEventListener("beforeunload", () => { if (activeChannel) messagingService.unsubscribe(activeChannel); });
chatHeaderBackHandler();
initialize();
