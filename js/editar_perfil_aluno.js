document.addEventListener("DOMContentLoaded", async function () {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const descricaoTextarea = document.getElementById('descricao');
    const descricao = document.getElementById('id_descricao');
    if (user && user.descricao) {
        descricaoTextarea.placeholder = user.descricao;
        descricao.innerHTML = user.descricao;
    } else {
        descricao.innerHTML = "Nenhuma descrição escrita.";
    }

    if (user) {
        // Confirma o conteúdo do objeto
        console.log(user);

        // Preenche o nome e o email do usuário
        document.getElementById('id_nome').innerText = `${user.primeiroNome} ${user.sobrenome}`|| 'Nome não disponível';
        document.getElementById('id_email_usuario').innerText = user.email || 'Email não disponível';

        // Preenche as datas
        document.getElementById('span_data_criacao').innerText = user.dataCriacao ? new Date(user.dataCriacao).toLocaleDateString() : 'Data não disponível';
        document.getElementById('span_data_ultima_atualizacao').innerText = user.dataAtualizacao ? new Date(user.dataAtualizacao).toLocaleDateString() : 'Não houve nenhuma atualização';
    } else {
        // Caso não haja dados no sessionStorage
        document.getElementById('id_nome').innerText = 'Nome não disponível';
        document.getElementById('id_email_usuario').innerText = 'Email não disponível';
        document.getElementById('span_data_criacao').innerText = 'Data não disponível';
        document.getElementById('span_data_ultima_atualizacao').innerText = 'Não houve nenhuma atualização';
    }
});

function validarApelido(apelidoInput) {
    const apelidoValue = apelidoInput.value.trim();
    return apelidoValue === '' ? 'O apelido não pode estar vazio.' : true;
}

function validarSobrenome(sobrenomeInput) {
    const sobrenomeValue = sobrenomeInput.value.trim();
    return sobrenomeValue === '' ? 'O sobrenome não pode estar vazio.' : true;
}

function validarCEP(cepInput) {
    const cepValue = cepInput.value.trim();
    if (cepValue === '') return true;
    const regex = /^[0-9]{5}-?[0-9]{3}$/;
    return regex.test(cepValue) ? true : 'O formato do CEP é inválido.';
}

function validarEstado(estadoInput) {
    const estadoValue = estadoInput.value.trim();
    return estadoValue === '' ? 'O estado não pode estar vazio.' : true;
}

function validarCidade(cidadeInput) {
    const cidadeValue = cidadeInput.value.trim();
    return cidadeValue === '' ? 'A cidade não pode estar vazia.' : true;
}

function validarRua(ruaInput) {
    const ruaValue = ruaInput.value.trim();
    return ruaValue === '' ? 'A rua não pode estar vazia.' : true;
}

function validarEmail(emailInput) {
    const emailValue = emailInput.value.trim();
    if (emailValue === '') return true;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(emailValue) ? true : 'O formato do e-mail é inválido.';
}

function validarSenha(senhaInput, confirmacaoSenhaInput) {
    const senhaValue = senhaInput.value.trim();
    const confirmacaoSenhaValue = confirmacaoSenhaInput.value.trim();
    if (senhaValue === '') return true;
    if (senhaValue.length < 6) return 'A senha deve ter no mínimo 6 caracteres.';
    return senhaValue !== confirmacaoSenhaValue ? 'As senhas não coincidem.' : true;
}

