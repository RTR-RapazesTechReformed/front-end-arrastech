import { obterMedalha } from './medalhas.js';
window.verMais = verMais
window.desfavoritar = desfavoritar
window.tenhoInteresse = tenhoInteresse
window.fecharVerMais = fecharVerMais
window.fecharVerMais_img = fecharVerMais_img
window.fecharNotificacao = fecharNotificacao
window.alunoRemovido = alunoRemovido
window.buscarAlunoPorNome = buscarAlunoPorNome
window.exibirAlunosPorSexo = exibirAlunosPorSexo
window.exibirAlunosPorEtnia = exibirAlunosPorEtnia

const loader = document.querySelector('.container_loader');

sessionStorage.removeItem('itemStatus');

document.addEventListener('DOMContentLoaded', async function () {
    await carregarCategorias();
    await atualizarAlunos();

    const cursosSelect = document.getElementById('cursos');
    cursosSelect.addEventListener('change', exibirCursosPorCategoria);
});

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.blocos_selecao select').forEach(select => {
        select.addEventListener('change', function () {
            clearOtherSelects(this);
        });
    });
});

function clearOtherSelects(currentSelect) {
    const selects = document.querySelectorAll('.blocos_selecao select');

    selects.forEach(select => {
        if (select !== currentSelect) {
            select.selectedIndex = 0;
        }
    });
}


async function carregarCategorias() {
    loader.style.display = 'flex';

    try {
        const response = await fetch('/dashboardRecrutador/listar');
        const data = await response.json();

        const categoriasSet = new Set();

        data.forEach((curso) => {
            if (curso.categorias) {
              curso.categorias
                .split(",")
                .map((cat) => cat.trim())
                .forEach((cat) => categoriasSet.add(cat));
            }
          });
      

        const categoriasSelect = document.getElementById('cursos');
        categoriasSelect.innerHTML = '<option value="opc_categorias">Categorias</option>';

        categoriasSet.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoriasSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar as categorias:', error);
    } finally {
        loader.style.display = 'none';
    }
}

async function exibirCursosPorCategoria() {
    
    loader.style.display = 'flex';
    const categoria = this.value;

    if (categoria === 'opc_categorias') {
        location.reload();
        return;
    }

    try {
        const response = await fetch(`/dashboardRecrutador/listar?categoria=${categoria}`);
        const data = await response.json();

        const containerCursos = document.getElementById('cursos_container');
        containerCursos.innerHTML = '';

        const cursosEmbaralhados = shuffleArray(data);

        cursosEmbaralhados.forEach(async (curso, index) => {
            if (index > 0) {
                const espacoDiv = document.createElement('div');
                espacoDiv.className = 'container_espacamento';
                espacoDiv.innerHTML = `
                    <div class="bloco_espacamento"></div>
                `;
                containerCursos.appendChild(espacoDiv);
            }

            const cursoDiv = document.createElement('div');
            cursoDiv.innerHTML = `
                <div class="container_curso_imagem_nome">
                    <div class="bloco_nome_imagem_curso">
                        <h1 id="nome_curso_${curso.id}">${curso.nome}</h1>
                    </div>
                </div>
                <div id="bloco_alunos_${curso.id}" class="bloco_alunos"></div>
            `;

            containerCursos.appendChild(cursoDiv);
            await exibirAlunosDoCurso(curso);

        });

    } catch (error) {
        console.error('Erro ao carregar os cursos por categoria:', error);
    } finally {
        loader.style.display = 'none';
    }
}

async function exibirAlunosDoCurso(curso) {
    
    loader.style.display = 'flex';
    try {
        const alunosResponse = await fetch(`/pontuacoes/alunos`);
        const dadosAlunos = await alunosResponse.json();
        const alunosCurso = dadosAlunos[curso.id]?.ranking || [];

        const idUsuarioLogado = getIdUsuarioLogado();

        const interessadosResponse = await fetch(`/dashboardRecrutador/${idUsuarioLogado}/listar/interessados`);
        const interessadosData = await interessadosResponse.json();
        const idsInteressados = interessadosData.map(aluno => aluno.id);

        const processoSeletivoResponse = await fetch(`/dashboardRecrutador/${idUsuarioLogado}/listar/processoSeletivo`);
        const processoSeletivoData = await processoSeletivoResponse.json();
        const idsProcessoSeletivo = processoSeletivoData.map(aluno => aluno.id);

        const contratadosResponse = await fetch(`/dashboardRecrutador/${idUsuarioLogado}/listar/contratados`);
        const contratadosData = await contratadosResponse.json();
        const idsContratados = contratadosData.map(aluno => aluno.id);

        const favoritosResponse = await fetch(`/dashboardRecrutador/${idUsuarioLogado}/listar/favoritos`);
        const favoritosData = await favoritosResponse.json();
        const idsFavoritos = favoritosData.map(aluno => aluno.id);

        const blocoAlunos = document.getElementById(`bloco_alunos_${curso.id}`);

        blocoAlunos.style.display = 'flex';
        blocoAlunos.style.alignItems = 'center';
        blocoAlunos.style.justifyContent = 'center';
        blocoAlunos.style.margin = '0 auto';

        let mensagemDiv = blocoAlunos.querySelector('.mensagem');
        if (!mensagemDiv) {
            mensagemDiv = document.createElement('div');
            mensagemDiv.className = 'mensagem';
            mensagemDiv.style.margin = '20px 0';
            mensagemDiv.style.fontWeight = 800;
            mensagemDiv.style.fontSize = '20px';
            mensagemDiv.style.color = '#808080';
            mensagemDiv.style.display = 'none';
            blocoAlunos.appendChild(mensagemDiv);
        }

        if (alunosCurso.length === 0) {
            mensagemDiv.textContent = 'Não há alunos para exibir neste curso.';
            mensagemDiv.style.display = 'flex';
            return;
        } else {
            mensagemDiv.style.display = 'none';
        }

        let alunosExibidos = 0;

        for (const alunoObj of alunosCurso) {
            const aluno = alunoObj.aluno;

            const isInterested = idsInteressados.includes(aluno.id);
            const isHired = idsContratados.includes(aluno.id);
            const isInProcess = idsProcessoSeletivo.includes(aluno.id);
            const isFavorite = idsFavoritos.includes(aluno.id);

            if (isInterested || isHired || isInProcess) {
                continue;
            }

            alunosExibidos++;
            const medalha = obterMedalha(alunoObj.pontosTotais);
            const alunoDiv = document.createElement('div');
            alunoDiv.className = 'box_Aluno';

            if (isFavorite) {
                alunoDiv.style.border = '2px solid yellow';
            }

            alunoDiv.innerHTML = `
                <span>${aluno.primeiroNome} ${aluno.sobrenome}</span>
                <span>Aluno finalizou curso <a>${curso.nome}</a> com ${alunoObj.pontosTotais} pontos</span>
                <img src="../imgs/${medalha}" alt="medalha">
                <button onclick="verMais(${aluno.id})">Ver mais</button>
            `;

            blocoAlunos.appendChild(alunoDiv);
        }

        if (alunosExibidos === 0) {
            mensagemDiv.textContent = 'Todos os alunos deste curso já foram visualizados.';
            mensagemDiv.style.display = 'flex';
        }

    } catch (error) {
        console.error('Erro ao carregar os dados dos alunos:', error);
    } finally {
        loader.style.display = 'none';
    }
}

