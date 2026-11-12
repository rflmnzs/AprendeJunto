const API_BASE_URL = "http://localhost:8080";
const THEME_STORAGE_KEY = "aprendejunto-theme";
const demoQuestions = [
    { id: "demo-1", titulo: "Não entendi como calcular a força resultante", materia: "Física", descricao: "Travei na parte de somar as forças quando elas estão em sentidos diferentes.", autor: "Marina", iniciais: "MA", tempo: "há 4 min" },
    { id: "demo-2", titulo: "Como resolvo uma equação do 2º grau?", materia: "Matemática", descricao: "Alguém pode me explicar a fórmula de Bhaskara com um exemplo?", autor: "Rafael", iniciais: "RA", tempo: "há 12 min" },
    { id: "demo-3", titulo: "Balanceamento de equações químicas", materia: "Química", descricao: "Estou confuso sobre por onde começar a balancear essa reação.", autor: "Bia", iniciais: "BI", tempo: "há 25 min" }
];
let allQuestions = [];
let selectedSubject = "Todas";
let stopTranscription = () => {};

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeMural();
    initializeStudyRoom();
    initializeAiHint();
    initializeStudyTabs();
    initializeTranscription();
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
    const openRating = () => { stopTranscription(); if (!modal.open) modal.showModal(); };
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

function initializeStudyTabs() {
    const tabs = [...document.querySelectorAll(".study-tab")];
    if (!tabs.length) return;
    const activate = (selected) => {
        tabs.forEach((tab) => {
            const active = tab === selected;
            tab.setAttribute("aria-selected", String(active));
            tab.tabIndex = active ? 0 : -1;
            document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
        });
    };
    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activate(tab));
        tab.addEventListener("keydown", (event) => {
            let next;
            if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
            if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
            if (event.key === "Home") next = 0;
            if (event.key === "End") next = tabs.length - 1;
            if (next === undefined) return;
            event.preventDefault();
            activate(tabs[next]);
            tabs[next].focus();
        });
    });
    const materials = {
        newton: {
            title: "Física: Leis de Newton",
            concept: "A primeira lei descreve a inércia. A segunda relaciona força resultante, massa e aceleração: F = m · a. A terceira trata de forças de ação e reação, que atuam em corpos diferentes.",
            exercise: "Um carrinho de 2 kg recebe uma força resultante de 6 N. Qual é sua aceleração? Identifique os dados antes de calcular.",
            answer: "a = F / m = 6 / 2 = 3 m/s². A aceleração tem a direção e o sentido da força resultante."
        },
        equacoes: {
            title: "Matemática: Equações do 2º grau",
            concept: "Organize a equação como ax² + bx + c = 0, com a diferente de zero. Calcule Δ = b² − 4ac e então x = (−b ± √Δ) / (2a).",
            exercise: "Na equação x² − 5x + 6 = 0, identifique a, b e c. Quais valores de x tornam a igualdade verdadeira?",
            answer: "a = 1, b = −5 e c = 6. Δ = 25 − 24 = 1. As raízes são 2 e 3; substitua cada uma na equação para conferir."
        }
    };
    const modal = document.querySelector("#notebook-modal");
    document.querySelectorAll("[data-notebook]").forEach((button) => {
        button.addEventListener("click", () => {
            const material = materials[button.dataset.notebook];
            document.querySelector("#notebook-title").textContent = material.title;
            const content = document.querySelector("#notebook-content");
            content.replaceChildren();
            for (const [heading, text] of [["Relembre", material.concept], ["Tente você", material.exercise]]) {
                const title = document.createElement("h3");
                title.textContent = heading;
                const paragraph = document.createElement("p");
                paragraph.textContent = text;
                content.append(title, paragraph);
            }
            const details = document.createElement("details");
            const summary = document.createElement("summary");
            summary.textContent = "Conferir raciocínio";
            const answer = document.createElement("p");
            answer.textContent = material.answer;
            details.append(summary, answer);
            content.append(details);
            modal.showModal();
        });
    });
}

