document.addEventListener('DOMContentLoaded', function () {
    carregarAlunos()
    carregarAlunosPorCurso()
})



async function carregarAlunos() {
    try {
        const response = await fetch('/usuarios/listar?tipo=Aluno')    
        if (response.ok) {
            const alunos = await response.json()
            const tabelaAlunos = document.getElementById('tabela-alunos')
            const totalAlunosElement = document.getElementById('total-alunos')
            const selectCidade = document.getElementById('select-cidade')
            const selectEscolaridade = document.getElementById('select-escolaridade')

            totalAlunosElement.textContent = alunos.length
            sessionStorage.setItem('totalAlunos', alunos.length);

            alunos.sort((a, b) => a.id - b.id)

            const sexoData = {}
            const etniaData = {}
            
            const cidades = new Set();
            const escolaridades = new Set();
            alunos.forEach(aluno => {
                const tr = document.createElement('tr')

                const idCell = document.createElement('td')
                idCell.textContent = aluno.id
                idCell.style.verticalAlign = 'middle'

                const imgCell = document.createElement('td')
                const imgElement = document.createElement('img')
                imgElement.id = `img-${aluno.id}`
                imgElement.alt = `Foto de ${aluno.primeiroNome}`
                imgElement.src = '/imgs/foto_padrao.png'
                imgElement.style.width = '50px'
                imgElement.style.height = '50px'
                imgElement.style.borderRadius = '100%'
                imgElement.style.objectFit = 'cover'
                imgCell.appendChild(imgElement)
                imgCell.style.verticalAlign = 'middle'

                const nomeCell = document.createElement('td')
                nomeCell.textContent = `${aluno.primeiroNome} ${aluno.sobrenome}`
                nomeCell.style.verticalAlign = 'middle'

                const emailCell = document.createElement('td')
                emailCell.textContent = aluno.email
                emailCell.style.verticalAlign = 'middle'

                const sexo = document.createElement('td')
                sexo.textContent = aluno.sexo
                sexo.style.verticalAlign = 'middle'

                const etnia = document.createElement('td')
                etnia.textContent = aluno.etnia
                etnia.style.verticalAlign = 'middle'

                const cidadeCell = document.createElement('td')
                cidadeCell.textContent = aluno.endereco.cidade
                cidadeCell.style.verticalAlign = 'middle'

                const escolaridadeCell = document.createElement('td')
                escolaridadeCell.textContent = aluno.escolaridade
                escolaridadeCell.style.verticalAlign = 'middle'

                const dataNascimentoCell = document.createElement('td')
                dataNascimentoCell.textContent = new Date(aluno.dataNascimento).toLocaleDateString('pt-BR')
                dataNascimentoCell.style.verticalAlign = 'middle'

                tr.appendChild(idCell)
                tr.appendChild(imgCell)
                tr.appendChild(nomeCell)
                tr.appendChild(emailCell)
                tr.appendChild(sexo)
                tr.appendChild(etnia)
                tr.appendChild(cidadeCell)
                tr.appendChild(escolaridadeCell)
                tr.appendChild(dataNascimentoCell)

                tabelaAlunos.appendChild(tr) 

                cidades.add(aluno.endereco.cidade);
                escolaridades.add(aluno.escolaridade);

                carregarImagemPerfil(aluno.id)

                sexoData[aluno.sexo] ? sexoData[aluno.sexo]++ : sexoData[aluno.sexo] = 1
                etniaData[aluno.etnia] ? etniaData[aluno.etnia]++ : etniaData[aluno.etnia] = 1
            })
            preencherSelect(selectCidade, Array.from(cidades))
            preencherSelect(selectEscolaridade, Array.from(escolaridades))

            gerarGraficos(sexoData, etniaData)
        } else {
            console.error('Erro ao carregar alunos:', response.statusText)
        }
    } catch (error) {
        console.error('Erro ao buscar os alunos:', error)
    }
}

async function carregarImagemPerfil(id) {
    const imgElement = document.getElementById(`img-${id}`)

    if (!imgElement) {
        console.error(`Elemento de imagem não encontrado para o id: ${id}`)
        return
    }

    try {
        const response = await fetch(`/usuarios/imagem/${id}`)
        if (response.ok) {
            const imageBlob = await response.blob()
            if (imageBlob.size > 0) {
                const imageUrl = URL.createObjectURL(imageBlob)
                imgElement.src = imageUrl
            } else {
                console.log(`Imagem não encontrada para o id: ${id}`)
            }
        } else {
            console.error('Erro ao buscar a imagem:', response.status, response.statusText)
        }
    } catch (error) {
        console.error('Erro ao buscar a imagem do perfil:', error)
    }
}

function gerarGraficoAlunosPorCurso(nomeCursos, quantidadeAlunos, coresCursos) {
    const ctxCursos = document.getElementById('alunosPorCurso').getContext('2d')
    const totalAlunosSalvo = parseInt(sessionStorage.getItem('totalAlunos'), 10);

    new Chart(ctxCursos, {
        type: 'bar',
        data: {
            labels: nomeCursos,
            datasets: [{
                label: 'Quantidade de Alunos',
                data: quantidadeAlunos,
                backgroundColor: coresCursos,
                borderWidth: 2
            }]
        },
        options: {
            responsive: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: "Distribuição por curso"
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: totalAlunosSalvo
                }
            }
        }
    })
}

