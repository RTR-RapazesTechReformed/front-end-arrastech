import { backendUrl } from "./backendUrl.template.js";

const tipoUsuarioEnum = {
  Aluno: 1,
  Recrutador: 2,
  Empresa: 3,
};

document.addEventListener("DOMContentLoaded", function () {
  const userType = document.getElementById("userType");
  if (userType) {
    console.log("Não aguento mais");

    console.log("userType", userType);
    userType.addEventListener("change", function () {
      let selectedForm;
      if (userType.value === "aluno") {
        selectedForm = document.getElementById("formAluno");
      } else if (userType.value === "recrutador") {
        selectedForm = document.getElementById("formRecrutador");
      } else if (userType.value === "empresa") {
        selectedForm = document.getElementById("formEmpresa");
      }

      console.log("Não aguento mais");
      if (selectedForm) {
        console.log("Não aguento mais");
        selectedForm.addEventListener("click", function (event) {
          console.log("submit");
          event.preventDefault();
          realizarCadastro();
        });
      }
    });
  }

  document.getElementById("cpf").addEventListener("input", formatarCPF);
  document
    .getElementById("telefone")
    .addEventListener("input", formatarTelefone);
  document
    .getElementById("dataNascimento")
    .addEventListener("input", formatarDataNascimento);
  document.getElementById("cep").addEventListener("input", function () {
    formatarCep(this);
    buscarCep(this);
  });
});

function buscarTipoUsuario() {
  const userType = document.getElementById("userType").value;
  switch (userType) {
    case "aluno":
      return tipoUsuarioEnum.Aluno;
    case "recrutador":
      return tipoUsuarioEnum.Recrutador;
    case "empresa":
      return tipoUsuarioEnum.Empresa;
    default:
      showAlert("error", "Tipo de usuário inválido. Selecione um tipo válido.");
      throw new Error("Tipo de usuário inválido.");
  }
}

function validarCampos() {
  const tipoUsuario = buscarTipoUsuario();
  const campos = {
    1: [
      "street",
      "number",
      "city",
      "state",
      "cep",
      "username",
      "email",
      "password",
      "firstname",
      "lastname",
      "cpf",
      "telefone",
      "escolaridade",
      "sexo",
      "etnia",
      "dataNascimento",
    ],
    2: [
      "usernameRecruiter",
      "recruiterEmail",
      "passwordRecruiter",
      "firstnameRecruiter",
      "lastnameRecruiter",
      "cpfRecruiter",
      "telefoneRecruiter",
      "cnpjRecruiter",
      "cargoUsuario",
      "companyRecruiter",
    ],
    3: [
      "companyName",
      "cnpjCompany",
      "telefoneCompany",
      "companyEmail",
      "passwordCompany",
      "firstnameCompany",
      "lastnameCompany",
      "setorIndustria",
      "streetCompany",
      "numberCompany",
      "cityCompany",
      "stateCompany",
      "cepCompany",
    ],
  };

  return campos[tipoUsuario].every((id) => document.getElementById(id).value);
}

