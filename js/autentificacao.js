const loader = document.querySelector('.container_loader');

async function verificarAutenticacao() {
    if (loader) {
        loader.style.display = 'flex';
    }

    try {
        const user = JSON.parse(sessionStorage.getItem('user'));

        if (!user || user.autenticado !== true) {
            window.location.href = '/html/login.html';
        }        
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    } finally {
        if (loader) {
            loader.style.display = 'none';
        }
    }
}

verificarAutenticacao();