async function atualizarAlunos() {
    
    loader.style.display = 'flex';
    try {
        const idUsuarioLogado = getIdUsuarioLogado();

        const interessadosResponse = await fetch(`/dashboardRecrutador/${idUsuarioLogado}/listar/interessados`);
        const interessadosData = await interessadosResponse.json();
        const idsInteressados = interessadosData.map(aluno => aluno.id);

        const processoSeletivoResponse = await fetch(`/dashboardRecrutador/${idUsuarioLogado}/listar/processoSeletivo`);
        const processoSeletivoData = await processoSeletivoResponse.json();
        const idsProcessoSeletivo = processoSeletivoData.map(aluno => aluno.id);

        const contratadosResponse = await fetch(`/dashboardRecrutador/${idUsuarioLogado}/listar/contratados`);
        const contratadosData = await contratadosResponse.json();
        const idsContratados = contratadosData.map(aluno => aluno.id);

        const favoritosResponse = await fetch(`/dashboardRecrutador/${idUsuarioLogado}/listar/favoritos`);
        const favoritosData = await favoritosResponse.json();
        const idsFavoritos = favoritosData.map(aluno => aluno.id);

        const cursosResponse = await fetch('/pontuacoes/alunos');
        const data = await cursosResponse.json();

        const containerCursos = document.getElementById('cursos_container');
        if (!containerCursos) {
            console.error('Contêiner de cursos não encontrado.');
            return;
        }

        containerCursos.innerHTML = '';

        const cursoIds = Object.keys(data);
        const cursosEmbaralhados = shuffleArray(cursoIds);

        for (let i = 0; i < cursosEmbaralhados.length; i++) {
            const cursoId = cursosEmbaralhados[i];
            const curso = data[cursoId];

            const cursoDiv = document.createElement('div');
            cursoDiv.innerHTML = `
                <div class="container_curso_imagem_nome">
                    <div class="bloco_nome_imagem_curso">
                        <h1 id="nome_curso_${cursoId}">${curso.nomeCurso}</h1>
                    </div>
                </div>

                <div class="container_fundo_aluno">
                    <div id="bloco_alunos_${cursoId}" class="bloco_alunos">
                        <!-- Alunos serão adicionados aqui -->
                    </div>
                </div>
            `;

            containerCursos.appendChild(cursoDiv);

            let alunos = curso.ranking;
            alunos = shuffleArray(alunos);

            const blocoAlunos = document.getElementById(`bloco_alunos_${cursoId}`);

            if (!blocoAlunos) {
                console.error(`Bloco de alunos para o curso ${cursoId} não encontrado.`);
                continue;
            }

            const alunosExibidos = [];
            const alunosParaExibir = [];

            for (const aluno of alunos) {
                if (!idsInteressados.includes(aluno.aluno.id) &&
                    !idsProcessoSeletivo.includes(aluno.aluno.id) &&
                    !idsContratados.includes(aluno.aluno.id)) {
                    alunosParaExibir.push(aluno);
                }
            }

            if (alunosParaExibir.length > 0) {
                blocoAlunos.style.width = '70%';
                blocoAlunos.style.minHeight = '100px';
                blocoAlunos.style.display = 'flex';
                blocoAlunos.style.flexWrap = 'nowrap';
                blocoAlunos.style.justifyContent = 'center';
                blocoAlunos.style.alignItems = 'center';
                blocoAlunos.style.gap = '10px';
                blocoAlunos.style.padding = '10px';

                if (alunosParaExibir.length > 3) {
                    blocoAlunos.style.overflowY = 'auto';
                    blocoAlunos.style.maxHeight = '400vh';
                    blocoAlunos.style.justifyContent = 'flex-start';
                    blocoAlunos.style.alignItems = 'flex-start';
                } else {
                    blocoAlunos.style.overflowY = 'hidden';
                    blocoAlunos.style.maxHeight = 'none';
                }

                for (const aluno of alunosParaExibir) {
                    const alunoDiv = document.createElement('div');
                    alunoDiv.className = 'box_Aluno';

                    alunoDiv.style.backgroundColor = '#ffffff';
                    alunoDiv.style.border = '3px solid #ddd';
                    alunoDiv.style.borderRadius = '10px';
                    alunoDiv.style.boxShadow = '0 8px 8px rgba(0, 0, 0, 0.267)';
                    alunoDiv.style.width = '250px';
                    alunoDiv.style.flexShrink = '0';
                    alunoDiv.style.padding = '20px';
                    alunoDiv.style.margin = '10px';
                    alunoDiv.style.display = 'flex';
                    alunoDiv.style.flexDirection = 'column';
                    alunoDiv.style.alignItems = 'center';
                    alunoDiv.style.position = 'relative';
                    alunoDiv.style.color = '#244aa5';

                    if (idsFavoritos.includes(aluno.aluno.id)) {
                        alunoDiv.style.border = '2px solid yellow';
                    }

                    const medalhaTipo = obterMedalha(aluno.pontosTotais);

                    alunoDiv.innerHTML = `
                        <span>${aluno.aluno.primeiroNome} ${aluno.aluno.sobrenome}</span>
                        <span>Aluno do projeto arrastão, finalizou curso <a>${curso.nomeCurso}</a> com ${aluno.pontosTotais} pontos</span>
                        <img src="../imgs/${medalhaTipo}" alt="medalha">
                        <button onclick="verMais(${aluno.aluno.id})">Ver mais</button>
                    `;

                    blocoAlunos.appendChild(alunoDiv);
                    alunosExibidos.push(aluno.aluno.id);
                }

                if (alunosExibidos.length === 0) {
                    const mensagem = document.createElement('div');
                    mensagem.className = 'mensagem_no_alunos';
                    mensagem.innerText = 'Todos os alunos desse curso já foram visualizados.';
                    blocoAlunos.appendChild(mensagem);
                }
            } else {
                const mensagem = document.createElement('div');
                mensagem.className = 'mensagem_no_alunos';
                mensagem.innerText = 'Nenhum aluno disponível para este curso.';
                blocoAlunos.appendChild(mensagem);
            }

            if (i < cursosEmbaralhados.length - 1) {
                const espacoDiv = document.createElement('div');
                espacoDiv.className = 'container_espacamento';
                espacoDiv.innerHTML = `
                    <div class="bloco_espacamento"></div>
                `;
                containerCursos.appendChild(espacoDiv);
            }
        }

    } catch (error) {
        console.error('Erro ao carregar os dados:', error);
    } finally {
        loader.style.display = 'none';
    }
}