async function realizarCadastro() {
  const termsAccepted = sessionStorage.getItem("terms");

  if (termsAccepted !== "true") {
    showAlert(
      "error",
      "Por favor, aceite os termos para continuar o cadastro."
    );
    return;
  }

  const tipoUsuario = buscarTipoUsuario();
  const dataNascimento = document.getElementById("dataNascimento").value;
  const dataNascimentoISO = converterDataParaFormatoISO(dataNascimento);

  if (!validarCampos()) {
    showAlert("error", "Por favor, preencha todos os campos obrigatórios.");
    return;
  }

  try {
    let idEndereco;
    if (tipoUsuario !== tipoUsuarioEnum.Recrutador) {
      idEndereco = await cadastrarEndereco(tipoUsuario);
      if (!idEndereco) {
        throw new Error("Erro ao cadastrar endereço");
      }
    } else {
      try {
        const cnpjRecruiter = document.getElementById("cnpjRecruiter").value;
        idEndereco = await getEnderecoByCnpj(
          removerFormatacaoCNPJ(cnpjRecruiter)
        );
        console.log(idEndereco);
        if (!idEndereco) {
          throw new Error("Erro ao buscar endereço da Empresa");
        }
      } catch (error) {
        console.error("Erro ao tentar cadastrar o endereço:", error);
        showAlert(
          "error",
          "Erro ao tentar cadastrar, CNPJ inválido ou não encontrado"
        );
        return null;
      }
    }

    const idUsuario = await cadastrarUsuario(
      idEndereco,
      tipoUsuario,
      dataNascimentoISO
    );
    if (!idUsuario) {
      throw new Error("Erro ao cadastrar usuário");
    }

    const email =
      tipoUsuario === tipoUsuarioEnum.Aluno
        ? document.getElementById("email").value
        : tipoUsuario === tipoUsuarioEnum.Recrutador
        ? document.getElementById("recruiterEmail").value
        : document.getElementById("companyEmail").value;

    const senha =
      tipoUsuario === tipoUsuarioEnum.Aluno
        ? document.getElementById("password").value
        : tipoUsuario === tipoUsuarioEnum.Recrutador
        ? document.getElementById("passwordRecruiter").value
        : document.getElementById("passwordCompany").value;

    await realizarLoginAutomatico(email, senha, tipoUsuario);
  } catch (error) {
    showAlert("error", error.message);
  }
}

async function cadastrarEndereco(tipoUsuario) {
  const endereco = {
    1: {
      cep: document.getElementById("cep").value,
      cidade: document.getElementById("city").value,
      estado: document.getElementById("state").value,
      rua: document.getElementById("street").value,
      numero: document.getElementById("number").value,
    },
    3: {
      cep: document.getElementById("cepCompany").value,
      cidade: document.getElementById("cityCompany").value,
      estado: document.getElementById("stateCompany").value,
      rua: document.getElementById("streetCompany").value,
      numero: document.getElementById("numberCompany").value,
    },
  };

  try {
    const response = await fetch(`${backendUrl}/enderecos/cadastro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(endereco[tipoUsuario]),
    });

    const data = await response.json();
    if (response.status === 201) return data.id;
    showAlert("error", `Erro ao cadastrar endereço: ${data.message}`);
    return null;
  } catch (error) {
    console.error("Erro ao tentar cadastrar o endereço:", error);
    showAlert("error", "Erro ao tentar cadastrar o endereço");
    return null;
  }
}

async function cadastrarUsuario(idEndereco, tipoUsuario, dataNascimentoISO) {
  const camposEspecificos = {
    1: {
      nomeUsuario: document.getElementById("username").value,
      senha: document.getElementById("password").value,
      email: document.getElementById("email").value,
      telefone: document.getElementById("telefone").value,
      cpf: document.getElementById("cpf").value,
      primeiroNome: document.getElementById("firstname").value,
      sobrenome: document.getElementById("lastname").value,
      escolaridade: document.getElementById("escolaridade").value,
      sexo: document.getElementById("sexo").value,
      etnia: document.getElementById("etnia").value,
      enderecoId: idEndereco,
      dtNasc: dataNascimentoISO,
    },
    2: {
      nomeUsuario: document.getElementById("usernameRecruiter").value,
      senha: document.getElementById("passwordRecruiter").value,
      email: document.getElementById("recruiterEmail").value,
      telefone: document.getElementById("telefoneRecruiter").value,
      cpf: document.getElementById("cpfRecruiter").value,
      primeiroNome: document.getElementById("firstnameRecruiter").value,
      sobrenome: document.getElementById("lastnameRecruiter").value,
      cnpj: removerFormatacaoCNPJ(
        document.getElementById("cnpjRecruiter").value
      ),
      cargoUsuario: document.getElementById("cargoUsuario").value,
      empresa: document.getElementById("companyRecruiter").value,
    },
    3: {
      nomeEmpresa: document.getElementById("companyName").value,
      cnpj: removerFormatacaoCNPJ(document.getElementById("cnpjCompany").value),
      emailCorporativo: document.getElementById("companyEmail").value,
      senhaRepresante: document.getElementById("passwordCompany").value,
      telefoneContato: document.getElementById("telefoneCompany").value,
      representanteLegal: document.getElementById("firstnameCompany").value,
      sobrenomeRepresentante: document.getElementById("lastnameCompany").value,
      setorIndustria: document.getElementById("setorIndustria").value,
      enderecoId: idEndereco,
    },
  };

  const usuario = {
    ...camposEspecificos[tipoUsuario],
    tipoUsuario,
  };

  try {
    const url =
      tipoUsuario !== tipoUsuarioEnum.Empresa
        ? `${backendUrl}/usuarios/cadastro`
        : `${backendUrl}/empresa/cadastro`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuario),
    });

    if (response.ok) {
      const data = await response.json();
      showAlert("success", "Cadastro realizado com sucesso");

      if (tipoUsuario === tipoUsuarioEnum.Empresa) {
        setTimeout(() => {
          window.location.href = "./login.html";
        }, 2000);
      }

      return data.id;
    } else {
      const errorData = await response.json();
      showAlert("error", "Erro ao realizar cadastro");
      return null;
    }
  } catch (error) {
    console.error("Erro ao tentar fazer cadastro:", error);
    showAlert("error", "Erro ao tentar fazer cadastro");
    return null;
  }
}

async function realizarLoginAutomatico(email, senha, tipoUsuario) {
  if (tipoUsuario != 3) {
    try {
      const response = await fetch(`${backendUrl}/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (!response.ok) throw new Error("Erro ao tentar fazer login");

      const data = await response.json();
      if (data.id) {
        sessionStorage.setItem("user", JSON.stringify(data));
        setTimeout(() => {
          window.location.href =
            tipoUsuario === tipoUsuarioEnum.Aluno
              ? "dash_aluno.html"
              : "tela_rh_vagas.html";
        }, 3000);
      } else {
        showAlert("error", "Erro ao fazer login");
      }
    } catch (error) {
      showAlert("error", error.message);
    }
  }
}

