// Адаптивный видеофон: горизонтальный ролик на широком экране,
// вертикальный — на телефоне. Файлы лежат рядом с index.html.
(function setupResponsiveVideoBackground() {
  const video = document.getElementById("backgroundVideo");
  const source = document.getElementById("backgroundVideoSource");
  const layer = document.getElementById("videoBackground");
  if (!video || !source || !layer) return;

  const landscapeFile = "background-landscape.mp4"; // 16:9
  const portraitFile = "background-portrait.mp4";   // 9:16
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const portraitScreen = window.matchMedia("(max-aspect-ratio: 3/4)");
  let currentFile = "";

  function selectVideo() {
    if (reducedMotion.matches) {
      video.pause();
      video.removeAttribute("src");
      source.removeAttribute("src");
      video.load();
      layer.classList.add("video-disabled");
      currentFile = "";
      return;
    }
    const nextFile = portraitScreen.matches ? portraitFile : landscapeFile;
    layer.classList.remove("video-disabled");
    if (nextFile === currentFile) return;
    currentFile = nextFile;
    source.src = nextFile;
    video.load();
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {
      // Если браузер не разрешит autoplay, останется постер/резервный фон.
    });
  }

  video.addEventListener("error", () => layer.classList.add("video-disabled"));
  video.addEventListener("playing", () => layer.classList.remove("video-disabled"));
  if (portraitScreen.addEventListener) portraitScreen.addEventListener("change", selectVideo);
  else if (portraitScreen.addListener) portraitScreen.addListener(selectVideo);
  if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", selectVideo);
  else if (reducedMotion.addListener) reducedMotion.addListener(selectVideo);
  selectVideo();
})();

// НАСТРОЙКА TELEGRAM:
// 1) Впишите username вашего Telegram-бота без символа @ в BOT_USERNAME.
// 2) Если бота нет, можно вместо этого использовать ссылку на ваш Telegram username:
//    https://t.me/ВАШ_USERNAME?text=... — см. инструкцию рядом с сайтом.
// Важно: Telegram не отправляет сообщение автоматически. Девушка увидит текст и сама нажмёт «Отправить».
const BOT_USERNAME = ""; // Например: "my_date_invite_bot" — без @. Оставьте пустым, если бота пока нет.

const intro = document.getElementById("intro");
const planner = document.getElementById("planner");
const finalScreen = document.getElementById("final");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const backBtn = document.getElementById("backBtn");
const confirmBtn = document.getElementById("confirmBtn");
const sendBtn = document.getElementById("sendBtn");
const editBtn = document.getElementById("editBtn");
const dateInput = document.getElementById("dateInput");
const timeInput = document.getElementById("timeInput");
const noteInput = document.getElementById("noteInput");
const formError = document.getElementById("formError");
const summary = document.getElementById("summary");
const telegramHint = document.getElementById("telegramHint");
let selectedIdea = "";

const localToday = new Date();
const yyyy = localToday.getFullYear();
const mm = String(localToday.getMonth() + 1).padStart(2, "0");
const dd = String(localToday.getDate()).padStart(2, "0");
dateInput.min = `${yyyy}-${mm}-${dd}`;

const noMessages = [
  "Может, всё-таки подумаешь? 🥺",
  "Кнопка немного смущена 🙈",
  "А если кофе и хорошая компания? ☕",
  "Ладно, не тороплю 💗",
  "«Нет» — тоже нормальный ответ ❤️"
];
let noClicks = 0;

