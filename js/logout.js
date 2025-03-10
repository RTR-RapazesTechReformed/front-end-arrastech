async function fazerLogout() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const loader = document.querySelector('.container_loader');
    loader.style.display = 'flex';
    try {
        const response = await fetch(`http://localhost:8080/usuarios/logoff?idUsuario=${user.id}`, {
            method: 'POST'
        });

        if (!response.ok) throw new Error('Erro ao fazer logoff.');

        sessionStorage.clear();
        window.location.href = '/html/home.html';
    } catch (error) {
        console.error('Erro ao fazer logoff:', error);
        alert('Erro ao fazer logoff. Por favor, tente novamente.');
    } finally {
        loader.style.display = 'none';
    }
}