document.addEventListener("DOMContentLoaded", function () {
    const uploadButton = document.getElementById('uploadButton');
    const fileInput = document.getElementById('fileInput');
    const profileImageHeader = document.getElementById('profileImageHeader');
    const profileImage = document.getElementById('profileImage'); 
    const defaultImageUrl = '/imgs/foto_padrao.png'; 
    const loader = document.querySelector('.container_loader');

    if (!uploadButton || !fileInput || !profileImageHeader || !profileImage) {
        console.error('Um ou mais elementos não foram encontrados no DOM.');
        return;
    }

    async function fetchProfileImage() {
        const userId = JSON.parse(sessionStorage.getItem('user')).id;
        loader.style.display = 'flex';
        try {
            const response = await fetch(`/usuarios/imagem/${userId}`);
            if (response.ok) {
                const imageBlob = await response.blob();

                if (imageBlob.size > 0) {
                    const imageUrl = URL.createObjectURL(imageBlob);
                    profileImageHeader.src = imageUrl; 
                    profileImage.src = imageUrl; 

                    profileImageHeader.classList.remove('blur');
                    profileImage.classList.remove('blur');
                } else {
                    profileImageHeader.src = defaultImageUrl;
                    profileImage.src = defaultImageUrl; 
                }
            } else {
                console.error('Falha ao buscar a imagem.');
                profileImageHeader.src = defaultImageUrl;
                profileImage.src = defaultImageUrl; 
            }
        } catch (error) {
            console.error('Erro ao buscar a imagem:', error);
            profileImageHeader.src = defaultImageUrl; 
            profileImage.src = defaultImageUrl; 
        } finally {
            loader.style.display = 'none';
        }
    }

    uploadButton.addEventListener('click', async function () {
        const file = fileInput.files[0];

        if (file) {
            const formData = new FormData();
            formData.append('imagemPerfil', file); 
            loader.style.display = 'flex';
            try {
                const userId = JSON.parse(sessionStorage.getItem('user')).id;
                const response = await fetch(`/usuarios/atualizar-imagem/${userId}`, {
                    method: 'PATCH', 
                    body: formData
                });

                if (response.ok) {
                    console.log('Imagem enviada com sucesso!');
                    await fetchProfileImage(); 
                    uploadButton.classList.remove('piscando');
                } else {
                    console.error('Falha ao enviar a imagem.');
                }
            } catch (error) {
                console.error('Erro ao enviar a imagem:', error);
            } finally {
            loader.style.display = 'none';
            }
        } else {
            console.error('Nenhum arquivo selecionado.');
        }
    });

    fileInput.addEventListener('change', function () {
        const file = fileInput.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            profileImage.src = imageUrl; 
            profileImage.classList.add('blur'); 
            profileImageHeader.src = imageUrl; 
            profileImageHeader.classList.add('blur'); 

            uploadButton.classList.add('piscando');
        }
    });

    fetchProfileImage();
});