/* =========================================================
   HOLYWINS 2026 — script.js
   JavaScript puro (sem dependências).
   ========================================================= */

/* =========================================================
   CONFIGURAÇÕES DO EVENTO
   Altere apenas os valores abaixo quando precisar atualizar
   data, links de inscrição, Instagram ou WhatsApp.
   ========================================================= */

// Data e hora do evento — 24/10/2026, 19h no horário de Brasília (UTC-3).
// Escrita como texto (ISO) com o "-03:00" fixo no fuso do Brasil, assim o
// contador sempre mira as 19h de Brasília, não importa o fuso do celular
// de quem está vendo o site. Pra mudar a data/hora, edite só os números
// abaixo (formato: AAAA-MM-DDTHH:MM:00-03:00).
const DATA_EVENTO = new Date("2026-10-24T19:00:00-03:00");

// Link do formulário oficial de inscrição (Google Forms)
const INSCRICAO_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeBp5Llt2RcZBQh6G-iR5L3ZyOCX4XeU-iCHoc5ZJL_yIFUcg/viewform";

// @ oficial da paróquia no Instagram
const INSTAGRAM_URL = "https://www.instagram.com/paroquia.saojorge?igsi=djhpMGd0a3Jkandk";

// TROQUE pelo link do grupo/contato oficial de WhatsApp
const WHATSAPP_URL = "https://wa.me/55SEUNUMEROAQUI";

// Tempo (em ms) que cada imagem do carrossel do hero fica em tela
const CARROSSEL_INTERVALO_MS = 7000;

// Link da planilha de respostas do Google Forms, publicada na web como CSV.
// Como gerar: na planilha vinculada ao formulário, vá em Arquivo > Compartilhar >
// Publicar na Web > selecione a aba de respostas > formato CSV > Publicar.
// Cole aqui o link gerado (termina em "output=csv"). Deixe em branco ("") para
// esconder o contador ao vivo.
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlpjqdeghce3QBVpE9qpaTMUnAY8tSkrdN-e4zqFcbP1ZgTTltGu7SA3WQ4HvRDFYK8WVSWCtOaZie/pub?output=csv";

/* ========================================================= */


document.addEventListener("DOMContentLoaded", () => {
  aplicarLinksConfiguraveis();
  iniciarContador();
  iniciarCarrossel();
  iniciarContadorPresenca();
  iniciarMenuMobile();
  iniciarFadeIn();
  iniciarSantos();
  iniciarCompartilhamento();
});

/* ===================== LINKS CONFIGURÁVEIS ===================== */
function aplicarLinksConfiguraveis() {
  const linksInscricao = [
    document.getElementById("btnInscricaoHero"),
    document.getElementById("btnInscricaoFinal"),
  ];
  linksInscricao.forEach((el) => {
    if (el) el.setAttribute("href", INSCRICAO_URL);
  });

  const linksInstagram = [
    document.getElementById("btnInstagram"),
    document.getElementById("footerInstagram"),
  ];
  linksInstagram.forEach((el) => {
    if (el) el.setAttribute("href", INSTAGRAM_URL);
  });

  const footerWhatsapp = document.getElementById("footerWhatsapp");
  if (footerWhatsapp) footerWhatsapp.setAttribute("href", WHATSAPP_URL);
}

/* ===================== CONTADOR REGRESSIVO ===================== */
function iniciarContador() {
  const elDias = document.getElementById("cd-dias");
  const elHoras = document.getElementById("cd-horas");
  const elMinutos = document.getElementById("cd-minutos");
  const elSegundos = document.getElementById("cd-segundos");

  if (!elDias || !elHoras || !elMinutos || !elSegundos) return;

  function atualizar() {
    const agora = new Date().getTime();
    const diferenca = DATA_EVENTO.getTime() - agora;

    if (diferenca <= 0) {
      elDias.textContent = "00";
      elHoras.textContent = "00";
      elMinutos.textContent = "00";
      elSegundos.textContent = "00";
      clearInterval(intervalo);
      return;
    }

    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

    elDias.textContent = String(dias).padStart(2, "0");
    elHoras.textContent = String(horas).padStart(2, "0");
    elMinutos.textContent = String(minutos).padStart(2, "0");
    elSegundos.textContent = String(segundos).padStart(2, "0");
  }

  atualizar();
  const intervalo = setInterval(atualizar, 1000);
}

/* ===================== CARROSSEL DO HERO ===================== */
function iniciarCarrossel() {
  const slides = document.querySelectorAll("#heroCarousel .hero__carousel-slide");
  if (slides.length < 2) return; // nada para alternar

  let indiceAtual = 0;

  setInterval(() => {
    slides[indiceAtual].classList.remove("is-active");
    indiceAtual = (indiceAtual + 1) % slides.length;
    slides[indiceAtual].classList.add("is-active");
  }, CARROSSEL_INTERVALO_MS);
}

/* ===================== CONTADOR AO VIVO (Google Forms) =====================
   Alimenta TODOS os elementos ".contador-presenca" da página (hoje: o selo
   no hero e o dashboard da seção "Você vem?"). Pra adicionar o contador em
   mais um lugar, basta repetir a mesma estrutura HTML com a classe
   "contador-presenca" e um filho ".contador-presenca__numero" dentro. */
function iniciarContadorPresenca() {
  const containers = document.querySelectorAll(".contador-presenca");
  if (!containers.length || !GOOGLE_SHEET_CSV_URL) return;

  fetch(GOOGLE_SHEET_CSV_URL, { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error("Falha ao buscar planilha");
      return res.text();
    })
    .then((csv) => {
      const total = contarRespostasCsv(csv);
      containers.forEach((container) => {
        const numeroEl = container.querySelector(".contador-presenca__numero");
        container.hidden = false;
        if (numeroEl) animarNumero(numeroEl, total);
      });
    })
    .catch(() => {
      // Se der erro (link não configurado, offline, etc.), os contadores
      // simplesmente continuam ocultos — não quebra o restante da página.
    });
}

