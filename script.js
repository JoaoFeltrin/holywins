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

// Link direto de WhatsApp usado no botão "Ingresso" da seção "Como vai funcionar".
// Formato: https://wa.me/55DDDNUMERO (55 = Brasil, sem espaços, traços ou o sinal "+").
const WHATSAPP_URL = "https://wa.me/5551991268885";

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

  const btnIngressoWhatsapp = document.getElementById("btnIngressoWhatsapp");
  if (btnIngressoWhatsapp) btnIngressoWhatsapp.setAttribute("href", WHATSAPP_URL);
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

/* ===================== SANTOS (dados + modal + carrossel) =====================
   Para adicionar/trocar um santo:
   1. Coloque a foto de rosto em assets/santos/{slug}.jpg
   2. Duplique um <article class="santo-card-novo"> em index.html com o novo
      data-santo (e data-santo-modal no botão)
   3. Adicione a entrada correspondente aqui embaixo, com a mesma chave (slug).
   IMPORTANTE: "fatoExtra" (mostrado só no modal, ao clicar em "Conheça sua
   história") deve trazer fatos DIFERENTES dos já escritos no card ("bioCard"),
   nunca repetir a mesma informação. */
const SANTOS = {
  "carlo-acutis": {
    nome: "São Carlo Acutis",
    foto: "assets/santos/carlo-acutis.jpg",
    fatoExtra: "Carlo tinha um cachorro chamado Skywalker e adorava video game, mas se limitava a uma hora por semana. Também ajudava moradores de rua de Milão com o próprio dinheiro. Seu corpo, exposto em Assis, é visto com o rosto e as mãos preservados, vestido de tênis e moletom, como ele gostava.",
    frase: "Não eu, mas Deus. — São Carlo Acutis",
  },
  "gema-galgani": {
    nome: "Santa Gema Galgani",
    foto: "assets/santos/gema-galgani.jpg",
    fatoExtra: "Gema recebia os estigmas (as chagas de Jesus) toda quinta-feira à noite, e eles desapareciam no sábado de manhã, coincidindo com o horário da Paixão de Cristo. Ela dizia conversar com seu anjo da guarda como se fosse um amigo de todo dia.",
    frase: "Jesus, eu quero te amar, e não posso te amar o quanto quero. Toma tu mesmo meu coração. — Santa Gema Galgani",
  },
  "domingo-savio": {
    nome: "São Domingos Sávio",
    foto: "assets/santos/domingo-savio.jpg",
    fatoExtra: "Domingos fundou entre os colegas a \"Companhia da Imaculada Conceição\", um grupo de amigos que se ajudavam a viver a fé no dia a dia — bem parecido com os grupos de jovens que existem nas paróquias hoje. Numa conversa famosa, Dom Bosco disse que ele parecia um bom tecido pra fazer uma túnica pro Senhor; Domingos respondeu na hora: \"Eu entro com o tecido, você faz o trabalho de alfaiate.\"",
    frase: "Antes morrer do que pecar. — São Domingos Sávio",
  },
  "teresinha": {
    nome: "Santa Teresinha do Menino Jesus",
    foto: "assets/santos/teresinha.jpg",
    fatoExtra: "Teresinha escreveu sua autobiografia, \"História de uma Alma\", por obediência às irmãs superioras — ela não pretendia publicar nada. O livro se tornou um dos textos espirituais mais lidos do mundo. Ela também é copadroeira das missões, mesmo nunca tendo saído do convento em vida.",
    frase: "Quero passar meu céu fazendo o bem na terra. — Santa Teresinha do Menino Jesus",
  },
  "padre-pio": {
    nome: "São Padre Pio",
    foto: "assets/santos/padre-pio.jpg",
    fatoExtra: "Diziam que Padre Pio tinha o dom da bilocação — relatos de pessoas que juravam tê-lo visto em dois lugares ao mesmo tempo. Ele também fundou o hospital \"Casa Alívio do Sofrimento\", que até hoje atende milhares de pacientes na Itália.",
    frase: "Reze, espere e não se preocupe. — São Padre Pio",
  },
  "jose-sanchez": {
    nome: "São José Sánchez del Río",
    foto: "assets/santos/jose-sanchez.jpg",
    fatoExtra: "Antes de ser executado, José pediu para escrever uma última carta para sua mãe, agradecendo por ela ter aceitado que ele fosse para a guerra defender a fé. No caminho até sua morte, ele ia gritando \"Viva Cristo Rei e a Virgem de Guadalupe!\" — e foi assim que morreu, aos 14 anos, em 1928.",
    frase: "Nos vemos no céu. Viva Cristo Rei! — São José Sánchez del Río",
  },
};