window.buscarCep = function buscarCep() {
  const cepInputs = ["cep", "cepCompany"];
  cepInputs.forEach((cepId) => {
    const cepInput = document.getElementById(cepId);
    if (cepInput) {
      const cep = cepInput.value.replace(/\D/g, "");
      const url = `https://viacep.com.br/ws/${cep}/json/`;

      if (cep.length === 8) {
        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            console.log("Dados do CEP:", data);
            if (data.erro) {
              showAlert("error", "CEP não encontrado");
            } else {
              if (cepId === "cep") {
                document.getElementById("street").value = data.logradouro || "";
                document.getElementById("city").value = data.localidade || "";
                document.getElementById("state").value = data.uf || "";
              } else if (cepId === "cepCompany") {
                document.getElementById("streetCompany").value =
                  data.logradouro || "";
                document.getElementById("cityCompany").value =
                  data.localidade || "";
                document.getElementById("stateCompany").value = data.uf || "";
              }
            }
          })
          .catch((error) => {
            console.error("Erro ao buscar CEP:", error);
            showAlert("error", "Erro ao buscar CEP");
          });
      }
    }
  });
};

window.formatarCep = function formatarCep(event) {
  let cepInput = event.value;
  let cepFormatado = cepInput.replace(/\D/g, "");

  if (cepFormatado.length >= 5) {
    cepFormatado =
      cepFormatado.substring(0, 5) + "-" + cepFormatado.substring(5);
  }
  cepInput = cepFormatado;
};

function formatarCPF(event) {
  const cpfInput = event.target;
  let cpfFormatado = cpfInput.value.replace(/\D/g, "");

  if (cpfFormatado.length <= 3) {
    cpfFormatado = cpfFormatado.replace(/(\d{1,3})/, "$1");
  } else if (cpfFormatado.length <= 6) {
    cpfFormatado = cpfFormatado.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  } else if (cpfFormatado.length <= 9) {
    cpfFormatado = cpfFormatado.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  } else {
    cpfFormatado = cpfFormatado.replace(
      /(\d{3})(\d{3})(\d{3})(\d{1,2})/,
      "$1.$2.$3-$4"
    );
  }

  cpfInput.value = cpfFormatado;

  if (cpfInput.value.length > 14) {
    cpfInput.value = cpfInput.value.slice(0, 14);
  }

  if (!validarCPF(cpfInput.value)) {
    showAlert("error", "CPF inválido. Por favor, insira um CPF válido.");
  } else {
    showAlert("success", "CPF válido. Sucesso, CPF inserido é válido");
  }
}

