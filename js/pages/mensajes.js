import AuthSession from "../auth/auth.session.js";
import messagingService from "../services/messaging.service.js";
import ProfileService from "../services/profile.service.js";

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
let currentProfile = null;
let conversations = [];
let activeConversationId = null;
let activeChannel = null;
const profileCache = new Map();

function initializePlatformLogo() {
    document.querySelectorAll(".dashboard-logo, .messages-logo, .nex-logo, .logo-link").forEach(logo => {
        logo.setAttribute("href", "index.html");
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function profileName(profile, fallback = "Miembro neXsv") {
    return [profile?.nombre, profile?.apellido].filter(Boolean).join(" ").trim() || fallback;
}

function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("es-SV", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
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

function avatarMarkup(profile, className = "messages-avatar") {
    return `<div class="${className}">${profile?.photo
        ? `<img src="${escapeHtml(profile.photo)}" alt="Foto de perfil" loading="lazy">`
        : `<i class="fa-regular fa-user" aria-hidden="true"></i>`}</div>`;
}

function setAvatar(element, profile) {
    if (!element) return;
    element.innerHTML = profile?.photo
        ? `<img src="${escapeHtml(profile.photo)}" alt="Foto de perfil" loading="lazy">`
        : `<i class="fa-regular fa-user" aria-hidden="true"></i>`;
}

async function getOtherParticipant(conversationId) {
    const result = await messagingService.getOtherParticipant(conversationId, currentUser.id);
    return result.data?.[0]?.user_id || null;
}

async function getProfile(userId) {
    if (!userId) return { name: "Miembro neXsv", photo: null };
    if (profileCache.has(userId)) return profileCache.get(userId);

    const { data, error } = await ProfileService.getPublicProfile(userId);
    if (error || !data) {
        if (error) console.error("Error cargando perfil público:", error);
        return { name: "Miembro neXsv", photo: null };
    }

    const profile = {
        name: profileName(data),
        photo: data.foto || null
    };
    profileCache.set(userId, profile);
    return profile;
}

async function getLastMessage(conversationId) {
    const { data, error } = await messagingService.getMessages(conversationId);
    if (error || !data?.length) return null;
    return data[data.length - 1];
}

async function enrichConversations(rows) {
    return Promise.all((rows || []).map(async row => {
        const conversation = row.conversations || {};
        const otherUserId = await getOtherParticipant(conversation.id);
        const profile = await getProfile(otherUserId);
        const lastMessage = await getLastMessage(conversation.id);
        const lastRead = row.last_read_at ? new Date(row.last_read_at).getTime() : 0;
        const hasUnread = Boolean(
            lastMessage &&
            String(lastMessage.sender_id) !== String(currentUser.id) &&
            new Date(lastMessage.created_at).getTime() > lastRead
        );

        return {
            ...row,
            conversation,
            otherUserId,
            profile,
            name: profile.name,
            lastMessage,
            hasUnread,
            sortDate: new Date(
                lastMessage?.created_at || conversation.updated_at || conversation.created_at || 0
            ).getTime()
        };
    }));
}

function renderConversationList(items = conversations) {
    if (!items.length) {
        conversationList.innerHTML = `
            <div class="messages-empty-list">
                <i class="fa-regular fa-comments"></i>
                <strong>Aún no tienes conversaciones</strong>
                <span>Cuando alguien contacte contigo desde la comunidad, aparecerá aquí.</span>
            </div>`;
        conversationCount.textContent = "0";
        return;
    }

    conversationCount.textContent = String(items.length);
    conversationList.innerHTML = items.map(item => `
        <button class="conversation-item ${item.conversation.id === activeConversationId ? "active" : ""} ${item.hasUnread ? "unread" : ""}"
                type="button" data-conversation-id="${escapeHtml(item.conversation.id)}">
            ${avatarMarkup(item.profile)}
            <div class="conversation-meta">
                <div class="conversation-name-row">
                    <span class="conversation-name">${escapeHtml(item.name)}</span>
                    <span class="conversation-time">${escapeHtml(formatConversationTime(item.lastMessage?.created_at || item.conversation.updated_at))}</span>
                </div>
                <div class="conversation-preview">${escapeHtml(item.lastMessage?.body || "Nueva conversación")}</div>
            </div>
            ${item.hasUnread ? '<span class="unread-dot" aria-label="Mensaje no leído"></span>' : ""}
        </button>`).join("");

    conversationList.querySelectorAll("[data-conversation-id]").forEach(button => {
        button.addEventListener("click", () => openConversation(button.dataset.conversationId));
    });
}

async function loadConversations() {
    const result = await messagingService.getMyConversations();
    if (result.error) {
        console.error("Error cargando conversaciones:", result.error);
        return;
    }
    conversations = await enrichConversations(result.data);
    conversations.sort((a, b) => b.sortDate - a.sortDate);
    renderConversationList();
}

async function renderMessages(messages = []) {
    if (!messages.length) {
        messageList.innerHTML = `<div class="message-system-empty">Inicia la conversación con un mensaje.</div>`;
        return;
    }

    const senderIds = [...new Set(messages.map(message => message.sender_id).filter(Boolean))];
    await Promise.all(senderIds.map(async id => {
        if (String(id) === String(currentUser.id)) {
            profileCache.set(id, currentProfile);
        } else {
            await getProfile(id);
        }
    }));

    messageList.innerHTML = messages.map(message => {
        const mine = String(message.sender_id) === String(currentUser.id);
        const sender = mine
            ? (currentProfile || { name: "Tú", photo: null })
            : (profileCache.get(message.sender_id) || { name: "Miembro neXsv", photo: null });
        const rowClass = mine ? "mine" : "received";

        return `<div class="message-row ${rowClass}" data-sender="${mine ? "self" : "other"}">
            <div class="message-group">
                <span class="message-sender">${escapeHtml(sender.name)}</span>
                <div class="message-bubble">${escapeHtml(message.body)}</div>
                <div class="message-time">${escapeHtml(formatDate(message.created_at))}</div>
            </div>
        </div>`;
    }).join("");

    messageList.scrollTop = messageList.scrollHeight;
}

async function loadMessages(conversationId) {
    const result = await messagingService.getMessages(conversationId);
    if (result.error) {
        messageList.innerHTML = `<div class="message-system-empty">No pudimos cargar los mensajes.</div>`;
        return;
    }
    await renderMessages(result.data);
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
    chatContext.textContent = item.conversation.origin_publication_id
        ? "Conversación desde una publicación"
        : "Conversación directa";

    renderConversationList();
    await loadMessages(conversationId);
    await messagingService.markConversationRead(conversationId);
    item.hasUnread = false;
    renderConversationList();

    activeChannel = await messagingService.subscribeToMessages(conversationId, async message => {
        if (String(message.sender_id) !== String(currentUser.id)) {
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
        alert(result.error.message || "No fue posible enviar el mensaje.");
        return;
    }

    messageInput.value = "";
    messageInput.style.height = "52px";
    await loadMessages(activeConversationId);
    await loadConversations();

    const refreshed = conversations.find(entry => entry.conversation.id === activeConversationId);
    if (refreshed) {
        refreshed.hasUnread = false;
        renderConversationList();
    }

    messageInput.focus();
});

messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = `${Math.min(messageInput.scrollHeight, 140)}px`;
});

conversationSearch.addEventListener("input", () => {
    const term = conversationSearch.value.trim().toLowerCase();
    renderConversationList(!term
        ? conversations
        : conversations.filter(item =>
            item.name.toLowerCase().includes(term) ||
            (item.lastMessage?.body || "").toLowerCase().includes(term)
        )
    );
});

function chatHeaderBackHandler() {
    if (!window.matchMedia("(max-width: 650px)").matches) return;
    document.querySelector(".chat-header")?.addEventListener("click", event => {
        if (event.target.closest(".chat-person-avatar, .chat-person-info")) return;
        chatPanel.classList.remove("mobile-open");
    });
}

async function initialize() {
    try {
        initializePlatformLogo();
        await AuthSession.initialize();
        currentUser = AuthSession.getCurrentUser();

        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }

        const { data: profileData } = await ProfileService.getProfile(currentUser.id);
        currentProfile = {
            name: profileName(profileData, currentUser.email || "Miembro"),
            photo: profileData?.foto || null
        };
        profileCache.set(currentUser.id, currentProfile);
        setAvatar(topAvatar, currentProfile);

        await loadConversations();

        const requestedConversation = new URLSearchParams(window.location.search).get("conversation");
        if (requestedConversation) await openConversation(requestedConversation);
    } catch (error) {
        console.error("Error inicializando mensajería:", error);
    }
}

window.addEventListener("beforeunload", () => {
    if (activeChannel) messagingService.unsubscribe(activeChannel);
});

chatHeaderBackHandler();
initialize();