function iniciarSantos() {
  iniciarModalSantos();
  iniciarCarrosselSantos();
}

/* ---- Modal (fatos extras, sem repetir o que já está no card) ---- */
function iniciarModalSantos() {
  const modal = document.getElementById("modalSanto");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalFechar = document.getElementById("modalFechar");
  const modalFoto = document.getElementById("modalFoto");
  const modalNome = document.getElementById("modalNome");
  const modalExtra = document.getElementById("modalExtra");
  const modalFrase = document.getElementById("modalFrase");

  if (!modal) return;

  function abrirModal(chaveSanto) {
    const santo = SANTOS[chaveSanto];
    if (!santo) return;

    modalFoto.style.backgroundImage = `url('${santo.foto}')`;
    modalNome.textContent = santo.nome;
    modalExtra.textContent = santo.fatoExtra;
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

  document.querySelectorAll("[data-santo-modal]").forEach((btn) => {
    btn.addEventListener("click", () => abrirModal(btn.dataset.santoModal));
  });

  if (modalOverlay) modalOverlay.addEventListener("click", fecharModal);
  if (modalFechar) modalFechar.addEventListener("click", fecharModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-active")) fecharModal();
  });
}

/* ---- Carrossel (múltiplos cards visíveis, autoplay + setas + bolinhas) ---- */
function iniciarCarrosselSantos() {
  const track = document.getElementById("santosTrack");
  const viewport = track ? track.parentElement : null;
  const btnPrev = document.getElementById("santosPrev");
  const btnNext = document.getElementById("santosNext");
  const dotsContainer = document.getElementById("santosDots");
  if (!track || !viewport) return;

  const cards = Array.from(track.children);
  if (!cards.length) return;

  // Quantos cards ficam visíveis por vez, de acordo com o breakpoint do CSS
  // (1 no mobile, 2 no tablet ≥640px, 3 no desktop ≥960px)
  function cardsPorVez() {
    if (window.innerWidth >= 960) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  }

  let indice = 0;
  let autoplay;

  function totalPaginas() {
    return Math.max(1, cards.length - cardsPorVez() + 1);
  }

  function irPara(novoIndice) {
    const max = totalPaginas() - 1;
    indice = ((novoIndice % (max + 1)) + (max + 1)) % (max + 1);
    const larguraCard = cards[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).gap || "0");
    track.style.transform = `translateX(-${indice * (larguraCard + gap)}px)`;
    atualizarDots();
  }

  function atualizarDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = "";
    for (let i = 0; i < totalPaginas(); i++) {
      const dot = document.createElement("button");
      dot.className = "santos-carousel__dot" + (i === indice ? " is-active" : "");
      dot.setAttribute("aria-label", `Ir para o card ${i + 1}`);
      dot.addEventListener("click", () => {
        irPara(i);
        reiniciarAutoplay();
      });
      dotsContainer.appendChild(dot);
    }
  }

  function reiniciarAutoplay() {
    clearInterval(autoplay);
    autoplay = setInterval(() => irPara(indice + 1), 6000);
  }

  if (btnPrev) btnPrev.addEventListener("click", () => { irPara(indice - 1); reiniciarAutoplay(); });
  if (btnNext) btnNext.addEventListener("click", () => { irPara(indice + 1); reiniciarAutoplay(); });

  window.addEventListener("resize", () => irPara(indice));

  irPara(0);
  reiniciarAutoplay();
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