async function carregarAlunosPorCurso() {
    try {
        const response = await fetch('/dashboardAdm/alunos-por-curso')
        if (response.ok) {
            const cursosData = await response.json()

            const nomeCursos = cursosData.map(curso => curso.nomeCurso)
            const quantidadeAlunos = cursosData.map(curso => curso.quantidadeAlunos)
            const coresCursos = gerarCores(cursosData.length);
            gerarGraficoAlunosPorCurso(nomeCursos, quantidadeAlunos, coresCursos)
        } else {
            console.error('Erro ao carregar alunos por curso:', response.statusText)
        }
    } catch (error) {
        console.error('Erro ao buscar os alunos por curso:', error)
    }
}

function gerarCores(quantidade) {
    const cores = [];
    for (let i = 0; i < quantidade; i++) {
        cores.push(`hsl(${Math.floor(Math.random() * 360)}, 100%, 75%)`);
    }
    return cores;
}

function gerarGraficos(sexoData, etniaData) {
    const ctxSexo = document.getElementById('distribuicaoPorSexo').getContext('2d')
    new Chart(ctxSexo, {
        type: 'doughnut',
        data: {
            labels: Object.keys(sexoData),
            datasets: [{
                label: 'Distribuição por Sexo',
                data: Object.values(sexoData),
                backgroundColor: ['#36A2EB', '#FF6384','#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                hoverBackgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                        },
                        color: '#333',
                    },
                },
            },
            layout: {
                padding: 20,
            },
        }
    })

    const ctxEtnia = document.getElementById('distribuicaoPorEtnia').getContext('2d')
    new Chart(ctxEtnia, {
        type: 'doughnut',
        data: {
            labels: Object.keys(etniaData),
            datasets: [{
                label: 'Distribuição por Etnia',
                data: Object.values(etniaData),
                backgroundColor: ['#36A2EB', '#FF6384','#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                hoverBackgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                        },
                        color: '#333',
                    },
                },
            },
            layout: {
                padding: 20,
            },
        }
    })
}

function preencherSelect(selectElement, valores) {

    selectElement.innerHTML = '<option value="">Todos</option>';
    valores.forEach(valor => {
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = valor;
        selectElement.appendChild(option);
    });
}

function filtrarAlunos() {
    const selectEscolaridade = document.getElementById('select-escolaridade').value
    const selectCidade = document.getElementById('select-cidade').value
    const selectSexo = document.getElementById('select-sexo').value
    const selectEtnia = document.getElementById('select-etnia').value
    const inputId = document.getElementById('input-id').value
    const inputNome = document.getElementById('input-nome').value.toLowerCase()
    const inputEmail = document.getElementById('input-email').value.toLowerCase()
    const inputIdadeMax = parseInt(document.getElementById('idade-max').value) || 150

    const tabelaAlunos = document.getElementById('tabela-alunos')
    const linhas = tabelaAlunos.getElementsByTagName('tr')

    for (let i = 0; i < linhas.length; i++) {
        const id = linhas[i].getElementsByTagName('td')[0].textContent
        const nome = linhas[i].getElementsByTagName('td')[2].textContent.toLowerCase()
        const email = linhas[i].getElementsByTagName('td')[3].textContent.toLowerCase()
        const sexo = linhas[i].getElementsByTagName('td')[4].textContent
        const etnia = linhas[i].getElementsByTagName('td')[5].textContent
        const cidade = linhas[i].getElementsByTagName('td')[6].textContent
        const escolaridade = linhas[i].getElementsByTagName('td')[7].textContent
        const dataNascimento = new Date(linhas[i].getElementsByTagName('td')[8].textContent.split('/').reverse().join('-'))
        const idade = calcularIdade(dataNascimento)

        const deveExibir = (
            (!selectEscolaridade || escolaridade === selectEscolaridade) &&
            (!selectCidade || cidade === selectCidade) &&
            (!selectSexo || sexo === selectSexo) &&
            (!selectEtnia || etnia === selectEtnia) &&
            (!inputId || id.includes(inputId)) &&
            (!inputNome || nome.includes(inputNome)) &&
            (!inputEmail || email.includes(inputEmail)) &&
            (idade <= inputIdadeMax)
        )
        linhas[i].style.display = deveExibir ? '' : 'none'
    }
}

function calcularIdade(dataNascimento) {
    const diffMs = Date.now() - dataNascimento.getTime()
    const diffDate = new Date(diffMs)
    return Math.abs(diffDate.getUTCFullYear() - 1970)
}

document.getElementById('select-escolaridade').addEventListener('change', filtrarAlunos)
document.getElementById('select-cidade').addEventListener('change', filtrarAlunos)
document.getElementById('select-sexo').addEventListener('change', filtrarAlunos)
document.getElementById('select-etnia').addEventListener('change', filtrarAlunos)
document.getElementById('input-id').addEventListener('input', filtrarAlunos)
document.getElementById('input-nome').addEventListener('input', filtrarAlunos)
document.getElementById('input-email').addEventListener('input', filtrarAlunos)
document.getElementById('idade-max').addEventListener('input', filtrarAlunos)