function initializeTranscription() {
    const button = document.querySelector("#transcript-toggle");
    const log = document.querySelector("#transcript-log");
    const interim = document.querySelector("#transcript-interim");
    const status = document.querySelector("#transcript-status");
    if (!button || !log || !interim || !status) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let demoTimer = null;
    let startTimer = null;
    let mode = "idle";
    let demoIndex = 0;
    const samples = [
        ["Lucas", "Entendi a fórmula."],
        ["Marina", "Vamos identificar os dados antes de calcular?"],
        ["Lucas", "Posso explicar o primeiro passo com minhas palavras?"],
        ["Marina", "Boa! Agora vamos conferir as unidades juntos."]
    ];
    const append = (author, text) => {
        if (!text.trim()) return;
        const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 60;
        document.querySelector("#transcript-empty")?.remove();
        const message = document.createElement("div");
        message.className = "transcript-message";
        const name = document.createElement("strong");
        name.textContent = author;
        const speech = document.createElement("p");
        speech.textContent = text;
        message.append(name, speech);
        log.append(message);
        while (log.children.length > 100) log.firstElementChild.remove();
        if (nearBottom) log.scrollTop = log.scrollHeight;
    };
    const stop = () => {
        mode = "idle";
        window.clearInterval(demoTimer);
        window.clearTimeout(startTimer);
        demoTimer = null;
        startTimer = null;
        if (recognition) {
            const previous = recognition;
            recognition = null;
            previous.onstart = previous.onresult = previous.onerror = previous.onend = null;
            try { previous.abort(); } catch { /* Already stopped. */ }
        }
        interim.textContent = "";
        button.textContent = "Ativar transcrição";
        status.textContent = "Transcrição pausada. Microfone desligado.";
    };
    const demo = (reason) => {
        stop();
        mode = "demo";
        status.textContent = reason + " Demonstração: falas fictícias a cada 5 segundos; microfone desligado.";
        button.textContent = "Pausar demonstração";
        demoTimer = window.setInterval(() => {
            const [author, text] = samples[demoIndex++ % samples.length];
            append(author + " · demonstração", text);
        }, 5000);
    };
    const start = () => {
        if (!SpeechRecognition) { demo("Reconhecimento de voz indisponível neste navegador."); return; }
        try {
            recognition = new SpeechRecognition();
            recognition.lang = "pt-BR";
            recognition.continuous = true;
            recognition.interimResults = true;
            mode = "starting";
            button.textContent = "Cancelar transcrição";
            status.textContent = "Aguardando permissão para usar o microfone…";
            recognition.onstart = () => {
                window.clearTimeout(startTimer);
                mode = "listening";
                status.textContent = "Ouvindo sua voz · português (Brasil).";
                button.textContent = "Pausar transcrição";
            };
            recognition.onresult = (event) => {
                if (mode !== "listening") return;
                let partial = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) append("Você", result[0].transcript);
                    else partial += result[0].transcript + " ";
                }
                interim.textContent = partial ? "Você (falando): " + partial.trim() : "";
            };
            recognition.onerror = (event) => {
                if (mode === "idle" || mode === "demo") return;
                if (event.error === "no-speech") { stop(); status.textContent = "Nenhuma fala detectada. Ative novamente quando quiser."; return; }
                demo("Não foi possível acessar o reconhecimento de voz.");
            };
            recognition.onend = () => {
                if (mode === "starting") demo("O reconhecimento de voz não iniciou.");
                else if (mode === "listening") { stop(); status.textContent = "Captura encerrada. Ative novamente para continuar."; }
            };
            startTimer = window.setTimeout(() => {
                if (mode === "starting") demo("Não recebemos acesso ao microfone.");
            }, 15000);
            recognition.start();
        } catch {
            demo("O reconhecimento de voz está indisponível.");
        }
    };
    button.addEventListener("click", () => { if (mode === "idle") start(); else stop(); });
    stopTranscription = stop;
    window.addEventListener("pagehide", stop);
    if (!SpeechRecognition) demo("Reconhecimento de voz indisponível neste navegador.");
}

function formatTime(totalSeconds) { const minutes = Math.floor(Math.max(totalSeconds, 0) / 60); const seconds = Math.max(totalSeconds, 0) % 60; return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`; }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
