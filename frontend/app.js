const API_BASE_URL = "http://localhost:8080";
const THEME_STORAGE_KEY = "aprendejunto-theme";
const demoQuestions = [
    { id: "demo-1", titulo: "Não entendi como calcular a força resultante", materia: "Física", descricao: "Travei na parte de somar as forças quando elas estão em sentidos diferentes.", autor: "Marina", iniciais: "MA", tempo: "há 4 min" },
    { id: "demo-2", titulo: "Como resolvo uma equação do 2º grau?", materia: "Matemática", descricao: "Alguém pode me explicar a fórmula de Bhaskara com um exemplo?", autor: "Rafael", iniciais: "RA", tempo: "há 12 min" },
    { id: "demo-3", titulo: "Balanceamento de equações químicas", materia: "Química", descricao: "Estou confuso sobre por onde começar a balancear essa reação.", autor: "Bia", iniciais: "BI", tempo: "há 25 min" }
];
let allQuestions = [];
let selectedSubject = "Todas";

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeMural();
    initializeStudyRoom();
    initializeAiHint();
});

function initializeTheme() {
    let savedTheme;
    try { savedTheme = localStorage.getItem(THEME_STORAGE_KEY); } catch { /* Private browsing may block storage. */ }
    const preferredTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(preferredTheme);
    document.querySelectorAll("#theme-toggle").forEach((button) => button.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark")));
}

function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* Theme still works without persistence. */ }
    document.querySelectorAll("#theme-toggle").forEach((button) => { const dark = theme === "dark"; button.textContent = dark ? "☀️" : "🌙"; button.setAttribute("aria-label", dark ? "Ativar tema claro" : "Ativar tema escuro"); });
}

function initializeMural() {
    const list = document.querySelector("#questions-list");
    const form = document.querySelector("#question-form");
    if (!list || !form) return;
    loadQuestions();
    form.addEventListener("submit", handleQuestionSubmit);
    document.querySelector("#focus-question")?.addEventListener("click", () => { document.querySelector("#question-title")?.focus(); document.querySelector("#new-question")?.scrollIntoView({ behavior: "smooth", block: "center" }); });
    document.querySelector("#question-search")?.addEventListener("input", applyQuestionFilters);
    document.querySelectorAll(".subject-tab").forEach((tab) => tab.addEventListener("click", () => { selectedSubject = tab.dataset.subject; document.querySelectorAll(".subject-tab").forEach((item) => { item.classList.toggle("active", item === tab); item.setAttribute("aria-pressed", String(item === tab)); }); applyQuestionFilters(); }));
}

async function loadQuestions() {
    try { const response = await fetch(`${API_BASE_URL}/api/duvidas/feed`); if (!response.ok) throw new Error("feed"); allQuestions = await response.json(); document.querySelector("#feed-status").textContent = ""; }
    catch (error) { allQuestions = demoQuestions; document.querySelector("#feed-status").textContent = "Estamos sem conexão no momento. Estas dúvidas são exemplos para você conhecer o mural."; console.info("Backend indisponível; exibindo dúvidas de demonstração.", error); }
    applyQuestionFilters();
}

function applyQuestionFilters() {
    const search = document.querySelector("#question-search")?.value.toLowerCase() || "";
    const filtered = allQuestions.filter((question) => (selectedSubject === "Todas" || question.materia === selectedSubject) && `${question.titulo} ${question.materia} ${question.descricao || ""}`.toLowerCase().includes(search));
    renderQuestions(filtered);
}

function renderQuestions(questions) {
    const list = document.querySelector("#questions-list");
    if (!questions.length) { list.innerHTML = "<p class=\"empty-state\">Nenhuma dúvida encontrada com esses filtros.</p>"; return; }
    list.innerHTML = questions.map((question) => `<article class="question-item"><div><span class="reward-badge">Recompensa: 1 a 2 🪙</span><h3>${escapeHtml(question.titulo)}</h3><p class="question-description">${escapeHtml(question.descricao || "Compartilhe uma ideia e ajude este colega a avançar.")}</p><div class="question-meta"><span class="question-subject">${escapeHtml(question.materia)}</span><span class="question-author"><span class="mini-avatar">${escapeHtml(question.iniciais || "AJ")}</span>${escapeHtml(question.autor || "Aluno da comunidade")} · ${escapeHtml(question.tempo || "agora")}</span></div></div><button class="primary-button accept-button" type="button" data-question-id="${escapeHtml(question.id)}">Ajudar <span>→</span></button></article>`).join("");
    list.querySelectorAll(".accept-button").forEach((button) => button.addEventListener("click", () => acceptQuestion(button.dataset.questionId)));
}

