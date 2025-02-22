import { backendUrl } from "./backendUrl.template.js";

document.addEventListener("DOMContentLoaded", async function () {
  const user = JSON.parse(sessionStorage.getItem("user"));

  atualizarFraseDoDia();

  if (!user || !user.id) {
    console.error("Usuário não encontrado ou ID inválido.");
    window.location.href = "login.html";
    return;
  }

  async function carregarDados(dataInicio, dataFim) {
    try {
      const baseURL = `${backendUrl}/pontuacoes`;

      const atividadesData = await fetchData(
        `${baseURL}/kpi-entregas/${user.id}${gerarQueryString(
          dataInicio,
          dataFim
        )}`
      );
      const { atividadesTotais, atividadesFeitas, porcentagemFeitas } =
        processAtividadesData(atividadesData);
      updateAtividadesDisplay(porcentagemFeitas);

      const pontosSemanaData = await fetchData(
        `${baseURL}/kpi-semana/${user.id}${gerarQueryString(
          dataInicio,
          dataFim
        )}`
      );
      updatePontosSemanaDisplay(pontosSemanaData);

      const graficoLinhaData = await fetchData(
        `${baseURL}/${user.id}${gerarQueryString(dataInicio, dataFim)}`
      );
      const { labelsLinha, datasetsLinha } =
        processGraficoLinhaData(graficoLinhaData);
      renderLineChart(labelsLinha, datasetsLinha);

      const pontosData = await fetchData(
        `${baseURL}/pontos-mes/${user.id}${gerarQueryString(
          dataInicio,
          dataFim
        )}`
      );
      const { labelsBarra, datasetsBarra } =
        processGraficoBarraData(pontosData);
      renderBarChart(labelsBarra, datasetsBarra);

      const pontosPorCursoData = await fetchData(
        `${baseURL}/pontos-totais/${user.id}${gerarQueryString(
          dataInicio,
          dataFim
        )}`
      );

      await initMedalhaSelect(dataInicio, dataFim);

      const topCurso = getTopCurso(pontosPorCursoData);
      updateTopCursoDisplay(topCurso);

      const progressoAtualMetaEstudo = await fetchData(
        `${backendUrl}/meta-de-estudo/${user.id}`
      );
      if (progressoAtualMetaEstudo) {
        const progressoAtualMetaEstudo2 = getProgressoAtualMetaEstudo(
          progressoAtualMetaEstudo
        );
        atualizarElemento(progressoAtualMetaEstudo2);
      }

      carregarTabelaPontuacoes(user.id, dataInicio, dataFim);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }

  function gerarQueryString(dataInicio, dataFim) {
    let queryString = "";
    if (dataInicio && dataFim) {
      queryString = `?dataInicio=${dataInicio}&dataFim=${dataFim}`;
    }
    return queryString;
  }

  async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erro ao buscar dados de ${url}`);
    return response.json();
  }

  carregarDados();

  const applyFilterButton = document.getElementById("apply-filter");
  applyFilterButton.addEventListener("click", () => {
    const startDate = document.getElementById("data-inicio").value;
    const endDate = document.getElementById("data-fim").value;

    if (!startDate || !endDate) {
      alert("Por favor, preencha ambas as datas.");
      return;
    }

    carregarDados(startDate, endDate);
  });
  function processAtividadesData(data) {
    const totalAtividades = data.atividadesTotais;
    const atividadesFeitas = totalAtividades - data.atividadesNaoEntregues;
    const porcentagemFeitas = (
      (atividadesFeitas / totalAtividades) *
      100
    ).toFixed(2);
    return { totalAtividades, atividadesFeitas, porcentagemFeitas };
  }

  function updateAtividadesDisplay(porcentagemFeitas) {
    if (porcentagemFeitas == "NaN") {
      porcentagemFeitas = 0;
    }

    const atividadesChangeElement = document.getElementById(
      "atividades-entregues-change"
    );
    document.getElementById(
      "atividades-entregues"
    ).innerText = `${porcentagemFeitas}%`;

    if (porcentagemFeitas >= 50) {
      updateClass(atividadesChangeElement, "green", "red");
    } else {
      updateClass(atividadesChangeElement, "red", "green");
    }
  }

  function updatePontosSemanaDisplay(data) {
    const pontosSemanaElement = document.getElementById("pontos-semana");
    const semanaPassadaPontosElement = document.getElementById(
      "semana-passada-pontos"
    );
    const pontosSemanaChangeElement = document.getElementById(
      "pontos-semana-change"
    );

    const totalSemanaPassada = Object.values(data.semanaPassada).reduce(
      (acc, pontos) => acc + pontos,
      0
    );
    const totalSemanaAtual = Object.values(data.semanaAtual).reduce(
      (acc, pontos) => acc + pontos,
      0
    );
    const diferenca = totalSemanaAtual - totalSemanaPassada;

    pontosSemanaElement.innerText = `${totalSemanaAtual} pts`;
    semanaPassadaPontosElement.innerText = `${totalSemanaPassada} pts`;

    const diferencaImagem =
      diferenca >= 0 ? "/imgs/seta-verde.png" : "/imgs/seta-vermelha.png";

    pontosSemanaChangeElement.innerHTML = `
        <img src="${diferencaImagem}" alt="Seta"> 
        ${Math.abs(diferenca)} pts
    `;

    const setaElement = pontosSemanaChangeElement.querySelector("img");
    setaElement.style.width = "40px";

    if (diferenca < 0) {
      setaElement.style.transform = "rotate(180deg)";
    }
  }

  function processGraficoLinhaData(data) {
    const cursosGraficoLinha = {};

    for (const [cursoId, atividades] of Object.entries(data)) {
      if (!cursosGraficoLinha[cursoId]) cursosGraficoLinha[cursoId] = {};

      atividades.forEach((atividade) => {
        const dateObj = new Date(atividade.dataEntrega);
        const date = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${dateObj.getDate().toString().padStart(2, "0")}`;

        if (!cursosGraficoLinha[cursoId][date]) {
          cursosGraficoLinha[cursoId][date] = 0;
        }
        cursosGraficoLinha[cursoId][date] += atividade.pontosAtividade;
      });
    }

    const allDates = new Set();
    Object.values(cursosGraficoLinha).forEach((cursoData) => {
      Object.keys(cursoData).forEach((date) => allDates.add(date));
    });
    const sortedDates = Array.from(allDates).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    const datasetsLinha = Object.keys(cursosGraficoLinha).map((cursoId) => {
      const cursoNome = data[cursoId]?.[0]?.cursoNome || `Curso ${cursoId}`;
      const corGrafico = getRandomColor();
      return {
        label: cursoNome,
        data: sortedDates.map((date) => cursosGraficoLinha[cursoId][date] || 0),
        fill: false,
        borderColor: corGrafico,
        backgroundColor: corGrafico,
      };
    });

    return { labelsLinha: sortedDates, datasetsLinha };
  }

  function processGraficoBarraData(data) {
    const cursosGraficoBarra = {};
    const meses = new Set();

    for (const [cursoKey, pontosPorMes] of Object.entries(data)) {
      const match = cursoKey.match(/\((\d+),\s(.+)\)/);
      if (!match) {
        console.error(`Formato inesperado da chave do curso: ${cursoKey}`);
        continue;
      }

      const cursoId = match[1];
      const cursoNome = match[2];

      if (!cursosGraficoBarra[cursoId])
        cursosGraficoBarra[cursoId] = { nome: cursoNome, pontos: {} };

      for (const [mes, pontos] of Object.entries(pontosPorMes)) {
        meses.add(mes);
        if (!cursosGraficoBarra[cursoId].pontos[mes])
          cursosGraficoBarra[cursoId].pontos[mes] = 0;
        cursosGraficoBarra[cursoId].pontos[mes] += pontos;
      }
    }

    const sortedMonths = Array.from(meses).sort(
      (a, b) => new Date(a + "-01") - new Date(b + "-01")
    );

    const datasetsBarra = Object.keys(cursosGraficoBarra).map((cursoId) => {
      const cursoNome = cursosGraficoBarra[cursoId].nome;
      const corGrafico = getRandomColorBarras();
      return {
        label: cursoNome,
        data: sortedMonths.map(
          (mes) => cursosGraficoBarra[cursoId].pontos[mes] || 0
        ),
        backgroundColor: corGrafico,
        borderColor: corGrafico,
        borderWidth: 1,
      };
    });

    return { labelsBarra: sortedMonths, datasetsBarra };
  }

  let lineChartInstance = null;

  function renderLineChart(labels, datasets) {
    const ctx = document.getElementById("pontosLinhaChart").getContext("2d");

    if (lineChartInstance) {
      lineChartInstance.destroy();
    }

    lineChartInstance = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        scales: {
          x: { beginAtZero: true },
          y: { beginAtZero: true },
        },
      },
    });
  }

  function renderBarChart(labels, datasets) {
    const ctx = document.getElementById("pontosBarraChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        scales: {
          x: { beginAtZero: true },
          y: { beginAtZero: true },
        },
      },
    });
  }

  async function initMedalhaSelect(dataInicio, dataFim) {
    try {
      const queryString = gerarQueryString(dataInicio, dataFim);
      const response = await fetch(
        `${backendUrl}/pontuacoes/pontos-totais/${user.id}${queryString}`
      );

      if (!response.ok) {
        throw new Error("Erro na resposta da API");
      }

      const data = await response.json();

      const courseSelect = document.getElementById("course-select");
      const medalhaCurso = document.getElementById("medalha-curso");

      courseSelect.innerHTML =
        '<option value="" disabled selected>Selecione um curso</option>';

      Object.keys(data)
        .filter((key) => data[key].pontosTotais > 0)
        .forEach((key) => {
          const option = document.createElement("option");
          option.value = key;
          option.textContent = data[key].nomeCurso;
          courseSelect.appendChild(option);
        });

      courseSelect.addEventListener("change", function () {
        const selectedCourseId = this.value;
        const selectedCourse = data[selectedCourseId];

        if (selectedCourse) {
          const points = selectedCourse.pontosTotais;
          let medalSrc = "../imgs/ouro_dash.png";

          if (points >= 300) {
            medalSrc = "../imgs/gold_medal.png";
          } else if (points >= 260) {
            medalSrc = "../imgs/silver_medal.png";
          } else if (points >= 100) {
            medalSrc = "../imgs/bronze_medal.png";
          }

          medalhaCurso.src = medalSrc;
        }
      });

      medalhaCurso.src = "../imgs/ouro_dash.png";
    } catch (error) {
      console.error("Erro ao buscar dados de pontos:", error);
    }
  }

  function getTopCurso(pontosPorCursoData) {
    let topCurso = null;
    let maxPontos = -1;

    for (const cursoId in pontosPorCursoData) {
      if (pontosPorCursoData[cursoId].pontosTotais > maxPontos) {
        maxPontos = pontosPorCursoData[cursoId].pontosTotais;
        topCurso = pontosPorCursoData[cursoId];
      }
    }

    return topCurso;
  }

  function updateTopCursoDisplay(topCurso) {
    const nomeCursoElem = document.getElementById("nomeCurso");
    const nivelElem = document.getElementById("nivel");
    const medalhaElem = document.getElementById("top-medalha");

    if (topCurso) {
      nomeCursoElem.textContent = topCurso.nomeCurso;
      nivelElem.innerHTML = `Nível: ${getMedalha(topCurso.pontosTotais)}`;
      medalhaElem.src = getMedalhaSrc(topCurso.pontosTotais);
    }
  }

  function updateClass(element, addClass, removeClass) {
    element.classList.add(addClass);
    if (removeClass) element.classList.remove(removeClass);
  }

  function getMedalha(pontosTotais) {
    if (pontosTotais >= 300) return '<span class="gold-text">Ouro</span>';
    if (pontosTotais >= 200) return '<span class="silver-text">Prata</span>';
    if (pontosTotais >= 100) return '<span class="bronze-text">Bronze</span>';
    return '<span class="no-medal">Nenhuma Medalha</span>';
  }

  function getMedalhaSrc(pontosTotais) {
    if (pontosTotais >= 300) return "../imgs/gold_medal.png";
    if (pontosTotais >= 200) return "../imgs/silver_medal.png";
    if (pontosTotais >= 100) return "../imgs/bronze_medal.png";
    return "../imgs/ouro_dash.png.png";
  }

  function getRandomColor() {
    return `rgba(${Math.floor(
      Math.random() * 255
    )}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)`;
  }

  function getRandomColorBarras() {
    return `rgba(${Math.floor(
      Math.random() * 255
    )}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)`;
  }

  async function fetchData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Erro ao buscar dados do back-end");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  function getProgressoAtualMetaEstudo(data) {
    if (
      data &&
      data.diasAtivos &&
      data.sessoes &&
      isValidProgressoDiario(data.diasAtivos, data.sessoes)
    ) {
      const horasTotalMeta = data.horasTotal;
      return calcularProgresso(data.diasAtivos, data.sessoes, horasTotalMeta);
    } else {
      console.error(
        "Estrutura de dados recebida é inválida ou está em um formato inesperado."
      );
      return null;
    }
  }

  function isValidProgressoDiario(diasAtivos, sessoes) {
    return (
      Array.isArray(diasAtivos) &&
      diasAtivos.every(
        (item) =>
          item.hasOwnProperty("nomeDia") &&
          item.hasOwnProperty("qtdTempoEstudo") &&
          typeof item.nomeDia === "string" &&
          !isNaN(parseFloat(item.qtdTempoEstudo))
      ) &&
      Array.isArray(sessoes) &&
      sessoes.every(
        (sessao) =>
          sessao.hasOwnProperty("diaSessao") &&
          sessao.hasOwnProperty("qtdTempoSessao") &&
          typeof sessao.diaSessao === "string" &&
          typeof sessao.qtdTempoSessao === "number"
      )
    );
  }

  function calcularProgresso(diasAtivos, sessoes, horasTotalMeta) {
    const diasAtivosAtualizados = diasAtivos.map((dia) => {
      const horasEstudadasNoDia = sessoes
        .filter((sessao) => sessao.diaSessao === dia.nomeDia)
        .reduce(
          (acumulador, sessao) => acumulador + sessao.qtdTempoSessao,
          parseFloat(dia.qtdTempoEstudo)
        );

      const metaAtingida = horasEstudadasNoDia >= horasTotalMeta;

      return {
        ...dia,
        metaAtingida,
      };
    });

    const horasCumpridasTotal =
      diasAtivosAtualizados.reduce(
        (acumulador, dia) => acumulador + parseFloat(dia.qtdTempoEstudo),
        0
      ) +
      sessoes.reduce(
        (acumulador, sessao) => acumulador + sessao.qtdTempoSessao,
        0
      );

    const progressoPercentual = (horasCumpridasTotal / horasTotalMeta) * 100;

    return {
      diasAtivos: diasAtivosAtualizados,
      horasCumpridasTotal,
      progressoPercentual: progressoPercentual.toFixed(2),
      horasTotalMeta,
    };
  }

  function atualizarElemento(progressoAtualMetaEstudo) {
    const horasNaSemana = document.getElementById("progress-meta-estudo");
    horasNaSemana.innerHTML = `${progressoAtualMetaEstudo.progressoPercentual}%`;

    const metaEstudoSemana = document.getElementById("meta-estudo-semana");
    metaEstudoSemana.innerHTML = `<strong>${progressoAtualMetaEstudo.horasCumpridasTotal}</strong> horas foram concluídas da meta atual definida.`;

    const progressoBarra = document.querySelector(".progress-bar");
    progressoBarra.style.width = `${progressoAtualMetaEstudo.progressoPercentual}%`;

    progressoBarra.classList.remove(
      "meta-atingida",
      "meta-nao-atingida",
      "meta-ultrapassada"
    );

    if (progressoAtualMetaEstudo.progressoPercentual < 100) {
      progressoBarra.classList.add("meta-nao-atingida");
    } else if (progressoAtualMetaEstudo.progressoPercentual === 100) {
      progressoBarra.classList.add("meta-atingida");
    } else {
      progressoBarra.classList.add("meta-ultrapassada");
    }

    const horasPorDia =
      progressoAtualMetaEstudo.horasTotalMeta /
      progressoAtualMetaEstudo.diasAtivos.length;
    const horas = Math.floor(horasPorDia);
    const minutos = Math.round((horasPorDia - horas) * 60);

    document.getElementById(
      "meta-estudo-diaria"
    ).innerHTML = `Sua meta de estudo é <strong>${horas}h e ${minutos}m</strong> por dia,<br> totalizando  <strong>${progressoAtualMetaEstudo.horasTotalMeta} horas</strong> por semana.`;
    atualizarDiasAtivos(progressoAtualMetaEstudo);
  }

  function atualizarDiasAtivos(progressoAtualMetaEstudo) {
    const dias = document.querySelectorAll(".day");

    dias.forEach((elementoDia) => {
      const nomeDia = elementoDia.getAttribute("data-dia");

      const diaAtivo = progressoAtualMetaEstudo.diasAtivos.find(
        (dia) => dia.nomeDia === nomeDia
      );

      if (diaAtivo && diaAtivo.metaAtingida) {
        elementoDia.classList.add("active");
      } else {
        elementoDia.classList.remove("active");
      }
    });
  }

  function atualizarFraseDoDia() {
    const fila = carregarFilaDoLocalStorage();
    const fraseAtual = fila.shift();

    document.getElementById("autor").innerText = fraseAtual.autor;
    document.getElementById("conteudo-frase").innerText = fraseAtual.frase;

    fila.push(fraseAtual);
    salvarFilaNoLocalStorage(fila);
  }

  function salvarFilaNoLocalStorage(fila) {
    localStorage.setItem("filaFrases", JSON.stringify(fila));
  }

  function carregarFilaDoLocalStorage() {
    const filaSalva = localStorage.getItem("filaFrases");
    if (filaSalva) {
      const fila = JSON.parse(filaSalva);
      if (Array.isArray(fila) && Array.isArray(fila[0])) {
        return fila[0];
      }
      return fila;
    }
    return frases;
  }
});

