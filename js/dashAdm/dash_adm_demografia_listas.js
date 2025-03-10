document.addEventListener('DOMContentLoaded', function () {
    listarEmpresas().then(dadosEmpresa => {
        const selectElement = document.getElementById('selectEmpresas')
        preencherEmpresa(selectElement, dadosEmpresa)
    })

    document.getElementById('selectEmpresas').addEventListener('change', function () {
        renderizarGraficos()
    })
    document.getElementById('selectListas').addEventListener('change', function () {
        renderizarGraficos()
    })

    document.getElementById('baixarRelatorio').addEventListener('click', gerarRelatorioAlunos)

    document.getElementById('btnEnviar').addEventListener('click', enviarArquivo)
    
    renderizarGraficos() 
 
})

let graficoSexo, graficoEtnia, graficoEscolaridade, graficoCidade, graficoCursos

async function listarEmpresas() {
    try {
        const resposta = await fetch('http://localhost:8080/empresa/listar')
        if (!resposta.ok) {
            throw new Error('Erro ao buscar os dados das empresas')
        }
        const dadosEmpresa = await resposta.json()
        return dadosEmpresa
    } catch (erro) {
        console.error('Erro ao buscar os dados das empresas:', erro)
        return null
    }
}

function preencherEmpresa(selectElement, dadosEmpresa) {
    selectElement.innerHTML = '<option value="">Incluir todas</option>'
    dadosEmpresa.forEach(empresa => {
        const option = document.createElement('option')
        option.value = empresa.id
        option.textContent = empresa.nomeEmpresa
        selectElement.appendChild(option)
    })
}

async function buscarDados() {
    try {
        const selectElementEmpresa = document.getElementById('selectEmpresas')
        const empresaId = selectElementEmpresa.value
        const selectLista = document.getElementById('selectListas')
        const tipoLista = selectLista.value

        let url = `http://localhost:8080/dashboardAdm/demografia-alunos?tipoLista=${tipoLista}`

        if (empresaId) {
            url += `&idEmpresa=${empresaId}`
        }

        const resposta = await fetch(url)
        if (!resposta.ok) {
            throw new Error('Erro ao buscar os dados de demografia')
        }
        const dados = await resposta.json()
        return dados
    } catch (erro) {
        console.error('Erro ao buscar os dados de demografia:', erro)
        return null
    }
}
async function gerarRelatorioEmpresas() {
    try {
        const selectElementEmpresa = document.getElementById('selectEmpresas')
        const empresaId = selectElementEmpresa.value
        const selectLista = document.getElementById('selectListas')
        const tipoLista = selectLista.value

        let url = `http://localhost:8080/dashboardAdm/relatorio-demografia-listas?tipoLista=${tipoLista}`

        if (empresaId) {
            url += `&idEmpresa=${empresaId}`
        }

        const resposta = await fetch(url)
        if (!resposta.ok) {
            throw new Error('Erro ao buscar o csv de demografia')
        }
        window.location.href = url
    } catch (erro) {
        console.error('Erro ao buscar o csv de demografia:', erro)
        return null
    }
}

function abrirModalRelatorio() {
    const modal = document.getElementById('relatorioModal');
    modal.style.display = 'flex'; 
}

function fecharModalRelatorio() {
    const modal = document.getElementById('relatorioModal');
    modal.style.display = 'none'; 
}

window.addEventListener('click', function (event) {
    const modal = document.getElementById('relatorioModal');
    if (event.target === modal) {
        fecharModalRelatorio();
    }
});

function abrirModalCadastro() {
    const modal = document.getElementById('cadastroModal');
    modal.style.display = 'flex'; 
}

function fecharModalCadastro() {
    const modal = document.getElementById('cadastroModal');
    modal.style.display = 'none';
}

window.addEventListener('click', function (event) {
    const modal = document.getElementById('cadastroModal');
    if (event.target === modal) {
        fecharModalCadastro();
    }
});



async function gerarRelatorioAlunos() {
    try {
        const sexo = document.getElementById('select-sexo').value
        const etnia = document.getElementById('select-etnia').value
        const idadeMaxima = document.getElementById('idade-max').value
        const cidade = document.getElementById('select-cidade').value
        const escolaridade = document.getElementById('select-escolaridade').value
        const arquivo = document.getElementById('select-arquivo').value 

        let url = `http://localhost:8080/dashboardAdm/relatorio-alunos?`

        if (sexo) url += `sexo=${sexo}&`
        if (etnia) url += `etnia=${etnia}&`
        if (idadeMaxima) url += `idadeMaxima=${idadeMaxima}&`
        if (cidade) url += `cidade=${cidade}&`
        if (escolaridade) url += `escolaridade=${escolaridade}&`
        if (arquivo) url += `arquivo=${arquivo}`

        const resposta = await fetch(url, { method: 'GET' })

        if (!resposta.ok) {
            throw new Error('Erro ao gerar o relatório de alunos')
        }

     
        const blob = await resposta.blob()
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = `relatorio-alunos.${arquivo}`
        link.click()
    } catch (erro) {
        console.error('Erro ao gerar o relatório de alunos:', erro)
    }
}