function validarCPF(cpf) {
  const cpfNumeros = cpf.replace(/\D/g, "");

  if (cpfNumeros.length !== 11 || /^(\d)\1{10}$/.test(cpfNumeros)) {
    return false;
  }

  let soma = 0;
  let digito;

  for (let i = 0; i < 9; i++) {
    soma += cpfNumeros[i] * (10 - i);
  }
  digito = (soma * 10) % 11;
  if (digito === 10 || digito === 11) digito = 0;
  if (digito !== parseInt(cpfNumeros[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += cpfNumeros[i] * (11 - i);
  }
  digito = (soma * 10) % 11;
  if (digito === 10 || digito === 11) digito = 0;
  if (digito !== parseInt(cpfNumeros[10], 10)) return false;

  return true;
}

function formatarDataNascimento(event) {
  const dataInput = event.target;
  let dataFormatada = dataInput.value.replace(/\D/g, "");

  if (dataFormatada.length <= 2) {
    dataFormatada = dataFormatada.replace(/(\d{1,2})/, "$1");
  } else if (dataFormatada.length <= 4) {
    dataFormatada = dataFormatada.replace(/(\d{2})(\d{1,2})/, "$1/$2");
  } else if (dataFormatada.length <= 8) {
    dataFormatada = dataFormatada.replace(
      /(\d{2})(\d{2})(\d{1,4})/,
      "$1/$2/$3"
    );
  } else {
    dataFormatada = dataFormatada.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
  }

  dataInput.value = dataFormatada;

  if (dataInput.value.length > 10) {
    dataInput.value = dataInput.value.slice(0, 10);
  }

  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    validarDataEAtualizarCampo(dataInput);
  }, 1000);
}

function validarDataEAtualizarCampo(input) {
  if (!validarData(input.value)) {
    showAlert(
      "error",
      "Data inválida. Por favor, insira uma data válida no formato DD/MM/AAAA."
    );
    input.value = "";
  }
}

function validarData(data) {
  const partes = data.split("/");
  if (partes.length !== 3) {
    return false;
  }
  const [dia, mes, ano] = partes.map((part) => parseInt(part, 10));

  if (
    isNaN(dia) ||
    isNaN(mes) ||
    isNaN(ano) ||
    mes < 1 ||
    mes > 12 ||
    dia < 1 ||
    dia > 31
  ) {
    return false;
  }

  if ((mes === 4 || mes === 6 || mes === 9 || mes === 11) && dia > 30) {
    return false;
  }
  if (mes === 2) {
    const isBissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
    if ((isBissexto && dia > 29) || (!isBissexto && dia > 28)) {
      return false;
    }
  }

  return true;
}

function formatarTelefone(event) {
  const telefoneInput = event.target;
  let telefoneFormatado = telefoneInput.value.replace(/\D/g, "");

  if (telefoneFormatado.length <= 2) {
    telefoneFormatado = telefoneFormatado.replace(/(\d{1,2})/, "($1");
  } else if (telefoneFormatado.length <= 6) {
    telefoneFormatado = telefoneFormatado.replace(
      /(\d{2})(\d{1,4})/,
      "($1) $2"
    );
  } else if (telefoneFormatado.length <= 10) {
    telefoneFormatado = telefoneFormatado.replace(
      /(\d{2})(\d{4})(\d{1,4})/,
      "($1) $2-$3"
    );
  } else {
    telefoneFormatado = telefoneFormatado.replace(
      /(\d{2})(\d{5})(\d{1,4})/,
      "($1) $2-$3"
    );
  }

  telefoneInput.value = telefoneFormatado;

  if (telefoneInput.value.length > 15) {
    telefoneInput.value = telefoneInput.value.slice(0, 15);
  }
}

