document.addEventListener("DOMContentLoaded", function () {
    const profileImageHeader = document.getElementById('profileImageHeader');
    const containerNomeUsuario = document.querySelector('.container_nome_usuario'); // Seleciona o contêiner pelo seletor de classe

    // Verifique se os elementos foram encontrados
    if (profileImageHeader) {
        async function fetchProfileImage() {
            const userId = JSON.parse(sessionStorage.getItem('user')).id;
            try {
                const response = await fetch(`http://localhost:8080/usuarios/imagem/${userId}`);
                if (response.ok) {
                    const imageBlob = await response.blob();

                    if (imageBlob.size > 0) {
                        const imageUrl = URL.createObjectURL(imageBlob);
                        profileImageHeader.src = imageUrl;

                        profileImageHeader.style.width = '5vh';
                        profileImageHeader.style.height = '5vh';
                        profileImageHeader.style.borderRadius = '100%';
                        profileImageHeader.style.objectFit = 'cover';
                    } else {
                        profileImageHeader.src = '/imgs/foto_padrao.png';

                        profileImageHeader.style.width = '5vh';
                        profileImageHeader.style.height = '5vh';
                        profileImageHeader.style.borderRadius = '100%';
                        profileImageHeader.style.objectFit = 'cover';
                    }
                } else {
                    console.error('Falha ao buscar a imagem.');
                    profileImageHeader.src = '/imgs/foto_padrao.png';

                    profileImageHeader.style.width = '5vh';
                    profileImageHeader.style.height = '5vh';
                    profileImageHeader.style.borderRadius = '100%';
                    profileImageHeader.style.objectFit = 'cover';
                }
            } catch (error) {
                console.error('Erro ao buscar a imagem:', error);
                profileImageHeader.src = '/imgs/foto_padrao.png';

                profileImageHeader.style.width = '5vh';
                profileImageHeader.style.height = '5vh'; 
                profileImageHeader.style.borderRadius = '100%';
                profileImageHeader.style.objectFit = 'cover';
            }
        }

        fetchProfileImage();
    } else {
        console.error('Elemento de imagem não encontrado.');
    }

    // Aplica os estilos ao contêiner
    if (containerNomeUsuario) {
        containerNomeUsuario.style.display = 'flex';
        containerNomeUsuario.style.alignItems = 'center'; // Alinha o texto verticalmente ao centro
        containerNomeUsuario.style.pointerEvents = 'none';
        containerNomeUsuario.style.gap = '10px'; // Espaçamento entre os itens
    } else {
        console.error('Elemento .container_nome_usuario não encontrado.');
    }
});