document.addEventListener("DOMContentLoaded", function () {
    const loader = document.querySelector('.container_loader');
    if (loader) loader.style.display = 'flex'; // Mostra o loader

    try {
        const data = JSON.parse(sessionStorage.getItem('user'));

        if (!data) {
            throw new Error('Usuário não encontrado no sessionStorage.');
        }

        const h1 = document.getElementById("id_nome_usuario");
        if (h1) {
            h1.innerHTML = `${data.primeiroNome} ${data.sobrenome}`;
        } else {
            throw new Error('Elemento com ID "id_nome_usuario" não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao carregar os dados do usuário:', error);
    } finally {
        if (loader) loader.style.display = 'none';
    }
});