function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

function alunoRemovido() {
    atualizarAlunos();
}

async function verMais(alunoId) {
    
    loader.style.display = 'flex';
    try {
        const idUsuarioLogado = getIdUsuarioLogado();

        const response = await fetch(`/usuarios/buscar/${alunoId}`);
        const aluno = await response.json();

        const nomeAluno = `${aluno.primeiroNome} ${aluno.sobrenome}`;

        document.getElementById('nome_do_aluno').innerText = nomeAluno;
        const idade = calcularIdade(aluno.dataNascimento);
        document.getElementById('idade_do_aluno').innerText = `${idade} anos`;
        document.getElementById('municipio_do_aluno').innerText = aluno.endereco.cidade;
        document.getElementById('escolaridade_do_aluno').innerText = aluno.escolaridade;
        document.getElementById('email_do_aluno').innerText = aluno.email;
        document.getElementById('descricao_do_aluno').innerText = aluno.descricao;

        const imgElement = document.querySelector('.bloco_foto_aluno img');
        const fotoResponse = await fetch(`/usuarios/imagem/${alunoId}`);
        if (fotoResponse.ok) {
            const blob = await fotoResponse.blob();
            const fotoUrl = URL.createObjectURL(blob);
            imgElement.src = fotoUrl;
        } else {
            imgElement.src = '/imgs/foto_padrao.png';
        }

        const emblemasResponse = await fetch(`/pontuacoes/pontos-totais/${alunoId}`);
        const emblemasData = await emblemasResponse.json();

        const emblemasContainer = document.querySelector('.container_emblemas');
        emblemasContainer.innerHTML = '';

        const blocoEmblemas = document.createElement('div');
        blocoEmblemas.classList.add('bloco_emblemas');

        for (const key in emblemasData) {
            const emblema = emblemasData[key];
            const pontos = emblema.pontosTotais;

            const emblemaTipo = obterMedalha(pontos);

            const emblemaElement = document.createElement('div');
            emblemaElement.classList.add('box_emblemas');
            emblemaElement.innerHTML = `<img src="/imgs/${emblemaTipo}" alt="${emblema.nomeCurso}">`;
            blocoEmblemas.appendChild(emblemaElement);
        }

        emblemasContainer.appendChild(blocoEmblemas);

        const blocoInfoAluno = document.querySelector('.bloco_info_aluno');
        const containerBotaoInteresse = document.querySelector('.bloco_botao_interesse');

        blocoInfoAluno.innerHTML = `
            <h1 id="nome_do_aluno">${nomeAluno}</h1>
            <span>Idade: <span id="idade_do_aluno">${idade}</span> anos</span>
            <span>Município: <span id="municipio_do_aluno">${aluno.endereco.cidade}</span></span>
            <span>Escolaridade: <span id="escolaridade_do_aluno">${aluno.escolaridade}</span></span>
            <span>Email: <span id="email_do_aluno">${aluno.email}</span></span>
        `;

        const favoritosResponse = await fetch(`/dashboardRecrutador/${idUsuarioLogado}/listar/favoritos`);
        const favoritosData = await favoritosResponse.json();

        const favoritarButton = document.createElement('button');
        favoritarButton.classList.add('favoritar-btn');

        const alunoFavoritado = favoritosData.some(favorito => favorito.id === alunoId);

        if (alunoFavoritado) {
            favoritarButton.innerHTML = `Desfavoritar <img src="/imgs/coracao_favoritar.png" alt="Desfavoritar">`;
            favoritarButton.style.backgroundColor = 'red';
            favoritarButton.style.width = '50%'
            favoritarButton.onclick = () => desfavoritar(alunoId, favoritarButton);
        } else {
            favoritarButton.innerHTML = `Favoritar <img src="../imgs/coracao_favoritar.png" alt="Favoritar">`;
            favoritarButton.onclick = () => favoritar(alunoId, favoritarButton);
        }

        blocoInfoAluno.appendChild(favoritarButton);

        const interesseButton = document.createElement('button');
        interesseButton.innerText = 'Tenho Interesse';
        interesseButton.onclick = () => tenhoInteresse(alunoId, interesseButton, nomeAluno);

        containerBotaoInteresse.innerHTML = '';
        containerBotaoInteresse.appendChild(interesseButton);

        document.querySelector('.container_ver_mais').style.display = 'block';

    } catch (error) {
        console.error('Erro ao buscar os detalhes do aluno:', error);
    } finally {
        loader.style.display = 'none';
    }
}

async function favoritar(alunoId, favoritarButton) {
    
    loader.style.display = 'flex';
    const idUsuarioLogado = getIdUsuarioLogado();
    try {
        const response = await fetch(`/dashboardRecrutador/${idUsuarioLogado}/favoritos/${alunoId}`, {
            method: 'POST'
        });

        if (response.ok) {
            sessionStorage.setItem('itemStatus', 'favoritado');
            favoritarButton.innerHTML = `Desfavoritar <img src="/imgs/coracao_favoritar.png" alt="Desfavoritar">`;
            favoritarButton.style.backgroundColor = 'red';
            favoritarButton.style.width = '50%';
            favoritarButton.classList.add('favoritado');
            favoritarButton.onclick = () => desfavoritar(alunoId, favoritarButton);

            const boxAluno = document.querySelector(`.box_aluno[data-aluno-id="${alunoId}"]`);
            if (boxAluno) {
                boxAluno.style.border = '2px solid #FFBF00';
            }
        } else {
            console.error(`Box do aluno com ID ${alunoId} não encontrada.`);
        }
    } catch (error) {
        console.error('Erro ao favoritar o aluno:', error);
    } finally {
        loader.style.display = 'none';
    }
}