// Conta quantas linhas do CSV têm a primeira coluna (carimbo de data/hora)
// preenchida — cada uma corresponde a uma resposta real do formulário.
function contarRespostasCsv(csv) {
  const linhas = csv.split(/\r?\n/);
  linhas.shift(); // remove o cabeçalho
  return linhas.filter((linha) => linha.split(",")[0].trim() !== "").length;
}

// Anima a contagem de 0 até o valor final
function animarNumero(elemento, valorFinal) {
  if (valorFinal <= 0) {
    elemento.textContent = "0";
    return;
  }
  const duracaoMs = 1200;
  const inicio = performance.now();

  function passo(agora) {
    const progresso = Math.min((agora - inicio) / duracaoMs, 1);
    elemento.textContent = Math.floor(progresso * valorFinal);
    if (progresso < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

/* ===================== MENU MOBILE ===================== */
function iniciarMenuMobile() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const aberto = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", aberto ? "true" : "false");
    document.body.style.overflow = aberto ? "hidden" : "";
  });

  // Fecha o menu ao clicar em qualquer link
  menu.querySelectorAll(".navbar__link").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });
}

/* ===================== FADE-IN AO ROLAR ===================== */
function iniciarFadeIn() {
  const elementos = document.querySelectorAll(".fade-in");
  if (!("IntersectionObserver" in window)) {
    elementos.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("is-visible");
          observer.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elementos.forEach((el) => observer.observe(el));
}

/* ===================== SANTOS (dados + modal) ===================== */
// Para adicionar/editar um santo, basta alterar este objeto.
const SANTOS = {
  "sao-jorge": {
    icone: "🐉",
    nome: "São Jorge",
    bio: "Soldado romano do século III, conhecido por sua coragem e fé inabalável mesmo diante da perseguição. Tornou-se símbolo de coragem contra o mal, representado vencendo o dragão.",
    frase: "Não há maior vitória do que vencer o mal com a fé.",
  },
  "sao-jose": {
    icone: "🔨",
    nome: "São José",
    bio: "Pai adotivo de Jesus e esposo de Maria, trabalhador humilde e homem justo. Modelo de silêncio, obediência e cuidado com a família.",
    frase: "A santidade se constrói no silêncio do dia a dia.",
  },
  "carlo-acutis": {
    icone: "💻",
    nome: "São Carlo Acutis",
    bio: "Jovem italiano apaixonado por tecnologia, usou seus talentos para evangelizar pela internet. Morreu aos 15 anos, em 2006, e é conhecido como o \"influencer de Deus\".",
    frase: "Não eu, mas Deus.",
  },
  "santa-teresinha": {
    icone: "🌹",
    nome: "Santa Teresinha",
    bio: "Carmelita francesa que viveu sua fé através de pequenos gestos de amor no cotidiano — o chamado \"Caminho da Infância Espiritual\".",
    frase: "Quero passar meu céu fazendo o bem na terra.",
  },
  "sao-francisco": {
    icone: "🕊️",
    nome: "São Francisco de Assis",
    bio: "Abandonou uma vida de riquezas para viver em pobreza e simplicidade, dedicando-se ao amor por Deus, pelos pobres e por toda a criação.",
    frase: "É dando que se recebe.",
  },
  "santa-clara": {
    icone: "✨",
    nome: "Santa Clara",
    bio: "Seguidora de São Francisco de Assis, fundou a ordem das Clarissas e viveu com radicalidade a pobreza e a oração, sendo hoje padroeira das comunicações.",
    frase: "Olha e considera, contempla e deseja imitar.",
  },
};

function iniciarSantos() {
  const modal = document.getElementById("modalSanto");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalFechar = document.getElementById("modalFechar");
  const modalIcone = document.getElementById("modalIcone");
  const modalNome = document.getElementById("modalNome");
  const modalBio = document.getElementById("modalBio");
  const modalFrase = document.getElementById("modalFrase");

  if (!modal) return;

  function abrirModal(chaveSanto) {
    const santo = SANTOS[chaveSanto];
    if (!santo) return;

    modalIcone.textContent = santo.icone;
    modalNome.textContent = santo.nome;
    modalBio.textContent = santo.bio;
    modalFrase.textContent = `"${santo.frase}"`;

    modal.classList.add("is-active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function fecharModal() {
    modal.classList.remove("is-active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".santo-card").forEach((card) => {
    card.addEventListener("click", () => abrirModal(card.dataset.santo));
  });

  const btnHistoriaSanto = document.getElementById("btnHistoriaSanto");
  if (btnHistoriaSanto) {
    btnHistoriaSanto.addEventListener("click", () => abrirModal("carlo-acutis"));
  }

  if (modalOverlay) modalOverlay.addEventListener("click", fecharModal);
  if (modalFechar) modalFechar.addEventListener("click", fecharModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-active")) fecharModal();
  });
}

/* ===================== COMPARTILHAMENTO ===================== */
function iniciarCompartilhamento() {
  const btnWhatsapp = document.getElementById("btnCompartilharWhatsapp");
  if (!btnWhatsapp) return;

  btnWhatsapp.addEventListener("click", () => {
    const urlAtual = window.location.href;
    const texto = encodeURIComponent(
      `🔥 HOLYWINS 2026 — A Santidade é pra HOJE!\n24 de Outubro, 19h, Paróquia São Jorge\nRua Herval, 93, Bairro Campina, São Leopoldo\nVem com a gente: ${urlAtual}`
    );
    window.open(`https://wa.me/?text=${texto}`, "_blank", "noopener");
  });
}