async function enviarArquivo() {
    const arquivoInput = document.getElementById('arquivo')
    const arquivo = arquivoInput.files[0]; 

    if (!arquivo) {
        alert('Por favor, selecione um arquivo CSV ou TXT!')
        return
    }

    const formData = new FormData()
    formData.append('file', arquivo)

    try {
    
        const response = await fetch('http://localhost:8080/dashboardAdm/cadastrar-alunos-lote', {
            method: 'POST',
            body: formData
        })


        if (response.ok) {
            const data = await response.json()
            alert('Arquivo enviado com sucesso! ' + (data.message || ''))
          
            $('#cadastroModal').modal('hide')
        } else {
            const errorData = await response.json()
            alert('Erro ao enviar o arquivo: ' + (errorData.message || 'Erro desconhecido'))
        }
    } catch (error) {
      
        console.error('Erro ao enviar o arquivo:', error)
        alert('Erro ao enviar o arquivo. Por favor, tente novamente.')
    }
}


function destruirGraficos() {
    if (graficoSexo) graficoSexo.destroy()
    if (graficoEtnia) graficoEtnia.destroy()
    if (graficoEscolaridade) graficoEscolaridade.destroy()
    if (graficoCidade) graficoCidade.destroy()
    if (graficoCursos) graficoCursos.destroy()
}

function criarGraficoRosca(ctx, rotulos, dados, titulo) {
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: rotulos,
            datasets: [{
                label: titulo,
                data: dados,
                backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                hoverBackgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: titulo
                }
            }
        }
    })
}

function criarGraficoBarras(ctx, rotulos, dados, titulo, cores) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rotulos,
            datasets: [{
                label: titulo,
                data: dados,
                backgroundColor: cores
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: titulo
                }
            }
        }
    })
}

function gerarCores(quantidade) {
    const cores = []
    for (let i = 0; i < quantidade; i++) {
        cores.push(`hsl(${Math.floor(Math.random() * 360)}, 100%, 75%)`)
    }
    return cores
}

async function renderizarGraficos() {
    destruirGraficos() 

    const dadosRecebidos = await buscarDados()

    if (dadosRecebidos) {
        const rotulosSexo = Object.keys(dadosRecebidos.sexo)
        const dadosSexo = Object.values(dadosRecebidos.sexo)
        const ctxSexo = document.getElementById('distribuicaoPorSexoListas').getContext('2d')
        graficoSexo = criarGraficoRosca(ctxSexo, rotulosSexo, dadosSexo, 'Distribuição por Sexo')

        const rotulosEtnia = Object.keys(dadosRecebidos.etnia)
        const dadosEtnia = Object.values(dadosRecebidos.etnia)
        const ctxEtnia = document.getElementById('distribuicaoPorEtniaListas').getContext('2d')
        graficoEtnia = criarGraficoRosca(ctxEtnia, rotulosEtnia, dadosEtnia, 'Distribuição por Etnia')

        const rotulosEscolaridade = Object.keys(dadosRecebidos.escolaridade)
        const dadosEscolaridade = Object.values(dadosRecebidos.escolaridade)
        const ctxEscolaridade = document.getElementById('distribuicaoPorEscolaridadeListas').getContext('2d')
        graficoEscolaridade = criarGraficoRosca(ctxEscolaridade, rotulosEscolaridade, dadosEscolaridade, 'Distribuição por Escolaridade')

        const rotulosCidade = Object.keys(dadosRecebidos.cidade)
        const dadosCidade = Object.values(dadosRecebidos.cidade)
        const ctxCidade = document.getElementById('alunosPorCidade').getContext('2d')
        const coresCidade = gerarCores(rotulosCidade.length)
        graficoCidade = criarGraficoBarras(ctxCidade, rotulosCidade, dadosCidade, 'Distribuição por Cidade', coresCidade)

        const rotulosCursos = Object.keys(dadosRecebidos.cursosFeitos)
        const dadosCursos = Object.values(dadosRecebidos.cursosFeitos)
        const ctxCursos = document.getElementById('CursosLista').getContext('2d')
        const coresCursos = gerarCores(rotulosCursos.length)
        graficoCursos = criarGraficoBarras(ctxCursos, rotulosCursos, dadosCursos, 'Distribuição de Cursos Feitos', coresCursos)
    } else {
        console.error('Nenhum dado encontrado!')
    }
}