let frases = [
  {
    autor: "Miyamoto Musashi",
    frase:
      "Tanto ao lutar quanto na vida cotidiana, você deve ser determinado, ainda que calmo. Vá de encontro à situação sem tensão, mas também sem desleixo, com o espírito estável, mas sem prejulgamentos.",
  },
  {
    autor: "Sun Tzu",
    frase: "A suprema arte da guerra é derrotar o inimigo sem lutar.",
  },
  {
    autor: "Bruce Lee",
    frase:
      "Não reze por uma vida fácil, reze por forças para suportar uma difícil.",
  },
  {
    autor: "Albert Einstein",
    frase:
      "A vida é como andar de bicicleta. Para manter o equilíbrio, você deve continuar se movendo.",
  },
  {
    autor: "Confúcio",
    frase:
      "A maior glória não é ficar de pé, mas levantar-se cada vez que caímos.",
  },
  {
    autor: "Miyamoto Musashi",
    frase:
      "A vitória é reservada para aqueles que estão dispostos a pagar o preço.",
  },
  {
    autor: "Marco Aurélio",
    frase:
      "Você tem poder sobre sua mente, não sobre eventos externos. Perceba isso, e você encontrará força.",
  },
  {
    autor: "Naruto Uzumaki",
    frase:
      "Não importa o quão forte você se torne, nunca tente fazer tudo sozinho. Caso contrário, você certamente falhará.",
  },
  {
    autor: "Monkey D. Luffy",
    frase:
      "Eu não vou parar até alcançar meu objetivo. Se eu desistir, quem vai acreditar em mim?",
  },
  {
    autor: "Jesus Cristo",
    frase: "No mundo tereis aflições, mas tende bom ânimo; eu venci o mundo.",
  },
  {
    autor: "David Goggins",
    frase:
      "O sofrimento é o verdadeiro teste de resistência. Se você pode suportar a dor, você pode alcançar qualquer coisa.",
  },
  {
    autor: "Chris Bumstead",
    frase:
      "É sobre disciplina, é sobre fazer o que você disse que faria, mesmo quando não há ninguém olhando.",
  },
  {
    autor: "Albert Einstein",
    frase: "Não tentes ser bem-sucedido, tenta antes ser um Homem de valor..",
  },
  {
    autor: "Thomas Edison",
    frase:
      "Nossa maior fraqueza está em desistir. O caminho mais certo de vencer é tentar mais uma vez.",
  },
  {
    autor: "Sun Tzu",
    frase:
      "A vitória está reservada para aqueles que estão dispostos a pagar o preço.",
  },
  {
    autor: "Vegeta",
    frase:
      "Eu não vou me desculpar por ser o mais forte. Vou apenas continuar treinando até que ninguém possa me superar.",
  },
  {
    autor: "Goku",
    frase:
      "Não importa o quão forte você seja, sempre haverá alguém mais forte. O verdadeiro desafio é nunca desistir.",
  },
  {
    autor: "All Might",
    frase:
      "Quando não houver mais esperança, o que resta é continuar lutando com todo o seu ser.",
  },
  {
    autor: "Rock Lee",
    frase:
      "Eu não sou um gênio, mas trabalho duro pode superar qualquer obstáculo.",
  },
  {
    autor: "Rengoku",
    frase:
      "Queime seu coração com paixão e avance, não importa o que aconteça.",
  },
  {
    autor: "Marco Aurélio",
    frase:
      "A alma se torna tingida pela cor dos seus pensamentos. Escolha os seus com sabedoria.",
  },
  {
    autor: "David Goggins",
    frase:
      "A única coisa que separa você de todos os outros é sua mente. Mantenha-se focado e você vencerá.",
  },
  {
    autor: "Naruto Uzumaki",
    frase: "Nunca volte atrás em sua palavra, porque esse é o meu jeito ninja!",
  },
  { autor: "Sun Tzu", frase: "Em meio ao caos, há também oportunidade." },
  {
    autor: "Chris Bumstead",
    frase:
      "Todo mundo quer ser campeão, mas poucos querem fazer o que é necessário para se tornar um.",
  },
  {
    autor: "Jesus Cristo",
    frase: "Seja luz no mundo e nunca se esconda nas sombras da dúvida.",
  },
  {
    autor: "Monkey D. Luffy",
    frase:
      "Eu não tenho medo de arriscar tudo. O medo não me impede de alcançar meus sonhos.",
  },
  {
    autor: "Thomas Edison",
    frase: "Gênio é 1% inspiração e 99% transpiração.",
  },
  {
    autor: "Vegeta",
    frase:
      "Eu nasci príncipe, mas a força que eu tenho hoje veio do meu treinamento e da minha determinação.",
  },
  {
    autor: "Goku",
    frase:
      "Se você treinar duro e nunca desistir, você sempre encontrará um caminho para vencer.",
  },
  {
    autor: "All Might",
    frase:
      "Se você quer salvar as pessoas, tem que estar preparado para sacrificar tudo.",
  },
  {
    autor: "Rock Lee",
    frase:
      "Para se tornar forte, você deve acreditar que é forte, mesmo quando todos ao seu redor duvidam.",
  },
  {
    autor: "Rengoku",
    frase:
      "Mesmo quando as chamas da batalha queimam, continue lutando com tudo que tem.",
  },
  {
    autor: "Albert Einstein",
    frase: "O único lugar onde sucesso vem antes do trabalho é no dicionário.",
  },
  {
    autor: "Bruce Lee",
    frase: "O Homem que tem confiança em si ganha a confiança dos outros.",
  },
  {
    autor: "Bruce Lee",
    frase:
      "Não se coloque dentro de uma forma, se adapte e construa sua própria, e deixa-a expandir, como a água. Se colocarmos a água num copo, ela se torna o copo; se você colocar água numa garrafa ela se torna a garrafa. A água pode fluir ou pode colidir. Seja água, meu amigo.",
  },
  {
    autor: "Santo Agostinho",
    frase:
      "A fé é para acreditarmos no que não vemos; e a recompensa desta fé é vermos o que acreditamos.",
  },
  {
    autor: "Santo Agostinho",
    frase:
      "A paciência é o complemento da sabedoria. Aprender a esperar é uma das grandes lições da vida.",
  },
  {
    autor: "Santo Agostinho",
    frase:
      "A esperança tem duas filhas lindas, a indignação e a coragem; a indignação nos ensina a não aceitar as coisas como estão; a coragem, a mudá-las.",
  },
  {
    autor: "Santo Agostinho",
    frase:
      "A fé é a força da vida. Se o Homem vive é porque acredita em alguma coisa.",
  },
  {
    autor: "Maquiavel",
    frase:
      "Onde há uma grande vontade, não podem existir grandes dificuldades.",
  },
  {
    autor: "FalleN (Gabriel Toledo)",
    frase:
      "Acredite em você mesmo e no seu potencial. Se você não acreditar, quem vai?",
  },
  {
    autor: "FalleN (Gabriel Toledo)",
    frase:
      "A cada derrota, há uma lição. É importante aprender, evoluir e seguir em frente.",
  },
  {
    autor: "Yoda (Mestre Jedi)",
    frase: "Faça ou não faça. Tentativa não há.",
  },
  {
    autor: "Gandalf (Senhor dos Anéis)",
    frase:
      "Tudo o que temos de decidir é o que fazer com o tempo que nos é dado.",
  },
  {
    autor: "Aslan (Crônicas de Nárnia)",
    frase:
      "Você nunca vai saber o que pode fazer se não tentar. Acredite em si mesmo.",
  },
  {
    autor: "Aslan (Crônicas de Nárnia)",
    frase: "Coragem, querido coração.",
  },
  {
    autor: "Dumbledore (Harry Potter)",
    frase:
      "São as nossas escolhas que revelam o que realmente somos, muito mais do que as nossas qualidades.",
  },
  {
    autor: "Gaulês (Alexandre Borba Chiqueta)",
    frase:
      "Não importa quantas vezes você caia, o que importa é quantas vezes você se levanta.",
  },
  {
    autor: "Faker (Lee Sang-hyeok)",
    frase:
      "A chave para o sucesso é a prática e a determinação. Se você não está disposto a se esforçar, não há como alcançar o topo.",
  },
  {
    autor: "Faker (Lee Sang-hyeok)",
    frase:
      "Se você quer ser o melhor, precisa se dedicar mais do que qualquer outra pessoa.",
  },
  {
    autor: "Faker (Lee Sang-hyeok)",
    frase:
      "Se você quiser ser o melhor, esteja disposto a sacrificar tudo o que for necessário.",
  },
  {
    autor: "Bruce Lee",
    frase:
      "Não reze por uma vida fácil, reze por forças para suportar uma difícil.",
  },
  { autor: "Santo Agostinho", frase: "A medida do amor é amar sem medida." },
  {
    autor: "Maquiavel",
    frase:
      "Os obstáculos não devem te parar. Se você encontrar uma parede, não desista. Descubra como escalá-la, atravessá-la ou dar a volta por cima.",
  },
  {
    autor: "FalleN (Gabriel Toledo)",
    frase:
      "A verdadeira força vem da persistência e do trabalho duro, não dos atalhos.",
  },
  { autor: "Yoda", frase: "Melhor professor, o fracasso é." },
  {
    autor: "Gandalf (Senhor dos Anéis)",
    frase:
      "Você pode encontrar as coisas que perdeu, mas nunca as que abandonou.",
  },
  {
    autor: "Aslan (Crônicas de Nárnia)",
    frase: "Você duvida de seu valor; não fuja de quem você é.",
  },
  {
    autor: "Harry Potter",
    frase:
      "A felicidade pode ser encontrada mesmo nas horas mais difíceis, se você se lembrar de acender a luz.",
  },
  {
    autor: "Gaulês (Alexandre Borba Chiqueta)",
    frase:
      "A vida é um round eterno, e você precisa estar preparado para a próxima batalha.",
  },
  {
    autor: "Faker (Lee Sang-hyeok)",
    frase:
      "Ser o melhor não é um destino, é um caminho que você escolhe trilhar todos os dias.",
  },
  {
    autor: "Jiraiya",
    frase:
      "Não importa o quão duro o caminho seja, se você desistir, nunca saberá se poderia ter vencido.",
  },
  {
    autor: "Minato Namikaze",
    frase: "Acredite na sua força e no potencial que há em você.",
  },
  {
    autor: "Bruce Lee",
    frase:
      "Adapte o que é útil, rejeite o que é inútil e acrescente o que é unicamente seu.",
  },
  {
    autor: "Jesus Cristo",
    frase:
      "Ame seus inimigos, faça o bem para aqueles que te odeiam, abençoe aqueles que te amaldiçoam, reze por aqueles que te maltratam. Se alguém te bater no rosto, ofereça a outra face.",
  },
  {
    autor: "Platão",
    frase:
      "Nunca desencoraje ninguém que faz progressos continuamente, não importa o quão lento.",
  },
  {
    autor: "David Goggins",
    frase:
      "Seja o mais duro de todos os tempos, e quando a dor chegar, continue andando.",
  },
  {
    autor: "Marco Aurélio",
    frase:
      "A felicidade da sua vida depende da qualidade dos seus pensamentos.",
  },
  {
    autor: "Jiraiya",
    frase:
      "Eu amo uma mulher, mas não vou obrigá-la a me amar, vou cercá-la com meu amor enquanto... rezo por sua felicidade.",
  },
  {
    autor: "Monkey D. Luffy",
    frase:
      "Não me importo se eu morrer tentando. O importante é seguir em frente!",
  },
  {
    autor: "Vegeta",
    frase:
      "Somente o trabalho duro e a determinação transformam um guerreiro em um verdadeiro vencedor.",
  },
  {
    autor: "Goku",
    frase:
      "Não importa o quão forte o inimigo seja, sempre há um jeito de superar.",
  },
  {
    autor: "All Might",
    frase:
      "Mesmo que você ache que está no fim, lembre-se de que ainda existe uma chance de brilhar mais uma vez.",
  },
  {
    autor: "Rengoku",
    frase:
      "Viva com orgulho. Se sua fraqueza o dominar, aqueça seu coração, cerre os dentes e siga em frente. Mesmo que sua covardia o retarde, não impedirá a passagem do tempo.",
  },
  {
    autor: "Chris Bumstead",
    frase: "Disciplina é a ponte entre as metas e os resultados.",
  },
  {
    autor: "Albert Einstein",
    frase: "No meio da dificuldade encontra-se a oportunidade.",
  },
  {
    autor: "Thomas Edison",
    frase:
      "Nossa maior fraqueza está em desistir. O caminho mais certo de vencer é tentar mais uma vez.",
  },
  {
    autor: "Rock Lee",
    frase: "O esforço é o único caminho para vencer a verdadeira batalha.",
  },
  {
    autor: "Miyamoto Musashi",
    frase:
      "A derrota é um estado de espírito; nenhum Homem está derrotado até que aceite a derrota como realidade.",
  },
  {
    autor: "Jiraiya",
    frase:
      "Ser rejeitado sempre fortalece um Homem. E se ele não experimentou isso o bastante para conseguir rir e fizer piadas disso, ou ao menos usar isso como material, ele não pode cumprir seus deveres como Homem.",
  },
  {
    autor: "Platão",
    frase: "O início é a parte mais importante do trabalho.",
  },
];

