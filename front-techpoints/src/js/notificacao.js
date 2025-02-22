import { backendUrl } from "./backendUrl.template.js";

function toggleNotificacao() {
  const notificacaoDropdown = document.getElementById("notificacao-dropdown");
  const iconeNotificacao = document.querySelector(".icone-notificacao");

  if (notificacaoDropdown.classList.contains("show")) {
    notificacaoDropdown.classList.add("hide");
    notificacaoDropdown.classList.remove("show");

    setTimeout(() => {
      notificacaoDropdown.style.display = "none";
      notificacaoDropdown.classList.remove("hide");
    }, 300);
  } else {
    notificacaoDropdown.style.display = "block";
    notificacaoDropdown.classList.add("show");

    iconeNotificacao.classList.add("shake");
    setTimeout(() => {
      iconeNotificacao.classList.remove("shake");
    }, 500);
  }
}

document.addEventListener("click", function (event) {
  const notificacao = document.querySelector(".notificacao");
  const dropdown = document.getElementById("notificacao-dropdown");

  if (!notificacao.contains(event.target)) {
    if (dropdown.classList.contains("show")) {
      dropdown.classList.add("hide");
      dropdown.classList.remove("show");
      setTimeout(() => {
        dropdown.style.display = "none";
        dropdown.classList.remove("hide");
      }, 300);
    }
  }
});

async function buscarNotificacoes() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const idAluno = user?.id;

  if (!idAluno) {
    console.error("ID do aluno não encontrado.");
    exibirNotificacoes([]);
    return;
  }

  try {
    const url = `${backendUrl}/notificacoes/${idAluno}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Erro ao buscar notificações: ${response.status}`);
      exibirNotificacoes([]);
      return;
    }

    if (response.status === 204) {
      console.log("Nenhuma notificação encontrada.");
      exibirNotificacoes([]);
      return;
    }

    const notificacoes = await response.json();
    if (!Array.isArray(notificacoes)) {
      console.error("O formato das notificações recebidas é inválido.");
      exibirNotificacoes([]);
      return;
    }

    exibirNotificacoes(notificacoes);
  } catch (error) {
    console.error("Erro ao fazer a requisição:", error);
    exibirNotificacoes([]);
  }
}

function exibirNotificacoes(notificacoes) {
  const listaNotificacoes = document.getElementById("notificacao-lista");
  const contadorElement = document.getElementById("contador-notificacoes");

  listaNotificacoes.innerHTML = "";

  if (!Array.isArray(notificacoes) || notificacoes.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Nenhuma notificação";
    listaNotificacoes.appendChild(li);
    contadorElement.style.visibility = "hidden";

    return;
  }

  notificacoes.reverse().forEach((notificacao) => {
    if (!notificacao || !notificacao.lista || !notificacao.empresa) {
      console.warn("Notificação inválida ignorada:", notificacao);
      return;
    }

    contadorElement.style.visibility = "visible";

    let mensagem = "";

    if (notificacao.lista === "interessados") {
      const recrutadorNome =
        notificacao.recrutador?.replace(/_/g, " ") || "Desconhecido";
      mensagem = `O recrutador <b>${recrutadorNome}</b> da empresa <b>${notificacao.empresa}</b> se <b>interessou</b> por você.`;
    } else if (notificacao.lista === "processoSeletivo") {
      mensagem = `Muito bem, você entrou no <b>processo seletivo</b> da empresa: <b>${notificacao.empresa}</b>.`;
    } else if (notificacao.lista === "contratados") {
      mensagem = `Parabéns, você foi <b>contratado pela empresa</b>: <b>${notificacao.empresa}</b> 🎉🎉🎉`;
    } else if (notificacao.lista === "favoritos") {
      return;
    }

    const dataFormatada = formatarData(notificacao.data);

    const li = document.createElement("li");
    li.setAttribute("data-id", notificacao.id);

    li.innerHTML = `
        <div>${mensagem}</div>
        <div>
            <button class="marcar-lida" onclick="marcarComoLida(event, ${notificacao.id})">Marcar como lida</button>
            <span class="data-notificacao">${dataFormatada}</span>
        </div>
        `;

    listaNotificacoes.appendChild(li);
  });
}

function formatarData(dataString) {
  if (!dataString) {
    return "Data inválida";
  }

  const data = new Date(dataString);
  if (isNaN(data)) {
    return "Data inválida";
  }

  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();

  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");

  return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

function marcarComoLida(event, idNotificacao) {
  event.stopPropagation();

  if (!idNotificacao || isNaN(idNotificacao)) {
    console.error("ID da notificação inválido.");
    return;
  }

  const user = JSON.parse(sessionStorage.getItem("user"));
  const idAluno = user?.id;

  if (!idAluno || isNaN(idAluno)) {
    console.error("ID do aluno inválido.");
    return;
  }

  const url = `${backendUrl}/notificacoes/${idAluno}/notificacoes/${idNotificacao}/marcar-como-lida`;

  fetch(url, { method: "PATCH" })
    .then((response) => {
      if (!response.ok) {
        console.error("Erro ao marcar como lida:", response.status);
        return;
      }

      const li = document.querySelector(`li[data-id="${idNotificacao}"]`);
      if (li) {
        li.style.opacity = "0.5";
        li.classList.add("lida");

        const button = li.querySelector(".marcar-lida");
        if (button) {
          button.disabled = true;
          button.textContent = "Lida";
        }
      }

      const todasNotificacoes = document.querySelectorAll(
        ".notificacao-lista li"
      );
      const notificacoesNaoLidas = Array.from(todasNotificacoes).filter(
        (item) => !item.classList.contains("lida")
      );

      const contadorElement = document.getElementById("contador-notificacoes");
      if (notificacoesNaoLidas.length === 0) {
        contadorElement.style.visibility = "hidden";
      }
    })
    .catch((error) => {
      console.error("Erro ao marcar como lida:", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  buscarNotificacoes();
});