async function desfavoritar(alunoId, favoritarButton) {
    
    loader.style.display = 'flex';
    const idUsuarioLogado = getIdUsuarioLogado();
    try {
        const response = await fetch(`/dashboardRecrutador/${idUsuarioLogado}/favoritos/${alunoId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            sessionStorage.setItem('itemStatus', 'desfavoritado');
            favoritarButton.innerHTML = `Favoritar <img src="../imgs/coracao_favoritar.png" alt="Favoritar">`;
            favoritarButton.classList.remove('favoritado');
            favoritarButton.style.width = '43%';
            favoritarButton.style.backgroundColor = '#244aa5';
            favoritarButton.onclick = () => favoritar(alunoId, favoritarButton);
            const boxAluno = document.querySelector(`.box_aluno[data-aluno-id="${alunoId}"]`);
            if (boxAluno) {
                boxAluno.style.border = '2px solid #DDDDDD';
            }
        } else {
            alert('Falha ao desfavoritar o aluno.');
        }
    } catch (error) {
        console.error('Erro ao desfavoritar o aluno:', error);
    } finally {
        loader.style.display = 'none';
    }
}

function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }

    return idade;
}

function getIdUsuarioLogado() {
    const data = JSON.parse(sessionStorage.getItem('user'))

    return data.id;
}

function fecharVerMais() {
    document.querySelector('.container_ver_mais').style.display = 'none';
}

function fecharVerMais_img() {
    document.querySelector('.container_ver_mais').style.display = 'none';

    const itemStatus = sessionStorage.getItem('itemStatus');

    if (itemStatus) {
        sessionStorage.removeItem('itemStatus');
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

async function tenhoInteresse(alunoId, interesseButton, nomeAluno) {
    const idUsuarioLogado = getIdUsuarioLogado();
    
    loader.style.display = 'flex';

    try {
        const response = await fetch(`/dashboardRecrutador/${idUsuarioLogado}/interessados/${alunoId}`, {
            method: 'POST'
        });

        if (response.ok) {
            const containerInteresse = document.querySelector(".container_interesse");
            const nomeAlunoSpan = document.querySelector(".nome_do_aluno_mensagem");

            if (containerInteresse && nomeAlunoSpan) {
                if (nomeAluno) {
                    fecharVerMais()
                    nomeAlunoSpan.textContent = nomeAluno;
                    containerInteresse.style.display = 'block';
                } else {
                    console.error('Erro: nomeAluno está undefined');
                }
            } else {
                console.error('Erro: elementos de notificação não encontrados no DOM');
            }
        } else {
            alert('Falha ao marcar interesse.');
        }
    } catch (error) {
        console.error('Erro ao marcar interesse no aluno:', error);
    } finally {
        loader.style.display = 'none';
    }
}

function fecharNotificacao() {
    document.querySelector('.container_interesse').style.display = 'none';
    location.reload();
}

document.addEventListener('DOMContentLoaded', async function () {
    
    loader.style.display = 'flex';
    try {
        const response = await fetch('/usuarios/listar');
        const data = await response.json();

        const municipioSelect = document.getElementById('municipio');
        municipioSelect.innerHTML = '<option value="opc_municipio">Cidade</option>';

        const cidades = new Set();

        data.forEach(usuario => {
            if (usuario.tipoUsuario === "Aluno" && usuario.endereco) {
                cidades.add(usuario.endereco.cidade);
            }
        });

        cidades.forEach(cidade => {
            const option = document.createElement('option');
            option.value = cidade.toLowerCase().replace(/\s+/g, '_');
            option.textContent = cidade;
            municipioSelect.appendChild(option);
        });

        municipioSelect.addEventListener('change', async function () {
            const cidadeSelecionada = this.value;

            if (cidadeSelecionada === 'opc_municipio') {
                location.reload();
            } else {
                await exibirAlunosPorCidade(cidadeSelecionada);
            }
        });

    } catch (error) {
        console.error('Erro ao carregar os dados dos usuários:', error);
    } finally {
        loader.style.display = 'none';
    }
});

async function exibirAlunosPorCidade(cidadeSelecionada) {
    
    loader.style.display = 'flex';
    try {
        const [pontuacoesResponse, usuariosResponse, interessadosResponse, contratadosResponse, processoSeletivoResponse, favoritosResponse] = await Promise.all([
            fetch(`/pontuacoes/ranking`),
            fetch('/usuarios/listar'),
            fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/interessados`),
            fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/contratados`),
            fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/processoSeletivo`),
            fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/favoritos`)
        ]);

        const [pontuacoesData, usuariosData, interessadosData, contratadosData, processoSeletivoData, favoritosData] = await Promise.all([
            pontuacoesResponse.json(),
            usuariosResponse.json(),
            interessadosResponse.json(),
            contratadosResponse.json(),
            processoSeletivoResponse.json(),
            favoritosResponse.json()
        ]);

        const containerCursos = document.getElementById('cursos_container');
        containerCursos.innerHTML = '';
        containerCursos.style.display = 'block';
        containerCursos.style.justifyContent = '';
        containerCursos.style.alignItems = '';
        containerCursos.style.height = '';

        const usuariosMap = usuariosData.reduce((map, usuario) => {
            if (usuario.tipoUsuario === "Aluno" && usuario.endereco) {
                map[usuario.id] = {
                    cidade: usuario.endereco.cidade,
                    nome: `${usuario.primeiroNome} ${usuario.sobrenome}`
                };
            }
            return map;
        }, {});

        const interessadosSet = new Set(interessadosData.map(interessado => interessado.id));
        const contratadosSet = new Set(contratadosData.map(contratado => contratado.id));
        const processoSeletivoSet = new Set(processoSeletivoData.map(aluno => aluno.id));
        const favoritosSet = new Set(favoritosData.map(favorito => favorito.id));

        const alunosPorCurso = Object.entries(pontuacoesData).reduce((acc, [cursoId, curso]) => {
            const alunosFiltrados = curso.ranking?.filter(aluno => {
                const alunoId = aluno.aluno.id;
                const cidadeDoAluno = usuariosMap[alunoId]?.cidade;

                return cidadeDoAluno &&
                    cidadeDoAluno.toLowerCase() === cidadeSelecionada.toLowerCase().replace(/_/g, ' ') &&
                    !interessadosSet.has(alunoId) &&
                    !contratadosSet.has(alunoId) &&
                    !processoSeletivoSet.has(alunoId);
            }) || [];

            if (alunosFiltrados.length > 0) {
                acc[curso.nomeCurso] = acc[curso.nomeCurso] || [];
                acc[curso.nomeCurso].push(...alunosFiltrados);
            }
            return acc;
        }, {});

        if (Object.keys(alunosPorCurso).length === 0) {
            const noResultsMessage = document.createElement('div');
            noResultsMessage.innerText = `Nenhum aluno encontrado na cidade ${cidadeSelecionada}.`;
            noResultsMessage.className = 'mensagem_nenhum_aluno';
            noResultsMessage.style.textAlign = 'center';
            noResultsMessage.style.margin = '20px 0';
            noResultsMessage.style.fontWeight = '800';
            noResultsMessage.style.fontSize = '20px';
            noResultsMessage.style.color = '#808080';

            containerCursos.style.display = 'flex';
            containerCursos.style.justifyContent = 'center';
            containerCursos.style.alignItems = 'center';
            containerCursos.style.height = '20vh';

            containerCursos.appendChild(noResultsMessage);
            return;
        }

        Object.entries(alunosPorCurso).forEach(([curso, alunos], index) => {
            const cursoDiv = document.createElement('div');
            cursoDiv.innerHTML = `
                <div class="container_curso_imagem_nome">
                    <div class="bloco_nome_imagem_curso">
                        <h1>${curso}</h1>
                    </div>
                </div>
                <div class="container_fundo_aluno">
                    <div id="bloco_alunos_${curso}" class="bloco_alunos"></div>
                </div>
            `;
            containerCursos.appendChild(cursoDiv);

            const blocoAlunos = document.getElementById(`bloco_alunos_${curso}`);
            alunos.forEach(aluno => {
                const medalha = obterMedalha(aluno.pontosTotais);

                const alunoDiv = document.createElement('div');
                alunoDiv.className = 'box_Aluno' + (favoritosSet.has(aluno.aluno.id) ? ' aluno-favorito' : '');
                alunoDiv.innerHTML = `
                    <span>${aluno.aluno.primeiroNome} ${aluno.aluno.sobrenome}</span>
                    <span>Aluno do projeto arrastão, finalizou curso <a>${curso}</a> com ${aluno.pontosTotais} pontos</span>
                    <img src="../imgs/${medalha}" alt="medalha">
                    <button onclick="verMais(${aluno.aluno.id})">Ver mais</button>
                `;
                blocoAlunos.appendChild(alunoDiv);
            });

            if (index < Object.keys(alunosPorCurso).length - 1) {
                const espacoDiv = document.createElement('div');
                espacoDiv.className = 'container_espacamento';
                espacoDiv.innerHTML = `<div class="bloco_espacamento"></div>`;
                containerCursos.appendChild(espacoDiv);
            }
        });

    } catch (error) {
        console.error('Erro ao carregar os dados dos alunos:', error);
    } finally {
        loader.style.display = 'none';
    }
}

const style = document.createElement('style');
style.innerHTML = `
    .aluno-favorito {
        border: 2px solid yellow; /* Define a borda amarela */
        padding: 10px; /* Adiciona um pouco de espaço interno */
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', async function () {
    
    loader.style.display = 'flex';
    try {
        const response = await fetch('/usuarios/listar');
        const data = await response.json();

        const escolaridadeSelect = document.getElementById('escolaridade');
        escolaridadeSelect.innerHTML = '<option value="opc_escolaridade">Escolaridade</option>';

        const escolaridades = new Set();

        data.forEach(usuario => {
            if (usuario.tipoUsuario === "Aluno" && usuario.escolaridade) {
                escolaridades.add(usuario.escolaridade);
            }
        });

        escolaridades.forEach(escolaridade => {
            const option = document.createElement('option');
            option.value = escolaridade.toLowerCase().replace(/\s+/g, '_');
            option.textContent = escolaridade;
            escolaridadeSelect.appendChild(option);
        });

        escolaridadeSelect.addEventListener('change', async function () {
            const escolaridadeSelecionada = this.value;

            if (escolaridadeSelecionada === 'opc_escolaridade') {
                location.reload();
            } else {
                await exibirAlunosPorEscolaridade(escolaridadeSelecionada);
            }
        });

    } catch (error) {
        console.error('Erro ao carregar os dados dos usuários:', error);
    } finally {
        loader.style.display = 'none';
    }
});