async function handleQuestionSubmit(event) {
    event.preventDefault(); const form = event.currentTarget; const status = document.querySelector("#form-status"); const submit = form.querySelector("button[type=submit]"); const data = new FormData(form);
    submit.disabled = true; status.className = "status-message"; status.textContent = "Publicando sua dúvida...";
    try { const response = await fetch(`${API_BASE_URL}/api/duvidas?idAprendiz=1`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo: data.get("titulo"), materia: data.get("materia"), descricao: data.get("descricao") }) }); if (!response.ok) throw new Error("post"); form.reset(); status.textContent = "Dúvida publicada! A comunidade já pode ajudar."; await loadQuestions(); }
    catch (error) { status.className = "status-message error"; status.textContent = "Não foi possível publicar. Verifique se o backend está ativo."; console.error(error); }
    finally { submit.disabled = false; }
}

async function acceptQuestion(questionId) {
    if (String(questionId).startsWith("demo-")) { alert("Ative o backend para iniciar uma sala com esta dúvida."); return; }
    try { const response = await fetch(`${API_BASE_URL}/api/duvidas/${questionId}/aceitar?idTutor=1`, { method: "POST" }); if (!response.ok) throw new Error("accept"); const session = await response.json(); window.location.href = `sala.html?idSessao=${encodeURIComponent(session.id)}`; }
    catch (error) { alert("Não foi possível iniciar a sessão. Verifique se o backend está ativo."); console.error(error); }
}

function initializeStudyRoom() {
    const timerElement = document.querySelector("#session-timer");
    const endButton = document.querySelector("#end-session-button");
    const modal = document.querySelector("#rating-modal");
    if (!timerElement || !endButton || !modal) return;

    const deadline = Date.now() + 15 * 60 * 1000;
    const openRating = () => { if (!modal.open) modal.showModal(); };
    const timer = window.setInterval(() => {
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        timerElement.textContent = formatTime(remaining);
        if (remaining === 0) {
            window.clearInterval(timer);
            document.querySelector("#rating-status").textContent = "Os 15 minutos terminaram. Conte como foi sua experiência.";
            openRating();
        }
    }, 1000);
    endButton.addEventListener("click", openRating);
    document.querySelector("#close-rating").addEventListener("click", () => modal.close());
    document.querySelector("#rating-form").addEventListener("change", (event) => {
        const rating = Number(new FormData(event.currentTarget).get("estrelas"));
        document.querySelector("#rating-preview").textContent = rating === 5
            ? "Bônus de excelência! 1 moeda pela ajuda + 1 de bônus = 2 moedas para o tutor."
            : "O tutor recebe 1 moeda pela ajuda. Obrigado por avaliar com carinho!";
        event.currentTarget.querySelectorAll(".rating-stars label").forEach((label) => {
            label.classList.toggle("is-selected", Number(label.querySelector("input").value) <= rating);
        });
    });
    document.querySelector("#rating-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const rating = Number(new FormData(form).get("estrelas"));
        const status = document.querySelector("#rating-status");
        const submit = form.querySelector("button[type=submit]");
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
        const sessionId = new URLSearchParams(window.location.search).get("idSessao");
        submit.disabled = true;
        status.textContent = "Enviando sua avaliação…";
        try {
            if (sessionId) {
                const response = await fetch(`${API_BASE_URL}/api/sessoes/${encodeURIComponent(sessionId)}/encerrar?estrelas=${rating}`, { method: "POST" });
                if (!response.ok) throw new Error("end");
            }
            window.clearInterval(timer);
            window.location.href = "index.html";
        } catch (error) {
            status.textContent = "Não conseguimos enviar agora. Tente de novo em instantes.";
        } finally {
            submit.disabled = false;
        }
    });
}

// Local demonstration only: no AI request or student data leaves the browser.
function initializeAiHint() {
    const button = document.querySelector("#ai-hint-button");
    const panel = document.querySelector("#ai-hint-panel");
    const close = document.querySelector("#close-ai-hint");
    const status = document.querySelector("#ai-hint-status");
    if (!button || !panel || !close || !status) return;

    button.addEventListener("click", () => {
        panel.hidden = false;
        button.setAttribute("aria-expanded", "true");
        status.textContent = "Dica demonstrativa disponível: " + document.querySelector("#ai-hint-text").textContent;
        panel.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
            block: "nearest"
        });
    });
    close.addEventListener("click", () => {
        panel.hidden = true;
        button.setAttribute("aria-expanded", "false");
        status.textContent = "";
        button.focus();
    });
}

function formatTime(totalSeconds) { const minutes = Math.floor(Math.max(totalSeconds, 0) / 60); const seconds = Math.max(totalSeconds, 0) % 60; return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`; }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
