document.addEventListener('DOMContentLoaded', function () {
    const profileTab = document.getElementById('shape1');
    const personalTab = document.getElementById('shape2');
    const companyTab = document.getElementById('shape3');
    const tabs = [profileTab, personalTab, companyTab];
    const profileData = document.getElementById('step1');
    const personalData = document.getElementById('step2');
    const companyData = document.getElementById('step3');
    const steps = [profileData, personalData, companyData];
    let currentStep = 0;

    const termsLink = document.getElementById('terms-link');
    const helpBtn = document.querySelector('.help-btn');
    const infoModal = document.getElementById('info-modal');
    const closeInfoModal = document.querySelector('#info-modal .close');

    function updateSteps() {
        steps.forEach((step, index) => {
            if (index === currentStep) {
                step.style.display = 'block';
                tabs[index].classList.remove('inactive');
            } else {
                step.style.display = 'none';
                tabs[index].classList.add('inactive');
            }
        });
    }

    function nextStep() {
        if (currentStep < steps.length - 1) {
                currentStep++;
                updateSteps();
        }
    }

    function prevStep() {
        if (currentStep > 0) {
            currentStep--;
            updateSteps();
        }
    }

    document.querySelectorAll('.continue-btn').forEach(btn => btn.addEventListener('click', nextStep));
    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', prevStep));

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

    const isRHCheckbox = document.getElementById('is-rh');
    
    isRHCheckbox.addEventListener('change', function () {
        if (this.checked) {
            // Redirecionar para a tela de cadastro do RH
            window.location = 'cadastro.html';
        }
    });


    let slideIndex = 0;
    const slides = document.querySelectorAll('.image');
    const dots = document.querySelectorAll('.dot');
    const leftArrow = document.querySelector('.arrow-left1');
    const rightArrow = document.querySelector('.arrow-right1');

    function showSlide(n) {
        if (n > slides.length) { slideIndex = 1 }
        if (n < 1) { slideIndex = slides.length }
        slides.forEach((slide, index) => {
            slide.style.display = (index + 1 === slideIndex) ? 'block' : 'none';
        });
        dots.forEach((dot, index) => {
            dot.className = dot.className.replace(' active', '');
            if (index + 1 === slideIndex) {
                dot.className += ' active';
            }
        });
    }

    function plusSlides(n) {
        showSlide(slideIndex += n);
    }

    leftArrow.addEventListener('click', function () {
        plusSlides(-1);
    });

    rightArrow.addEventListener('click', function () {
        plusSlides(1);
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', function () {
            currentSlide(index + 1);
        });
    });

    function currentSlide(n) {
        showSlide(slideIndex = n);
    }

    showSlide(slideIndex = 1);
});

async function fazerLogout() {
    const user = JSON.parse(sessionStorage.getItem('user'))

    try {
    
        const response = await fetch(`http://localhost:8080/usuarios/logoff?idUsuario=${user.id}`, {
            method: 'POST'
        })

      
        if (!response.ok) {
            throw new Error('Erro ao fazer logoff')
        }

        sessionStorage.clear()

        window.location.href = '/html/home.html'

    } catch (error) {
        console.error('Erro ao fazer logoff:', error)
        alert('Erro ao fazer logoff. Por favor, tente novamente.')
    }
} 