async function exibirAlunosPorEscolaridade(escolaridadeSelecionada) {
    
    loader.style.display = 'flex';
    try {
        const containerCursos = document.getElementById('cursos_container');

        while (containerCursos.firstChild) {
            containerCursos.removeChild(containerCursos.firstChild);
        }

        containerCursos.style.display = 'block';
        containerCursos.style.justifyContent = '';
        containerCursos.style.alignItems = '';
        containerCursos.style.height = '';

        const pontuacoesResponse = await fetch(`/pontuacoes/ranking`);
        const pontuacoesData = await pontuacoesResponse.json();

        const usuariosResponse = await fetch('/usuarios/listar');
        const usuariosData = await usuariosResponse.json();

        const favoritosResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/favoritos`);
        const favoritosData = await favoritosResponse.json();

        const favoritosSet = Array.isArray(favoritosData) ? new Set(favoritosData.map(aluno => aluno.id)) : new Set();

        const contratadosResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/contratados`);
        const contratadosData = await contratadosResponse.json();

        const interessadosResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/interessados`);
        const interessadosData = await interessadosResponse.json();

        const processoSeletivoResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/processoSeletivo`);
        const processoSeletivoData = await processoSeletivoResponse.json();

        const contratadosSet = new Set(contratadosData.map(aluno => aluno.id));
        const interessadosSet = new Set(interessadosData.map(aluno => aluno.id));
        const processoSeletivoSet = new Set(processoSeletivoData.map(aluno => aluno.id));

        const usuariosMap = {};
        usuariosData.forEach(usuario => {
            if (usuario.tipoUsuario === "Aluno" && usuario.escolaridade) {
                usuariosMap[usuario.id] = {
                    escolaridade: usuario.escolaridade,
                    nome: `${usuario.primeiroNome} ${usuario.sobrenome}`
                };
            }
        });

        const alunosComEscolaridade = [];

        for (const cursoId in pontuacoesData) {
            const curso = pontuacoesData[cursoId];
            const alunos = curso.ranking || [];

            const alunosFiltrados = alunos.filter(aluno => {
                const alunoId = aluno.aluno.id;
                const escolaridadeDoAluno = usuariosMap[alunoId]?.escolaridade?.toLowerCase().replace(/\s+/g, '_');

                return escolaridadeDoAluno === escolaridadeSelecionada.toLowerCase().replace(/\s+/g, '_') &&
                    !contratadosSet.has(alunoId) &&
                    !interessadosSet.has(alunoId) &&
                    !processoSeletivoSet.has(alunoId);
            });

            if (alunosFiltrados.length > 0) {
                alunosComEscolaridade.push(...alunosFiltrados.map(aluno => ({ ...aluno, curso: curso.nomeCurso })));
            }
        }

        if (alunosComEscolaridade.length === 0) {
            const noResultsMessage = document.createElement('div');
            noResultsMessage.innerText = `Nenhum aluno encontrado com a escolaridade ${escolaridadeSelecionada}.`;
            noResultsMessage.className = 'mensagem_nenhum_aluno';
            noResultsMessage.style.textAlign = 'center';
            noResultsMessage.style.margin = '20px 0';
            noResultsMessage.style.fontWeight = '800';
            noResultsMessage.style.fontSize = '20px';
            noResultsMessage.style.color = '#808080';

            containerCursos.style.display = 'flex';
            containerCursos.style.justifyContent = 'center';
            containerCursos.style.alignItems = 'center';
            containerCursos.style.height = '20vh';

            containerCursos.appendChild(noResultsMessage);
            return;
        }

        const alunosPorCurso = alunosComEscolaridade.reduce((acc, aluno) => {
            acc[aluno.curso] = acc[aluno.curso] || [];
            acc[aluno.curso].push(aluno);
            return acc;
        }, {});

        const cursos = Object.keys(alunosPorCurso);
        cursos.forEach((curso, index) => {
            const cursoDiv = document.createElement('div');
            cursoDiv.innerHTML = `
                <div class="container_curso_imagem_nome">
                    <div class="bloco_nome_imagem_curso">
                        <h1>${curso}</h1>
                    </div>
                </div>
                <div class="container_fundo_aluno">
                    <div id="bloco_alunos_${curso}" class="bloco_alunos">
                        <!-- Alunos serão adicionados aqui -->
                    </div>
                </div>
            `;
            containerCursos.appendChild(cursoDiv);

            const blocoAlunos = document.getElementById(`bloco_alunos_${curso}`);

            alunosPorCurso[curso].forEach(aluno => {
                const alunoDiv = document.createElement('div');
                alunoDiv.className = 'box_Aluno';

                if (favoritosSet.has(aluno.aluno.id)) {
                    alunoDiv.style.border = '2px solid yellow';
                }

                const medalha = obterMedalha(aluno.pontosTotais);

                alunoDiv.innerHTML = `
                    <span>${aluno.aluno.primeiroNome} ${aluno.aluno.sobrenome}</span>
                    <span>Aluno do projeto arrastão, finalizou curso <a>${curso}</a> com ${aluno.pontosTotais} pontos</span>
                    <img src="../imgs/${medalha}" alt="medalha">
                    <button onclick="verMais(${aluno.aluno.id})">Ver mais</button>
                `;

                blocoAlunos.appendChild(alunoDiv);
            });

            if (index < cursos.length - 1) {
                const espacoDiv = document.createElement('div');
                espacoDiv.className = 'container_espacamento';
                espacoDiv.innerHTML = `
                    <div class="bloco_espacamento"></div>
                `;
                containerCursos.appendChild(espacoDiv);
            }
        });

    } catch (error) {
        console.error('Erro ao buscar ou exibir alunos por escolaridade:', error);
    } finally {
        loader.style.display = 'none';
    }
}

