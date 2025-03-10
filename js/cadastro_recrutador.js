document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('cpf').addEventListener('input', formatarCPF);
    document.getElementById('telefone').addEventListener('input', formatarTelefone);
    document.getElementById('cnpj').addEventListener('input', formatarCNPJ);
    document.getElementById('cadastrar').addEventListener('click', realizarCadastro);
});

async function realizarCadastro() {
    if (!validarCampos()) {
        showAlert('error', 'Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    const id = await cadastrarUsuario();

    if (id !== null) {
        showAlert('success', 'Cadastro realizado com sucesso!');

        const email = document.getElementById('email').value;
        const senha = document.getElementById('password').value;
        await realizarLoginAutomatico(email, senha);
    }
}

function validarCampos() {
    const campos = [
        'username', 'email', 'password', 'firstname',
        'lastname', 'cpf', 'telefone', 'cnpj', 'cargoUsuario'
    ];

    return campos.every(id => {
        const input = document.getElementById(id);
        return input && input.value.trim() !== '';
    });
}

function formatarCPF(event) {
    const cpfInput = event.target;
    let cpfFormatado = cpfInput.value.replace(/\D/g, '');

    if (cpfFormatado.length <= 3) {
        cpfFormatado = cpfFormatado.replace(/(\d{1,3})/, '$1');
    } else if (cpfFormatado.length <= 6) {
        cpfFormatado = cpfFormatado.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    } else if (cpfFormatado.length <= 9) {
        cpfFormatado = cpfFormatado.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else {
        cpfFormatado = cpfFormatado.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    }

    cpfInput.value = cpfFormatado;

    if (cpfInput.value.length > 14) {
        cpfInput.value = cpfInput.value.slice(0, 14);
    }
}

function formatarTelefone(event) {
    const telefoneInput = event.target;
    let telefoneFormatado = telefoneInput.value.replace(/\D/g, '');

    if (telefoneFormatado.length <= 2) {
        telefoneFormatado = telefoneFormatado.replace(/(\d{1,2})/, '($1');
    } else if (telefoneFormatado.length <= 6) {
        telefoneFormatado = telefoneFormatado.replace(/(\d{2})(\d{1,4})/, '($1) $2');
    } else {
        telefoneFormatado = telefoneFormatado.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3');
    }

    telefoneInput.value = telefoneFormatado;

    if (telefoneInput.value.length > 15) {
        telefoneInput.value = telefoneInput.value.slice(0, 15);
    }
}

function formatarCNPJ(event) {
    const cnpjInput = event.target;
    let cnpjFormatado = cnpjInput.value.replace(/\D/g, '');

    if (cnpjFormatado.length <= 2) {
        cnpjFormatado = cnpjFormatado.replace(/(\d{1,2})/, '$1');
    } else if (cnpjFormatado.length <= 5) {
        cnpjFormatado = cnpjFormatado.replace(/(\d{2})(\d{1,3})/, '$1.$2');
    } else if (cnpjFormatado.length <= 8) {
        cnpjFormatado = cnpjFormatado.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (cnpjFormatado.length <= 12) {
        cnpjFormatado = cnpjFormatado.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
    } else {
        cnpjFormatado = cnpjFormatado.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
    }

    cnpjInput.value = cnpjFormatado;

    if (cnpjInput.value.length > 18) {
        cnpjInput.value = cnpjInput.value.slice(0, 18);
    }
}

async function cadastrarUsuario() {
    const usuario = {
        nomeUsuario: document.getElementById('username').value,
        cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
        senha: document.getElementById('password').value,
        primeiroNome: document.getElementById('firstname').value,
        sobrenome: document.getElementById('lastname').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
        cnpj: document.getElementById('cnpj').value.replace(/\D/g, ''),
        tipoUsuario: 2,  
        cargoUsuario: document.getElementById('cargoUsuario').value
    };

    

    try {
        const response = await fetch('http://localhost:8080/usuarios/cadastro', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuario)
        });

        if (response.ok) {
            const data = await response.json();
            return data.id;
        } else {
            const errorData = await response.json();
            showAlert('error', errorData.message || 'Erro ao realizar cadastro');
            return null;
        }
    } catch (error) {
        showAlert('error', 'Erro ao tentar fazer cadastro');
        return null;
    }
}

async function realizarLoginAutomatico(email, senha) {
    try {
        console.log('Tentando fazer login automaticamente com:', email);

        const response = await fetch('http://localhost:8080/usuarios/login', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        if (!response.ok) {
            throw new Error('Erro ao tentar fazer login');
        }

        const data = await response.json();
        console.log('Resposta do login:', data);

        if (data.id) {
            // Sucesso no login
            data.senha = senha;
            sessionStorage.setItem('user', JSON.stringify(data));
            console.log('Login bem-sucedido, usuário armazenado no sessionStorage');

            if (!data.deletado) {

                switch (data.tipoUsuario) {
                    case "Aluno":
                        console.log('Redirecionando para dash_aluno.html');
                        window.location.href = 'dash_aluno.html';
                        break;
                    case "Recrutador":
                        console.log('Redirecionando para tela_rh_vagas.html');
                        window.location.href = 'tela_rh_vagas.html';
                        break;
                    default:
                        showAlert('error', 'Erro: Tipo de usuário desconhecido');
                        console.error('Tipo de usuário desconhecido');
                }
            } else {
                showAlert('success', 'Sua conta está sendo reativada!');
            }
        } else {
            showAlert('error', 'Email ou senha incorretos');
        }
    } catch (error) {
        showAlert('error', 'Erro ao tentar fazer login');
    }
}

function showAlert(type, message) {
    const alertContainer = document.querySelector('.container_alerta');
    const alertTitle = alertContainer.querySelector('.titulo_alerta');
    const alertText = alertContainer.querySelector('.texto_alerta');

    alertTitle.textContent = type === 'success' ? 'Sucesso!' : 'Erro!';
    alertText.textContent = message;

    alertContainer.classList.remove('success', 'error');
    alertContainer.classList.add(type);

    alertContainer.classList.add('show');
    setTimeout(() => alertContainer.classList.remove('show'), 5000);
}