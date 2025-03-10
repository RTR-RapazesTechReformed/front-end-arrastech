async function realizarLogin() {
    const email = document.getElementById('inputEmail').value;
    const senha = document.getElementById('inputSenha').value;

    try {
        console.log('Tentando fazer login com:', email);

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
                // Redirecionamento conforme o tipo de usuário
                redirectToDashboard(data.tipoUsuario);
            } else {
                // Exibir alerta de reativação e tentar reativar a conta
                showAlert('success', 'Sua conta está sendo reativada!');
                console.log('Conta está deletada, tentando reativar...');

                setTimeout(async () => {
                    try {
                        const reativarResponse = await fetch('http://localhost:8080/usuarios/reativar', {
                            method: 'POST',
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email, senha })
                        });

                        if (!reativarResponse.ok) {
                            throw new Error('Erro ao tentar reativar a conta');
                        }

                        const reativarData = await reativarResponse.json();
                        console.log('Dados após reativação:', reativarData);

                        // Buscar informações do usuário após reativação
                        const userId = data.id; // Use o ID do usuário armazenado no sessionStorage
                        const userResponse = await fetch(`http://localhost:8080/usuarios/buscar/${userId}`);
                        
                        if (!userResponse.ok) {
                            throw new Error('Erro ao buscar informações do usuário');
                        }

                        const userData = await userResponse.json();
                        console.log('Informações do usuário após reativação:', userData);

                        // Redirecionamento após reativação
                        redirectToDashboard(userData.tipoUsuario);

                    } catch (reativarError) {
                        showAlert('error', 'Erro ao tentar reativar a conta');
                        console.error('Erro ao tentar reativar a conta:', reativarError);
                    }
                }, 1000); // Tempo para mostrar o alerta de reativação

            }

        } else {
            showAlert('error', 'Email ou senha incorretos');
            console.log('Email ou senha incorretos');
        }
    } catch (error) {
        showAlert('error', 'Erro ao tentar fazer login');
        console.error('Erro ao tentar fazer login:', error);
    }
}

function redirectToDashboard(tipoUsuario) {
    switch (tipoUsuario) {
        case "Aluno":
            console.log('Redirecionando para dash_aluno.html');
            window.location.href = 'dash_aluno.html';
            break;
        case "Recrutador":
            console.log('Redirecionando para tela_rh_vagas.html');
            window.location.href = 'tela_rh_vagas.html';
            break;
        case "Administrador":
            console.log('Redirecionando para dash_adm.html');
            window.location.href = 'dash_adm.html';
            break;    
        default:
            showAlert('error', 'Erro: Tipo de usuário desconhecido');
            console.error('Tipo de usuário desconhecido');
    }
}

function showAlert(type, message) {
    const alertDiv = document.getElementById('alertDiv');
    console.log(`Exibindo alerta: Tipo - ${type}, Mensagem - ${message}`);

    // Limpa qualquer alerta existente
    alertDiv.classList.remove('d-none', 'alert-success', 'alert-error', 'fade-in', 'fade-out');
    alertDiv.classList.add(`alert-${type}`, 'fade-in');
    alertDiv.querySelector('.texto_alerta').innerText = message;
    alertDiv.style.display = 'block';

    setTimeout(() => {
        alertDiv.classList.add('fade-out');
        setTimeout(() => {
            alertDiv.classList.remove('fade-in', 'fade-out');
            alertDiv.classList.add('d-none');
            alertDiv.style.display = 'none'; 
        }, 500);
    }, 3000); 
}