function buscarAlunoPorNome(nome) {
    if (nome.length >= 3) {
        exibirAlunosPorNome(nome);
    } else {
        document.getElementById('cursos_container').innerHTML = '';
        atualizarAlunos()
    }
}

async function exibirAlunosPorNome(nomeBuscado) {
    
    loader.style.display = 'flex';
    try {
        const pontuacoesResponse = await fetch(`/pontuacoes/ranking`);
        const pontuacoesData = await pontuacoesResponse.json();
        const usuariosResponse = await fetch('/usuarios/listar');
        const usuariosData = await usuariosResponse.json();
        const interessadosResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/interessados`);
        const interessadosData = await interessadosResponse.json();
        const contratadosResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/contratados`);
        const contratadosData = await contratadosResponse.json();
        const processoSeletivoResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/processoSeletivo`);
        const processoSeletivoData = await processoSeletivoResponse.json();
        const favoritosResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/favoritos`);
        const favoritosData = await favoritosResponse.json();
        const favoritosSet = new Set(favoritosData.map(favorito => favorito.id));
        const containerCursos = document.getElementById('cursos_container');
        containerCursos.innerHTML = '';
        const alunosFiltrados = [];
        const usuariosMap = {};
        usuariosData.forEach(usuario => {
            if (usuario.tipoUsuario === "Aluno") {
                usuariosMap[usuario.id] = {
                    nome: `${usuario.primeiroNome} ${usuario.sobrenome}`,
                    primeiroNome: usuario.primeiroNome,
                    sobrenome: usuario.sobrenome
                };
            }
        });

        const interessadosSet = new Set(interessadosData.map(interessado => interessado.id));
        const contratadosSet = new Set(contratadosData.map(contratado => contratado.id));
        const processoSeletivoSet = new Set(processoSeletivoData.map(aluno => aluno.id));

        for (const cursoId in pontuacoesData) {
            const curso = pontuacoesData[cursoId];
            const alunos = curso.ranking || [];

            const alunosFiltradosPorNome = alunos.filter(aluno => {
                const alunoId = aluno.aluno.id;
                const nomeCompleto = `${usuariosMap[alunoId]?.primeiroNome} ${usuariosMap[alunoId]?.sobrenome}`;
                return nomeCompleto.toLowerCase().includes(nomeBuscado.toLowerCase()) &&
                    !interessadosSet.has(alunoId) &&
                    !contratadosSet.has(alunoId) &&
                    !processoSeletivoSet.has(alunoId);
            });

            if (alunosFiltradosPorNome.length > 0) {
                alunosFiltrados.push(...alunosFiltradosPorNome.map(aluno => ({ ...aluno, curso: curso.nomeCurso })));
            }
        }

        if (alunosFiltrados.length === 0) {
            const mensagem = document.createElement('div');
            mensagem.className = 'mensagem_no_alunos';
            mensagem.innerText = `Nenhum aluno encontrado com o nome "${nomeBuscado}".`;
            containerCursos.appendChild(mensagem);
            return;
        }

        const alunosPorCurso = alunosFiltrados.reduce((acc, aluno) => {
            acc[aluno.curso] = acc[aluno.curso] || [];
            acc[aluno.curso].push(aluno);
            return acc;
        }, {});

        const cursos = Object.keys(alunosPorCurso);
        cursos.forEach((curso, index) => {
            const cursoDiv = document.createElement('div');
            cursoDiv.innerHTML = `
                <div class="container_curso_imagem_nome">
                    <div class="bloco_nome_imagem_curso">
                        <h1>${curso}</h1>
                    </div>
                </div>
                <div class="container_fundo_aluno">
                    <div id="bloco_alunos_${curso}" class="bloco_alunos">
                        <!-- Alunos serão adicionados aqui -->
                    </div>
                </div>
            `;

            containerCursos.appendChild(cursoDiv);

            const blocoAlunos = document.getElementById(`bloco_alunos_${curso}`);

            alunosPorCurso[curso].forEach(aluno => {
                const alunoDiv = document.createElement('div');
                alunoDiv.className = 'box_Aluno';

                if (favoritosSet.has(aluno.aluno.id)) {
                    alunoDiv.style.border = '2px solid yellow';
                }

                const medalha = obterMedalha(aluno.pontosTotais);

                alunoDiv.innerHTML = `
                    <span>${aluno.aluno.primeiroNome} ${aluno.aluno.sobrenome}</span>
                    <span>Aluno do projeto arrastão, finalizou curso <a>${curso}</a> com ${aluno.pontosTotais} pontos</span>
                    <img src="../imgs/${medalha}" alt="medalha">
                    <button onclick="verMais(${aluno.aluno.id})">Ver mais</button>
                `;

                blocoAlunos.appendChild(alunoDiv);
            });

            if (index < cursos.length - 1) {
                const espacoDiv = document.createElement('div');
                espacoDiv.className = 'container_espacamento';
                espacoDiv.innerHTML = `
                    <div class="bloco_espacamento"></div>
                `;
                containerCursos.appendChild(espacoDiv);
            }
        });

    } catch (error) {
        console.error('Erro ao carregar os dados dos alunos:', error);
    } finally {
        loader.style.display = 'none';
    }
}

