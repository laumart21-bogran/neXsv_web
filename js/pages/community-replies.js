import CommunityService from "../services/community.service.js";

const publicationList = document.getElementById("publicationList");

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function initials(name = "Miembro") {
    return String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2)
        .map(part => part[0]?.toUpperCase()).join("") || "M";
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

function avatarHtml(profile, className = "comment-avatar") {
    return `<div class="${className}">${profile?.photo
        ? `<img src="${escapeHtml(profile.photo)}" alt="Foto de perfil" loading="lazy">`
        : `<span>${escapeHtml(initials(profile?.name))}</span>`}</div>`;
}

async function getAuthorProfile(userId) {
    return await CommunityService.getPublicAuthorProfile(userId);
}

async function renderCommentTree(list, comments) {
    const enriched = await Promise.all((comments || []).map(async comment => ({
        ...comment,
        author: await getAuthorProfile(comment.author_id)
    })));

    const roots = enriched.filter(comment => !comment.parent_id);
    const repliesByParent = new Map();

    enriched.filter(comment => comment.parent_id).forEach(reply => {
        if (!repliesByParent.has(reply.parent_id)) repliesByParent.set(reply.parent_id, []);
        repliesByParent.get(reply.parent_id).push(reply);
    });

    if (!roots.length) {
        list.innerHTML = `<div class="comments-empty">Aún no hay comentarios. Sé la primera persona en participar.</div>`;
        return;
    }

    const renderComment = (comment, isReply = false) => {
        const replies = repliesByParent.get(comment.id) || [];
        const replyButton = !isReply
            ? `<div class="comment-actions">
                <button type="button" class="comment-reply-btn" data-reply="${escapeHtml(comment.id)}">Responder</button>
            </div>
            <form class="comment-reply-form" data-reply-form="${escapeHtml(comment.id)}">
                <textarea maxlength="1000" rows="1" placeholder="Escribe una respuesta..." required></textarea>
                <button type="submit" class="comment-reply-send"><i class="fa-solid fa-paper-plane"></i> Responder</button>
            </form>`
            : `<div class="comment-actions"><span class="comment-reply-label">Respuesta</span></div>`;

        const repliesMarkup = replies.length
            ? `<div class="comment-replies">${replies.map(reply => renderComment(reply, true)).join("")}</div>`
            : "";

        return `<div class="comment-item" data-comment-id="${escapeHtml(comment.id)}">
            ${avatarHtml(comment.author, "comment-avatar")}
            <div class="comment-content">
                <div class="comment-author-row">
                    <strong>${escapeHtml(comment.author.name)}</strong>
                    <span>${escapeHtml(formatDate(comment.created_at))}</span>
                </div>
                <p>${escapeHtml(comment.body)}</p>
                ${replyButton}
            </div>
            ${repliesMarkup}
        </div>`;
    };

    list.innerHTML = roots.map(comment => renderComment(comment)).join("");
}

async function refreshCommentList(list) {
    if (!list || list.dataset.replyRendering === "1") return;
    const publicationId = list.dataset.commentsList;
    if (!publicationId) return;

    list.dataset.replyRendering = "1";
    const { data, error } = await CommunityService.getComments(publicationId);
    if (error) {
        console.error("Error cargando comentarios con respuestas:", error);
        list.dataset.replyRendering = "";
        return;
    }

    await renderCommentTree(list, data);
    list.dataset.replyRendering = "";
}

function updateCommentCount(publicationId) {
    const button = publicationList.querySelector(`[data-comments="${CSS.escape(publicationId)}"]`);
    if (!button) return;
    const match = button.textContent.trim().match(/\((\d+)\)/);
    const nextCount = match ? Number(match[1]) + 1 : 1;
    button.innerHTML = `<i class="fa-regular fa-comments"></i> Comentarios (${nextCount})`;
    button.classList.add("has-comments", "active");
}

async function handleReplySubmit(event) {
    const form = event.target.closest("[data-reply-form]");
    if (!form) return;
    event.preventDefault();

    const commentId = form.dataset.replyForm;
    const commentItem = form.closest(".comment-item");
    const publicationCard = form.closest(".publication-card");
    const publicationId = publicationCard?.dataset.publicationId;
    const textarea = form.querySelector("textarea");
    const button = form.querySelector("button[type='submit']");
    const body = textarea?.value.trim();
    if (!commentId || !publicationId || !body) return;

    button.disabled = true;
    button.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando...`;

    const { error } = await CommunityService.addComment(publicationId, body, commentId);
    if (error) {
        button.disabled = false;
        button.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Responder`;
        alert(error.message || "No fue posible publicar la respuesta.");
        return;
    }

    textarea.value = "";
    form.classList.remove("open");
    button.disabled = false;
    button.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Responder`;
    updateCommentCount(publicationId);

    const list = publicationCard.querySelector("[data-comments-list]");
    await refreshCommentList(list);
    commentItem?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function handleReplyClick(event) {
    const button = event.target.closest("[data-reply]");
    if (!button) return;
    const commentId = button.dataset.reply;
    const form = publicationList.querySelector(`[data-reply-form="${CSS.escape(commentId)}"]`);
    if (!form) return;
    const opening = !form.classList.contains("open");
    publicationList.querySelectorAll(".comment-reply-form.open").forEach(item => item.classList.remove("open"));
    form.classList.toggle("open", opening);
    if (opening) form.querySelector("textarea")?.focus();
}

function observeCommentLists() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (!mutation.addedNodes.length) return;
            const list = mutation.target.closest?.("[data-comments-list]") || mutation.target.querySelector?.("[data-comments-list]");
            if (list && list.dataset.replyRendering !== "1") refreshCommentList(list);
        });
    });

    observer.observe(publicationList, { childList: true, subtree: true });
}

publicationList?.addEventListener("click", handleReplyClick);
publicationList?.addEventListener("submit", handleReplySubmit);

if (publicationList) {
    observeCommentLists();
    document.querySelectorAll("[data-comments-list]").forEach(list => refreshCommentList(list));
}
