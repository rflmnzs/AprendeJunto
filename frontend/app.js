const API_BASE_URL = "http://localhost:8080";
const THEME_STORAGE_KEY = "aprendejunto-theme";

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeMural();
    initializeStudyRoom();
});

function initializeTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const preferredTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(preferredTheme);

    document.querySelectorAll("#theme-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
            setTheme(nextTheme);
        });
    });
}

function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.querySelectorAll("#theme-toggle").forEach((button) => {
        const isDark = theme === "dark";
        button.textContent = isDark ? "☀" : "◐";
        button.setAttribute("aria-label", isDark ? "Ativar tema claro" : "Ativar tema escuro");
        button.title = isDark ? "Ativar tema claro" : "Ativar tema escuro";
    });
}

function initializeMural() {
    const questionsList = document.querySelector("#questions-list");
    const questionForm = document.querySelector("#question-form");
    if (!questionsList || !questionForm) return;

    loadQuestions();
    questionForm.addEventListener("submit", handleQuestionSubmit);
}

async function loadQuestions() {
    const questionsList = document.querySelector("#questions-list");
    try {
        const response = await fetch(`${API_BASE_URL}/api/duvidas/feed`);
        if (!response.ok) throw new Error("Não foi possível carregar o feed.");

        const questions = await response.json();
        renderQuestions(questions);
    } catch (error) {
        questionsList.innerHTML = "<p class=\"empty-state\">Não foi possível carregar as dúvidas. Verifique se o backend está ativo.</p>";
        console.error(error);
    }
}

function renderQuestions(questions) {
    const questionsList = document.querySelector("#questions-list");
    if (!questions.length) {
        questionsList.innerHTML = "<p class=\"empty-state\">Ainda não há dúvidas abertas.</p>";
        return;
    }

    questionsList.innerHTML = questions.map((question) => `
        <article class="question-item">
            <div>
                <h3>${escapeHtml(question.titulo)}</h3>
                <span class="question-subject">${escapeHtml(question.materia)}</span>
                ${question.descricao ? `<p class="question-description">${escapeHtml(question.descricao)}</p>` : ""}
            </div>
            <button class="primary-button accept-button" type="button" data-question-id="${question.id}">
                Aceitar e ensinar (+1 🪙)
            </button>
        </article>
    `).join("");

    questionsList.querySelectorAll(".accept-button").forEach((button) => {
        button.addEventListener("click", () => acceptQuestion(button.dataset.questionId));
    });
}

async function handleQuestionSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.querySelector("#form-status");
    const submitButton = form.querySelector("button[type=submit]");
    const formData = new FormData(form);

    submitButton.disabled = true;
    status.className = "status-message";
    status.textContent = "Publicando dúvida...";

    try {
        const response = await fetch(`${API_BASE_URL}/api/duvidas?idAprendiz=1`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                titulo: formData.get("titulo"),
                materia: formData.get("materia"),
                descricao: formData.get("descricao")
            })
        });

        if (!response.ok) throw new Error("Não foi possível publicar a dúvida.");
        form.reset();
        status.textContent = "Dúvida publicada com sucesso.";
        await loadQuestions();
    } catch (error) {
        status.className = "status-message error";
        status.textContent = "Não foi possível publicar. Verifique o backend e o usuário mockado.";
        console.error(error);
    } finally {
        submitButton.disabled = false;
    }
}

async function acceptQuestion(questionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/duvidas/${questionId}/aceitar?idTutor=1`, {
            method: "POST"
        });
        if (!response.ok) throw new Error("Não foi possível aceitar a dúvida.");

        const session = await response.json();
        window.location.href = `sala.html?idSessao=${encodeURIComponent(session.id)}`;
    } catch (error) {
        alert("Não foi possível iniciar a sessão. Verifique se o backend está ativo.");
        console.error(error);
    }
}

function initializeStudyRoom() {
    const timerElement = document.querySelector("#session-timer");
    const endButton = document.querySelector("#end-session-button");
    if (!timerElement || !endButton) return;

    let remainingSeconds = 15 * 60;
    const timer = window.setInterval(() => {
        remainingSeconds -= 1;
        timerElement.textContent = formatTime(remainingSeconds);
        if (remainingSeconds <= 0) {
            window.clearInterval(timer);
            endButton.click();
        }
    }, 1000);

    endButton.addEventListener("click", async () => {
        window.clearInterval(timer);
        const sessionId = new URLSearchParams(window.location.search).get("idSessao") || "1";
        if (sessionId) {
            const stars = window.prompt("Quantas estrelas (1 a 5) dá para o seu colega?", "5");
            if (stars !== null) {
                const rating = Number(stars);
                if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                    window.alert("Digite um número inteiro entre 1 e 5.");
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/sessoes/${sessionId}/encerrar?estrelas=${rating}`, { method: "POST" });
                if (!response.ok) {
                    window.alert("Não foi possível encerrar a sessão. Verifique se o backend está ativo.");
                    return;
                }
            }
        }
        window.location.href = "index.html";
    });
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(Math.max(totalSeconds, 0) / 60);
    const seconds = Math.max(totalSeconds, 0) % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