async function exibirAlunosPorEtnia(etniaSelecionada) {
    if (etniaSelecionada === "") {
        location.reload();
    }

    
    loader.style.display = 'flex';

    try {
        const pontuacoesResponse = await fetch(`/pontuacoes/ranking`);
        const pontuacoesData = await pontuacoesResponse.json();
        const usuariosResponse = await fetch('/usuarios/listar');
        const usuariosData = await usuariosResponse.json();
        const contratadosResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/contratados`);
        const contratadosData = await contratadosResponse.json();
        const interessadosResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/interessados`);
        const interessadosData = await interessadosResponse.json();
        const processoSeletivoResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/processoSeletivo`);
        const processoSeletivoData = await processoSeletivoResponse.json();
        const favoritosResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/favoritos`);
        const favoritosData = await favoritosResponse.json();
        const containerCursos = document.getElementById('cursos_container');
        containerCursos.innerHTML = '';
        containerCursos.removeAttribute('style');
        const alunosComEtnia = [];
        const usuariosMap = {};
        usuariosData.forEach(usuario => {
            if (usuario.tipoUsuario === "Aluno" && usuario.etnia) {
                usuariosMap[usuario.id] = {
                    etnia: usuario.etnia,
                    nome: `${usuario.primeiroNome} ${usuario.sobrenome}`
                };
            }
        });

        const interessadosSet = new Set(interessadosData.map(interessado => interessado.id));
        const contratadosSet = new Set(contratadosData.map(contratado => contratado.id));
        const processoSeletivoSet = new Set(processoSeletivoData.map(aluno => aluno.id));

        const favoritosSet = new Set(favoritosData.map(favorito => favorito.id));

        for (const cursoId in pontuacoesData) {
            const curso = pontuacoesData[cursoId];
            const alunos = curso.ranking || [];

            const alunosFiltrados = alunos.filter(aluno => {
                const alunoId = aluno.aluno.id;
                const etniaDoAluno = usuariosMap[alunoId]?.etnia;
                return etniaDoAluno === etniaSelecionada &&
                    !interessadosSet.has(alunoId) &&
                    !contratadosSet.has(alunoId) &&
                    !processoSeletivoSet.has(alunoId);
            });

            if (alunosFiltrados.length > 0) {
                alunosComEtnia.push(...alunosFiltrados.map(aluno => ({ ...aluno, curso: curso.nomeCurso })));
            }
        }

        if (alunosComEtnia.length === 0) {
            const noResultsMessage = document.createElement('div');
            noResultsMessage.innerText = `Nenhum aluno encontrado com a etnia ${etniaSelecionada}.`;
            noResultsMessage.className = 'mensagem_nenhum_aluno';
            noResultsMessage.style.textAlign = 'center';
            noResultsMessage.style.margin = '20px 0';
            noResultsMessage.style.fontWeight = 800;
            noResultsMessage.style.fontSize = '20px';
            noResultsMessage.style.color = '#808080';

            containerCursos.style.display = 'flex';
            containerCursos.style.justifyContent = 'center';
            containerCursos.style.alignItems = 'center';
            containerCursos.style.height = '20vh';

            containerCursos.appendChild(noResultsMessage);
            return;
        }

        const alunosPorCurso = alunosComEtnia.reduce((acc, aluno) => {
            acc[aluno.curso] = acc[aluno.curso] || [];
            acc[aluno.curso].push(aluno);
            return acc;
        }, {});

        const cursos = Object.keys(alunosPorCurso);
        cursos.forEach((curso, index) => {
            const cursoDiv = document.createElement('div');
            cursoDiv.innerHTML = `
                <div class="container_curso_imagem_nome">
                    <div class="bloco_nome_imagem_curso">
                        <h1>${curso}</h1>
                    </div>
                </div>
                <div class="container_fundo_aluno">
                    <div id="bloco_alunos_${curso}" class="bloco_alunos">
                        <!-- Alunos serão adicionados aqui -->
                    </div>
                </div>
            `;

            containerCursos.appendChild(cursoDiv);

            const blocoAlunos = document.getElementById(`bloco_alunos_${curso}`);

            alunosPorCurso[curso].forEach(aluno => {
                const alunoDiv = document.createElement('div');
                alunoDiv.className = 'box_Aluno';

                if (favoritosSet.has(aluno.aluno.id)) {
                    alunoDiv.style.border = '2px solid yellow';
                }

                const medalha = obterMedalha(aluno.pontosTotais);

                alunoDiv.innerHTML = `
                    <span>${aluno.aluno.primeiroNome} ${aluno.aluno.sobrenome}</span>
                    <span>Aluno do projeto arrastão, finalizou curso <a>${curso}</a> com ${aluno.pontosTotais} pontos</span>
                    <img src="../imgs/${medalha}" alt="medalha">
                    <button onclick="verMais(${aluno.aluno.id})">Ver mais</button>
                `;

                blocoAlunos.appendChild(alunoDiv);
            });

            if (index < cursos.length - 1) {
                const espacoDiv = document.createElement('div');
                espacoDiv.className = 'container_espacamento';
                espacoDiv.innerHTML = `
                    <div class="bloco_espacamento"></div>
                `;
                containerCursos.appendChild(espacoDiv);
            }
        });

    } catch (error) {
        console.error('Erro ao carregar os dados dos alunos:', error);
    } finally {
        loader.style.display = 'none';
    }
}