async function salvarMudancas(event) {
    event.preventDefault();

    const apelidoInput = document.getElementById('apelido');
    const sobrenomeInput = document.getElementById('sobrenome');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const senhaConfirmacaoInput = document.getElementById('conf_senha');
    const cepInput = document.getElementById('cep');
    const estadoInput = document.getElementById('estado');
    const cidadeInput = document.getElementById('cidade');
    const ruaInput = document.getElementById('rua');
    const descricaoInput = document.getElementById('descricao');

    const data = JSON.parse(sessionStorage.getItem('user'));
    const idUsuario = data.id;
    const idEndereco = data.endereco.id;

    let updates = {};
    let erros = [];
    let enderecoUpdates = {};

    // Validação e atualização do apelido, se estiver preenchido
    const apelido = apelidoInput.value.trim();
    if (apelido !== '') {
        const apelidoError = validarApelido(apelidoInput);
        if (apelidoError !== true) {
            erros.push(apelidoError);
        } else {
            updates.primeiroNome = apelido;

            const sobrenome = sobrenomeInput.value.trim();
            if (sobrenome !== '') {
                updates.nomeUsuario = `${apelido} ${sobrenome}`;
            } else {
                updates.nomeUsuario = apelido;
            }
        }
    }

    // Verifica e valida o campo de sobrenome, se estiver preenchido
    if (sobrenomeInput.value.trim() !== '') {
        const sobrenomeError = validarSobrenome(sobrenomeInput);
        if (sobrenomeError !== true) erros.push(sobrenomeError);
        else updates.sobrenome = sobrenomeInput.value.trim();
    }

    // Verifica e valida o campo de e-mail, se estiver preenchido
    if (emailInput.value.trim() !== '') {
        const emailError = validarEmail(emailInput);
        if (emailError !== true) erros.push(emailError);
        else updates.email = emailInput.value.trim();
    }

    // Verifica e valida o campo de senha, se estiver preenchido
    if (senhaInput.value.trim() !== '' || senhaConfirmacaoInput.value.trim() !== '') {
        const senhaError = validarSenha(senhaInput, senhaConfirmacaoInput);
        if (senhaError !== true) erros.push(senhaError);
        else updates.senha = senhaInput.value.trim();
    }

    // Verifica o campo de descrição, se estiver preenchido
    const descricao = descricaoInput.value.trim();
    if (descricao !== '') {
        updates.descricao = descricao;
    }

    // Verifica se todos os campos de endereço estão preenchidos
    if (cepInput.value.trim() !== '' || estadoInput.value.trim() !== '' || cidadeInput.value.trim() !== '' || ruaInput.value.trim() !== '') {
        if (cepInput.value.trim() === '' || estadoInput.value.trim() === '' || cidadeInput.value.trim() === '' || ruaInput.value.trim() === '') {
            erros.push('Todos os campos de endereço (CEP, Estado, Cidade, Rua) devem estar preenchidos.');
        } else {
            enderecoUpdates.cep = cepInput.value.trim();
            enderecoUpdates.estado = estadoInput.value.trim();
            enderecoUpdates.cidade = cidadeInput.value.trim();
            enderecoUpdates.rua = ruaInput.value.trim();
        }
    }

    // Verifica se há erros
    if (erros.length > 0) {
        showAlert(erros.join('\n'), 'error');
        return;
    }

    // Verifica se há algo a ser atualizado
    if (Object.keys(updates).length === 0 && Object.keys(enderecoUpdates).length === 0) {
        showAlert('Nenhuma alteração detectada.', 'error');
        return;
    }
    loader.style.display = 'flex';
    try {
        if (Object.keys(updates).length > 0) {
            const response = await fetch(`http://localhost:8080/usuarios/atualizar/${idUsuario}`, {
                method: 'PATCH',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error('Erro ao tentar atualizar as informações do usuário');
            }
        }

        if (Object.keys(enderecoUpdates).length > 0) {
            const enderecoResponse = await fetch(`http://localhost:8080/enderecos/atualizar/${idEndereco}`, {
                method: 'PATCH',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(enderecoUpdates)
            });

            if (!enderecoResponse.ok) {
                throw new Error('Erro ao tentar atualizar o endereço');
            }
        }

        document.querySelector('.container_fundo_editar_informacoes').style.display = 'none';
        showAlert("Informações atualizadas com sucesso. Você será redirecionado para a tela de login.", 'success');

        apelidoInput.value = '';
        sobrenomeInput.value = '';
        emailInput.value = '';
        senhaInput.value = '';
        senhaConfirmacaoInput.value = '';
        cepInput.value = '';
        estadoInput.value = '';
        cidadeInput.value = '';
        ruaInput.value = '';
        descricaoInput.value = ''; // Limpa o campo de descrição

        setTimeout(() => {
            window.location.href = '/html/login.html';
        }, 3000);

        if (updates.senha) {
            loader.style.display = 'flex';
            try {
                const novaSenha = updates.senha;
                const senhaResponse = await fetch('http://localhost:8080/reset-senha/nova-senha', {
                    method: 'PATCH',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: data.email, novaSenha })
                });

                if (!senhaResponse.ok) {
                    throw new Error('Erro ao atualizar a senha');
                }
            } catch (error) {
                showAlert('Erro ao tentar atualizar a senha', 'error');
            } finally {
            loader.style.display = 'none';
            }
        }

    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        loader.style.display = 'none';
    }
}

function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('alerta');
    const alertTitle = alertBox.querySelector('.titulo_alerta');
    const alertText = alertBox.querySelector('.texto_alerta');

    // Define o título e o texto do alerta
    alertTitle.textContent = type === 'success' ? 'Sucesso' : 'Erro';
    alertText.textContent = message;

    // Define a classe para o tipo de alerta
    alertBox.className = `container_alerta show ${type}`;
    alertBox.style.display = 'block';

    // Remove o alerta após 3 segundos
    setTimeout(() => {
        alertBox.style.opacity = '0';
        setTimeout(() => {
            alertBox.style.display = 'none';
            alertBox.style.opacity = '1';
        }, 500);
    }, 3000);
}

document.getElementById('cep').addEventListener('blur', buscarCep);

function buscarCep() {
    const cepInput = document.getElementById('cep');
    const cep = cepInput.value.replace(/\D/g, ''); // Remove qualquer caractere que não seja dígito
    const url = `https://viacep.com.br/ws/${cep}/json/`;

    if (cep.length === 8) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar o CEP');
                }
                return response.json();
            })
            .then(data => {
                if (data.erro) {
                    showAlert('CEP não encontrado.', 'error');
                    return;
                }

                document.getElementById('rua').value = data.logradouro;
                document.getElementById('estado').value = data.uf;
                document.getElementById('cidade').value = data.localidade;
            })
            .catch(error => {
                console.error('Erro ao buscar CEP:', error);
                showAlert('Erro ao buscar o CEP. Verifique sua conexão e tente novamente.', 'error');
            });
    } else {
        showAlert('CEP inválido. O CEP deve conter 8 dígitos.', 'error');
    }
}

function editarPerfil() {
    document.querySelector('.container_fundo_editar_informacoes').style.display = 'flex';
}

function showTooltip(event, text) {
    var tooltip = document.getElementById('tooltip');
    tooltip.textContent = text;
    tooltip.style.opacity = 1;
    tooltip.style.left = event.pageX + 'px';
    tooltip.style.top = (event.pageY + 20) + 'px';
}

function hideTooltip() {
    var tooltip = document.getElementById('tooltip');
    tooltip.style.opacity = 0;
}

function fecharFormulario() {
    document.querySelector('.container_fundo_editar_informacoes').style.display = 'none';
}