function showAlert(type, message) {
  const alertContainer = document.createElement("div");
  alertContainer.className = `container_alerta ${type} show`;

  const alertTitle = document.createElement("span");
  alertTitle.className = "titulo_alerta";
  alertTitle.textContent = type === "error" ? "Erro!" : "Sucesso!";

  const alertText = document.createElement("span");
  alertText.className = "texto_alerta";
  alertText.textContent = message;

  alertContainer.appendChild(alertTitle);
  alertContainer.appendChild(alertText);

  document.body.appendChild(alertContainer);

  setTimeout(() => {
    alertContainer.classList.remove("show");
    setTimeout(() => {
      alertContainer.remove();
    }, 3000);
  }, 3000);
}

function converterDataParaFormatoISO(data) {
  const [dia, mes, ano] = data.split("/");
  return `${ano}-${mes}-${dia}`;
}

async function getEnderecoByCnpj(cnpj) {
  try {
    const response = await fetch(
      `${backendUrl}/empresa/buscar-por-cnpj/${cnpj}`,
      {
        method: "GET",
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(data);
      return data.endereco.id;
    } else {
      const errorData = await response.json();
      showAlert(
        "error",
        errorData.message || "Erro ao buscaraaaaaaaaa endereço"
      );
      return null;
    }
  } catch (error) {
    console.error("Erro ao tentar buscaraaaaaaaa endereço:", error);
    showAlert("error", "Erro ao tentar aaaaaaaaaabuscar endereço");
    return null;
  }
}

function formatarCNPJ(event) {
  const cnpjInput = event.target;
  let cnpjFormatado = cnpjInput.value.replace(/\D/g, ""); // Remove todos os caracteres não numéricos

  if (cnpjFormatado.length <= 2) {
    cnpjFormatado = cnpjFormatado.replace(/(\d{1,2})/, "$1");
  } else if (cnpjFormatado.length <= 5) {
    cnpjFormatado = cnpjFormatado.replace(/(\d{2})(\d{1,3})/, "$1.$2");
  } else if (cnpjFormatado.length <= 8) {
    cnpjFormatado = cnpjFormatado.replace(
      /(\d{2})(\d{3})(\d{1,3})/,
      "$1.$2.$3"
    );
  } else if (cnpjFormatado.length <= 12) {
    cnpjFormatado = cnpjFormatado.replace(
      /(\d{2})(\d{3})(\d{3})(\d{1,4})/,
      "$1.$2.$3/$4"
    );
  } else {
    cnpjFormatado = cnpjFormatado.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/,
      "$1.$2.$3/$4-$5"
    );
  }

  cnpjInput.value = cnpjFormatado;

  if (cnpjInput.value.length > 18) {
    cnpjInput.value = cnpjInput.value.slice(0, 18);
  }

  // Validação do CNPJ
  if (validarCNPJ(cnpjFormatado)) {
    showAlert("success", "CNPJ válido. Sucesso, CNPJ inserido é válido.");
  } else {
    showAlert("error", "CNPJ inválido. Por favor, insira um CNPJ válido.");
  }
}

function validarCNPJ(cnpj) {
  cnpj = cnpj.replace(/\D/g, ""); // Remove qualquer coisa que não seja número

  // CNPJ com todos os números iguais são inválidos
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  // Validação dos dígitos verificadores
  const calcularDigitoVerificador = (cnpj, pesos) => {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) {
      soma += parseInt(cnpj.charAt(i)) * pesos[i];
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  // Primeira validação (13º dígito)
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const digito1 = calcularDigitoVerificador(cnpj, pesos1);
  if (digito1 !== parseInt(cnpj.charAt(12))) {
    return false;
  }

  // Segunda validação (14º dígito)
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const digito2 = calcularDigitoVerificador(cnpj, pesos2);
  if (digito2 !== parseInt(cnpj.charAt(13))) {
    return false;
  }

  return true;
}

function removerFormatacaoCNPJ(cnpj) {
  return cnpj.replace(/\D/g, "");
}