async function exibirAlunosPorSexo(sexoSelecionado) {
    if (sexoSelecionado === "") {
        location.reload();
    }

    
    loader.style.display = 'flex';

    try {
        const pontuacoesResponse = await fetch(`/pontuacoes/ranking`);
        const pontuacoesData = await pontuacoesResponse.json();
        const usuariosResponse = await fetch('/usuarios/listar');
        const usuariosData = await usuariosResponse.json();
        const interessadosResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/interessados`);
        const interessadosData = await interessadosResponse.json();
        const contratadosResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/contratados`);
        const contratadosData = await contratadosResponse.json();
        const processoSeletivoResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/processoSeletivo`);
        const processoSeletivoData = await processoSeletivoResponse.json();
        const favoritosResponse = await fetch(`/dashboardRecrutador/${getIdUsuarioLogado()}/listar/favoritos`);
        const favoritosData = await favoritosResponse.json();
        const favoritosIds = favoritosData.map(favorito => favorito.id);
        const containerCursos = document.getElementById('cursos_container');
        containerCursos.innerHTML = '';
        containerCursos.style.display = '';
        containerCursos.style.justifyContent = '';
        containerCursos.style.alignItems = '';
        containerCursos.style.height = '';
        const alunosComSexo = [];
        const usuariosMap = {};
        usuariosData.forEach(usuario => {
            if (usuario.tipoUsuario === "Aluno" && usuario.sexo) {
                usuariosMap[usuario.id] = {
                    sexo: usuario.sexo,
                    nome: `${usuario.primeiroNome} ${usuario.sobrenome}`
                };
            }
        });

        const interessadosSet = new Set(interessadosData.map(interessado => interessado.id));
        const contratadosSet = new Set(contratadosData.map(contratado => contratado.id));
        const processoSeletivoSet = new Set(processoSeletivoData.map(processo => processo.id));

        for (const cursoId in pontuacoesData) {
            const curso = pontuacoesData[cursoId];
            const alunos = curso.ranking || [];
            const alunosFiltrados = alunos.filter(aluno => {
                const sexoDoAluno = usuariosMap[aluno.aluno.id]?.sexo;
                const alunoId = aluno.aluno.id;

                return sexoDoAluno &&
                    sexoDoAluno.toLowerCase() === sexoSelecionado.toLowerCase() &&
                    !interessadosSet.has(alunoId) &&
                    !contratadosSet.has(alunoId) &&
                    !processoSeletivoSet.has(alunoId);
            });

            if (alunosFiltrados.length > 0) {
                alunosComSexo.push(...alunosFiltrados.map(aluno => ({ ...aluno, curso: curso.nomeCurso })));
            }
        }

        if (alunosComSexo.length === 0) {
            const noResultsMessage = document.createElement('div');
            noResultsMessage.innerText = `Nenhum aluno encontrado com o sexo ${sexoSelecionado}.`;
            noResultsMessage.className = 'mensagem_nenhum_aluno';
            noResultsMessage.style.textAlign = 'center';
            noResultsMessage.style.margin = '20px 0';
            noResultsMessage.style.fontWeight = 800;
            noResultsMessage.style.fontSize = '20px';
            noResultsMessage.style.color = '#808080';
            containerCursos.style.display = 'flex';
            containerCursos.style.justifyContent = 'center';
            containerCursos.style.alignItems = 'center';
            containerCursos.style.height = '20vh';
            containerCursos.appendChild(noResultsMessage);
            return;
        }

        const alunosPorCurso = alunosComSexo.reduce((acc, aluno) => {
            acc[aluno.curso] = acc[aluno.curso] || [];
            acc[aluno.curso].push(aluno);
            return acc;
        }, {});

        const cursos = Object.keys(alunosPorCurso);
        cursos.forEach((curso, index) => {
            const cursoDiv = document.createElement('div');
            cursoDiv.innerHTML = `
                <div class="container_curso_imagem_nome">
                    <div class="bloco_nome_imagem_curso">
                        <h1>${curso}</h1>
                    </div>
                </div>
                <div class="container_fundo_aluno">
                    <div id="bloco_alunos_${curso}" class="bloco_alunos">
                        <!-- Alunos serão adicionados aqui -->
                    </div>
                </div>
            `;

            containerCursos.appendChild(cursoDiv);
            const blocoAlunos = document.getElementById(`bloco_alunos_${curso}`);
            alunosPorCurso[curso].forEach(aluno => {
                const alunoDiv = document.createElement('div');
                alunoDiv.className = 'box_Aluno';
                const isFavorito = favoritosIds.includes(aluno.aluno.id);
                alunoDiv.style.border = isFavorito ? '2px solid yellow' : 'none';
                const medalha = obterMedalha(aluno.pontosTotais);
                alunoDiv.innerHTML = `
                    <span>${aluno.aluno.primeiroNome} ${aluno.aluno.sobrenome}</span>
                    <span>Aluno do projeto arrastão, finalizou curso <a>${curso}</a> com ${aluno.pontosTotais} pontos</span>
                    <img src="../imgs/${medalha}" alt="medalha">
                    <button onclick="verMais(${aluno.aluno.id})">Ver mais</button>
                `;

                blocoAlunos.appendChild(alunoDiv);
            });

            if (index < cursos.length - 1) {
                const espacoDiv = document.createElement('div');
                espacoDiv.className = 'container_espacamento';
                espacoDiv.innerHTML = `
                    <div class="bloco_espacamento"></div>
                `;
                containerCursos.appendChild(espacoDiv);
            }
        });

    } catch (error) {
        console.error('Erro ao carregar os dados dos alunos:', error);
    }

    finally {
        loader.style.display = 'none';
    }
}