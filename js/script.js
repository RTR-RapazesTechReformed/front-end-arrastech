document.addEventListener('DOMContentLoaded', function () {
    const profileTab = document.getElementById('shape1');
    const personalTab = document.getElementById('shape2');
    const tabs = [profileTab, personalTab];
    const profileData = document.getElementById('step1');
    const personalData = document.getElementById('step2');
    const continueBtn = document.querySelector('.continue-btn');
    const backBtn = document.querySelector('.back-btn');
    const profileCheck = document.getElementById('check1');
    const termsLink = document.getElementById('terms-link');
    const registerForm = document.querySelector('form');
    const cpfInput = document.getElementById('cpf');
    const helpBtn = document.querySelector('.help-btn');
    const infoModal = document.getElementById('info-modal');
    const closeInfoModal = document.querySelector('#info-modal .close');
    const isRHCheckbox = document.getElementById('is-rh');

    // Funções de validação
    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    function validarSenha(senha) {
        return senha.length >= 6;
    }

    function validarApelido(apelido) {
        const regex = /^\D+$/; // Apenas letras permitidas
        return regex.test(apelido);
    }

    function validarCampos(username, email, password) {
        if (!username || !email || !password){
            showAlert('error', 'Todos os campos devem ser preenchidos.');
            return false;
        }

        if (!validarApelido(username)) {
            showAlert('error', 'O apelido não pode conter números.');
            return false;
        }

        if (!validarEmail(email)) {
            showAlert('error', 'O email deve ser válido (ex: exemplo@dominio.com).');
            return false;
        }

        if (!validarSenha(password)) {
            showAlert('error', 'A senha deve ter pelo menos 6 dígitos.');
            return false;
        }

        return true;
    }

    function validarCamposEndereco(cep, rua, numero, cidade, bairro) {
        if (!cep || !rua || !numero || !cidade || !bairro) {
            showAlert('error', 'Todos os campos de endereço devem ser preenchidos.');
            return false;
        }
        return true;
    }

    function showAlert(type, message) {
        const alertContainer = document.createElement('div');
        alertContainer.className = `container_alerta ${type} show`;

        const alertTitle = document.createElement('span');
        alertTitle.className = 'titulo_alerta';
        alertTitle.textContent = type === 'error' ? 'Erro!' : 'Sucesso!';

        const alertText = document.createElement('span');
        alertText.className = 'texto_alerta';
        alertText.textContent = message;

        alertContainer.appendChild(alertTitle);
        alertContainer.appendChild(alertText);

        document.body.appendChild(alertContainer);

        setTimeout(() => {
            alertContainer.classList.remove('show');
            setTimeout(() => {
                alertContainer.remove();
            }, 500); // Tempo para garantir que a animação de saída aconteça
        }, 3000); // Tempo para o alerta permanecer visível
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            if (tab.id === 'shape2' && profileCheck.style.display !== 'flex') {
                showAlert('error', 'Preencha os dados do perfil antes de continuar.');
                return;
            }
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            profileData.style.display = tab.id === 'shape1' ? 'block' : 'none';
            personalData.style.display = tab.id === 'shape2' ? 'block' : 'none';
        });
    });

    continueBtn.addEventListener('click', function () {
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (validarCampos(username, email, password)) {
            profileTab.classList.remove('active');
            personalTab.classList.add('active');
            profileData.style.display = 'none';
            personalData.style.display = 'block';
            profileCheck.style.display = 'flex';
        } else {
            console.log('Continuando bloqueado: Informações de perfil ausentes ou inválidas.');
        }
    });

    backBtn.addEventListener('click', function () {
        profileTab.classList.add('active');
        personalTab.classList.remove('active');
        profileData.style.display = 'block';
        personalData.style.display = 'none';
    });

    termsLink.addEventListener('click', function () {
        const termsModal = document.getElementById('terms-modal');
        const closeTermsModal = document.querySelector('#terms-modal .close');

        termsModal.style.display = 'block';

        closeTermsModal.addEventListener('click', function () {
            termsModal.style.display = 'none';
        });

        window.addEventListener('click', function (event) {
            if (event.target == termsModal) {
                termsModal.style.display = 'none';
            }
        });
    });

    helpBtn.addEventListener('click', function () {
        infoModal.style.display = 'block';
    });

    closeInfoModal.addEventListener('click', function () {
        infoModal.style.display = 'none';
    });

    window.addEventListener('click', function (event) {
        if (event.target == infoModal) {
            infoModal.style.display = 'none';
        }
    });

    isRHCheckbox.addEventListener('change', function () {
        if (this.checked) {
            window.location = '/html/cadastro_rh.html';
        }
    });

    let slideIndex = 0;
    const slides = document.querySelectorAll('.image');
    const dots = document.querySelectorAll('.dot');
    const leftArrow = document.querySelector('.arrow-left1');
    const rightArrow = document.querySelector('.arrow-right1');

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.display = i === index ? 'block' : 'none';
            dots[i].classList.toggle('active', i === index);
        });
        slideIndex = index;
    }

    function nextSlide() {
        slideIndex = (slideIndex + 1) % slides.length;
        showSlide(slideIndex);
    }

    function previousSlide() {
        slideIndex = (slideIndex - 1 + slides.length) % slides.length;
        showSlide(slideIndex);
    }

    function checkScreenSize() {
        if (window.innerWidth < 768) {
            slides.forEach(slide => slide.style.display = 'none');
            dots.forEach(dot => dot.style.display = 'none');
            leftArrow.style.display = 'none';
            rightArrow.style.display = 'none';
        } else {
            showSlide(slideIndex); // Restores the current slide display
            dots.forEach(dot => dot.style.display = 'block');
            leftArrow.style.display = 'block';
            rightArrow.style.display = 'block';
        }
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => showSlide(index));
    });

    leftArrow.addEventListener('click', previousSlide);
    rightArrow.addEventListener('click', nextSlide);

    showSlide(slideIndex);
    checkScreenSize();

    setInterval(() => {
        nextSlide();
        checkScreenSize();
    }, 3000);

    window.addEventListener('resize', checkScreenSize);

    function formatarDataNascimento(data) {
        const opcoes = { year: 'numeric', month: 'long', day: 'numeric' };
        return data.toLocaleDateString('pt-BR', opcoes);
    }
});