function showScreen(screen) {
  [intro, planner, finalScreen].forEach(el => el.classList.add("hidden"));
  screen.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function hearts(amount = 18) {
  const container = document.getElementById("floatingHearts");
  const symbols = ["♡", "♥", "✧", "💕"];
  for (let i = 0; i < amount; i++) {
    const heart = document.createElement("span");
    heart.className = "float-heart";
    heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${14 + Math.random() * 22}px`;
    heart.style.animationDuration = `${4 + Math.random() * 4}s`;
    heart.style.animationDelay = `${Math.random() * 1.2}s`;
    container.appendChild(heart);
    setTimeout(() => heart.remove(), 9000);
  }
}
yesBtn.addEventListener("click", () => { hearts(24); showScreen(planner); });
noBtn.addEventListener("click", () => {
  noClicks++;
  noBtn.textContent = noMessages[Math.min(noClicks - 1, noMessages.length - 1)];
  if (noClicks >= noMessages.length) {
    noBtn.textContent = "Нет, спасибо ❤️";
    noBtn.onclick = () => {
      intro.innerHTML = `
        <div class="hero-heart">💗</div>
        <p class="script">Спасибо, что честно ответила</p>
        <h2>Всё хорошо</h2>
        <p class="lead">Никакого давления — твоё решение важно. Если когда-нибудь захочешь, приглашение остаётся в силе 🌷</p>
        <button class="btn btn-back" id="restartBtn">Вернуться</button>`;
      document.getElementById("restartBtn").addEventListener("click", () => location.reload());
    };
  }
});
backBtn.addEventListener("click", () => showScreen(intro));
document.querySelectorAll(".date-option").forEach(button => {
  button.addEventListener("click", () => {
    selectedIdea = button.dataset.idea;
    document.querySelectorAll(".date-option").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  });
});
function readableDate(value) {
  if (!value) return "договоримся отдельно";
  const [y, m, d] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(y, m - 1, d));
}
function currentPlan() {
  return {
    idea: selectedIdea || "Пока не выбрано",
    date: readableDate(dateInput.value),
    time: timeInput.value || "договоримся отдельно",
    note: noteInput.value.trim()
  };
}
confirmBtn.addEventListener("click", () => {
  if (!selectedIdea) {
    formError.textContent = "Выбери, пожалуйста, что тебе больше нравится 💗";
    return;
  }
  if (!dateInput.value) {
    formError.textContent = "Выбери дату — или обсудим её лично 😊";
    dateInput.focus();
    return;
  }
  if (dateInput.value < dateInput.min) {
    formError.textContent = "Эта дата уже прошла. Выбери сегодняшнюю или будущую 🌷";
    return;
  }
  formError.textContent = "";
  const p = currentPlan();
  summary.innerHTML = `<div>💞 <strong>Наш вариант:</strong> ${escapeHtml(p.idea)}</div>
    <div>📅 <strong>Дата:</strong> ${escapeHtml(p.date)}</div>
    <div>🕰️ <strong>Время:</strong> ${escapeHtml(p.time)}</div>
    ${p.note ? `<div>💌 <strong>Примечание:</strong> ${escapeHtml(p.note)}</div>` : ""}`;
  showScreen(finalScreen);
  hearts(30);
});
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
sendBtn.addEventListener("click", () => {
  const p = currentPlan();
  const message = `Привет! 💗 Я посмотрела приглашение на свидание.\nМой ответ: ДА!\nИдея: ${p.idea}\nДата: ${p.date}\nВремя: ${p.time}${p.note ? `\nМой комментарий: ${p.note}` : ""}\n\nДавай уточним детали 😊`;
  if (BOT_USERNAME.trim()) {
    const username = BOT_USERNAME.trim().replace(/^@/, "");
    window.open(`https://t.me/${encodeURIComponent(username)}?start=${encodeURIComponent(message)}`, "_blank", "noopener");
    telegramHint.textContent = "Telegram открылся. Если бот настроен на приём сообщений, отправь ему сообщение. Для обычного бота параметр start передаёт только короткий код, поэтому лучше использовать личный чат ниже.";
    // Universal share fallback is more reliable for a prefilled message.
    window.location.href = `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(message)}`;
  } else {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(message)}`, "_blank", "noopener");
    telegramHint.textContent = "Откроется выбор чата в Telegram с подготовленным текстом. Выбери свой чат и нажми «Отправить».";
  }
});
editBtn.addEventListener("click", () => showScreen(planner));

// Нежные бабочки с прожилками на крыльях и падающие лепестки сирени
const butterflyLayer = document.getElementById("butterflyLayer");
const petalLayer = document.getElementById("petalLayer");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function addButterfly() {
  if (!butterflyLayer || reducedMotion) return;
  const wrap = document.createElement("div");
  wrap.className = "butterfly";
  const id = "g" + Math.random().toString(36).slice(2, 9);
  wrap.innerHTML = `<svg viewBox="0 0 100 82" role="presentation" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0ff"/><stop offset=".42" stop-color="#e9a7ed"/><stop offset="1" stop-color="#9e69d5"/></linearGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe9f7"/><stop offset=".5" stop-color="#d99be8"/><stop offset="1" stop-color="#a36dd2"/></linearGradient></defs>
    <g class="wing-left"><path d="M49 39 C39 15 18 2 8 15 C-1 28 12 49 39 52 C17 55 18 75 31 76 C43 76 49 57 50 44Z" fill="url(#${id}a)" stroke="#9d65ba" stroke-width="1.5"/>
    <g fill="none" stroke="#fff8ff" stroke-width="1.2" opacity=".85"><path d="M47 42 Q25 25 11 17 M43 47 Q24 44 13 32 M39 53 Q28 64 31 73 M31 34 Q25 20 20 15"/><path d="M24 20 Q16 23 15 29 M29 43 Q20 43 18 39"/></g><circle cx="20" cy="24" r="2" fill="#fff" opacity=".9"/></g>
    <g class="wing-right"><path d="M51 39 C61 15 82 2 92 15 C101 28 88 49 61 52 C83 55 82 75 69 76 C57 76 51 57 50 44Z" fill="url(#${id}b)" stroke="#9d65ba" stroke-width="1.5"/>
    <g fill="none" stroke="#fff8ff" stroke-width="1.2" opacity=".85"><path d="M53 42 Q75 25 89 17 M57 47 Q76 44 87 32 M61 53 Q72 64 69 73 M69 34 Q75 20 80 15"/><path d="M76 20 Q84 23 85 29 M71 43 Q80 43 82 39"/></g><circle cx="80" cy="24" r="2" fill="#fff" opacity=".9"/></g>
    <ellipse cx="50" cy="46" rx="3.1" ry="12" fill="#684477"/><path d="M49 36 Q42 25 38 29 M51 36 Q58 25 62 29" fill="none" stroke="#684477" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;
  wrap.style.left = `${8 + Math.random() * 82}%`;
  wrap.style.top = `${72 + Math.random() * 25}%`;
  wrap.style.setProperty("--duration", `${13 + Math.random() * 9}s`);
  wrap.style.animationDelay = `${Math.random() * 1.5}s`;
  wrap.style.transform = `scale(${0.7 + Math.random() * 0.55})`;
  butterflyLayer.appendChild(wrap);
  setTimeout(() => wrap.remove(), 25000);
}
function addPetal() {
  if (!petalLayer || reducedMotion) return;
  const petal = document.createElement("span");
  petal.className = "petal";
  petal.style.left = `${Math.random() * 100}%`;
  petal.style.animationDuration = `${8 + Math.random() * 8}s`;
  petal.style.animationDelay = `${Math.random() * 1.5}s`;
  petal.style.transform = `rotate(${Math.random() * 360}deg) scale(${.65 + Math.random() * .8})`;
  petalLayer.appendChild(petal);
  setTimeout(() => petal.remove(), 18000);
}
if (!reducedMotion) {
  for (let i = 0; i < 4; i++) setTimeout(addButterfly, i * 1100);
  for (let i = 0; i < 15; i++) setTimeout(addPetal, i * 350);
  setInterval(addButterfly, 6500);
  setInterval(addPetal, 650);
}

hearts(12);