async function cadastrarMetaEstudo(studyPlan, days) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  console.log(user.id);

  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = hoje.getFullYear();
  const dataHoje = `${dia}-${mes}-${ano}`;

  for (const day of days) {
    const nomeDia = day;
    const qtdTempoEstudo = studyPlan[day];

    const url = new URL(`${backendUrl}/meta-de-estudo/cadastro`);
    url.searchParams.append("metaEstudoSemanaId", user.id);
    url.searchParams.append("nomeDia", nomeDia);
    url.searchParams.append("qtdTempoEstudo", qtdTempoEstudo);
    url.searchParams.append("ativado", true);
    url.searchParams.append("data", dataHoje);

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao cadastrar dia de estudo");
      }
    } catch (error) {
      console.error(error);
    }
    i++;
  }
}

async function carregarTabelaPontuacoes(idAluno) {
  try {
    const response = await fetch(
      `${backendUrl}/pontuacoes/lista?idAluno=${idAluno}`
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar os dados da API");
    }

    const dados = await response.json();

    const tabelaAlunos = document.getElementById("tabela-alunos");

    tabelaAlunos.innerHTML = "";
    dados.forEach((item) => {
      const linha = document.createElement("tr");

      const colunaNomeEmpresa = document.createElement("td");
      colunaNomeEmpresa.textContent = item.nomeEmpresa;

      const colunaEmailRecrutador = document.createElement("td");
      colunaEmailRecrutador.textContent = item.emailRecrutador;

      const colunaLista = document.createElement("td");

      colunaLista.textContent = item.lista;
      linha.appendChild(colunaNomeEmpresa);
      linha.appendChild(colunaEmailRecrutador);
      linha.appendChild(colunaLista);
      tabelaAlunos.appendChild(linha);
    });
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}
