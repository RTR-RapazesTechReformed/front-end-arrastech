import { obterMedalha } from './medalhas.js';

const loader = document.querySelector('.container_loader');

document.addEventListener('DOMContentLoaded', function () {
    const filtroCursos = document.getElementById('courseFilter');
    const tabelaRanking = document.getElementById('rankingTable');
    const user = JSON.parse(sessionStorage.getItem('user'));

    if (filtroCursos && tabelaRanking) {
        async function buscarEExibirRanking() {
            loader.style.display = 'flex';
            try {
                const response = await fetch('/pontuacoes/ranking');
                if (!response.ok) throw new Error('Falha ao buscar o ranking.');

                const dados = await response.json();
                const pontosTotais = {};

                Object.values(dados).forEach(dadosCurso => {
                    dadosCurso.ranking.forEach(entrada => {
                        const aluno = entrada.aluno;
                        if (!pontosTotais[aluno.id]) {
                            pontosTotais[aluno.id] = {
                                id: aluno.id,
                                nome: `${aluno.primeiroNome} ${aluno.sobrenome}`,
                                email: aluno.email,
                                pontosTotais: 0
                            };
                        }
                        pontosTotais[aluno.id].pontosTotais += entrada.pontosTotais;
                    });
                });

                // Ordenando alunos pelo total de pontos
                const arrayRanking = Object.values(pontosTotais).sort((a, b) => b.pontosTotais - a.pontosTotais);

                // Limpando o conteúdo atual da tabela de ranking
                tabelaRanking.innerHTML = '';

                arrayRanking.forEach((entrada, index) => {
                    let medalhaHtml = '';

                    // Definindo a medalha para os 3 primeiros lugares
                    if (index === 0) {
                        medalhaHtml = '<img src="/imgs/gold_medal.png" alt="Medalha de Ouro" style="width: 40px; height: 40px;">';
                    } else if (index === 1) {
                        medalhaHtml = '<img src="/imgs/silver_medal.png" alt="Medalha de Prata" style="width: 40px; height: 40px;">';
                    } else if (index === 2) {
                        medalhaHtml = '<img src="/imgs/bronze_medal.png" alt="Medalha de Bronze" style="width: 40px; height: 40px;">';
                    } else {
                        // Alunos sem medalha mostram apenas a posição numérica
                        medalhaHtml = `<span>${index + 1}º</span>`;
                    }

                    // Criando a linha de tabela para cada aluno

                    const linha = document.createElement('tr');
                    if (user.tipoUsuario != 'Aluno') {
                        linha.innerHTML = `
                        <td>${medalhaHtml}</td>
                        <td style="text-align: right;">
                            <img src="" alt="Imagem de perfil" class="img-thumbnail" style="width: 50px;" id="img-${entrada.id}">
                        </td>
                        <td>
                            <span style="font-weight: 800;">${entrada.nome}</span> <br>
                            <small style="font-weight: 200;">${entrada.email}</small>
                        </td>
                        <td>
                            ${entrada.pontosTotais} 
                        </td>
                    `;
                    } else {
                        linha.innerHTML = `
                        <td>${medalhaHtml}</td>
                        <td style="text-align: right;">
                            <img src="" alt="Imagem de perfil" class="img-thumbnail" style="width: 50px;" id="img-${entrada.id}">
                        </td>
                        <td>
                            <span style="font-weight: 800;">${entrada.nome}</span> <br>
                            <small style="font-weight: 200;">${entrada.email}</small>
                        </td>
                    `;
                    }

                    tabelaRanking.appendChild(linha);

                    // Carregar imagem de perfil do aluno
                    carregarImagemPerfil(entrada.id);
                });
            } catch (error) {
                console.error('Erro ao buscar o ranking:', error);
            } finally {
                loader.style.display = 'none';
            }
        }

        async function carregarImagemPerfil(id) {
            const imgElement = document.getElementById(`img-${id}`);
            if (!imgElement) return;
            loader.style.display = 'flex';
            try {
                const response = await fetch(`/usuarios/imagem/${id}`);
                if (response.ok) {
                    const imageBlob = await response.blob();
                    if (imageBlob.size > 0) {
                        const imageUrl = URL.createObjectURL(imageBlob);
                        imgElement.src = imageUrl;
                    } else {
                        imgElement.src = '/imgs/foto_padrao.png';
                    }
                } else {
                    imgElement.src = '/imgs/foto_padrao.png';
                }
            } catch (error) {
                console.error('Erro ao buscar a imagem do perfil:', error);
                imgElement.src = '/imgs/foto_padrao.png';
            } finally {
                loader.style.display = 'none';
            }

            imgElement.style.width = '50px';
            imgElement.style.height = '50px';
            imgElement.style.borderRadius = '100%';
            imgElement.style.objectFit = 'cover';
        }

        async function popularFiltroCategorias() {
            loader.style.display = 'flex';
            try {
                const response = await fetch('/dashboardRecrutador/listar');
                if (!response.ok) throw new Error('Falha ao buscar as categorias dos cursos.');
        
                const dados = await response.json();
                const categoriasSet = new Set();
        
                dados.forEach(curso => {
                    if (curso.categorias) {
                        curso.categorias.split(',').map(cat => cat.trim()).forEach(cat => categoriasSet.add(cat));
                    }
                });
    
                filtroCursos.innerHTML = '<option value="Categoria">Categoria</option>';
            
                categoriasSet.forEach(categoria => {
                    const opcao = document.createElement('option');
                    opcao.value = categoria;
                    opcao.textContent = categoria;
                    filtroCursos.appendChild(opcao);
        
                });
            } catch (error) {
                console.error('Erro ao carregar as categorias:', error);
            } finally {
                loader.style.display = 'none';
            }
        }
       
        
        async function carregarCursosPorCategoria(categoria) {
            const loader = document.getElementById('loader')
            loader.style.display = 'flex'
        
            try {
                const response = await fetch(`/dashboardRecrutador/listar?categoria=${categoria}`)
                if (!response.ok) throw new Error('Falha ao buscar cursos da categoria selecionada.')
        
                const cursos = await response.json()
        

                cursos.forEach(curso => {
                    curso.categorias = [...new Set(curso.categorias.split(',').map(c => c.trim()))]
                });
        
                sessionStorage.setItem(`cursos_${categoria}`, JSON.stringify(cursos))

                const filtroCurso = document.getElementById('filtroCurso');
                filtroCurso.innerHTML = '<option value="all">Selecione um curso</option>'
        
                cursos.forEach(curso => {
                    const opcao = document.createElement('option');
                    opcao.value = curso.id;
                    opcao.textContent = curso.nome
                    filtroCurso.appendChild(opcao)
                });
            } catch (error) {
                console.error('Erro ao carregar cursos:', error)
            } finally {
                loader.style.display = 'none'
            }
        }

        filtroCursos.addEventListener('change', function () {
            const categoriaSelecionada = this.value;
            const filtroCurso = document.getElementById('filtroCurso');
            const cursoClass = document.querySelectorAll('.course-select')[1];

            if (categoriaSelecionada !== 'all') {
                cursoClass.style.display = 'block';

                filtroCurso.innerHTML = '<option value="all">Cursos</option>';

                carregarCursosPorCategoria(categoriaSelecionada);
            } else {
                filtroCurso.innerHTML = '<option value="all">Selecione uma categoria primeiro</option>';

                cursoClass.style.display = 'none';
            }
        });

        document.getElementById('courseFilter').addEventListener('change', async function () {
            loader.style.display = 'flex';
            try {
                const categoriaSelecionadaNome = this.options[this.selectedIndex].text.trim().toLowerCase();
             

                if (categoriaSelecionadaNome === 'categoria') {
                    await buscarEExibirRanking();
                    return;
                }

                // Verifica se há cursos para a categoria selecionada no sessionStorage
                const chaveCategoria = `cursos_${categoriaSelecionadaNome.charAt(0).toUpperCase() + categoriaSelecionadaNome.slice(1)}`;  // Exemplo: cursos_Tecnologia
                const cursosDaCategoria = JSON.parse(sessionStorage.getItem(chaveCategoria));

                // Se não houver cursos para a categoria selecionada
                if (!cursosDaCategoria || cursosDaCategoria.length === 0) {
                    return;
                }

                // Busca o ranking para cada curso da categoria
                const responseRanking = await fetch('/pontuacoes/ranking');
                if (!responseRanking.ok) throw new Error('Falha ao buscar o ranking dos cursos.');

                const dadosRanking = await responseRanking.json();

                tabelaRanking.innerHTML = '';

                // Itera pelos cursos da categoria armazenada no sessionStorage
                cursosDaCategoria.forEach((curso) => {
                    // Encontra o ranking do curso dentro dos dados de ranking
                    const dadosCurso = Object.values(dadosRanking).find(rankingCurso =>
                        rankingCurso.nomeCurso.trim().toLowerCase() === curso.nome.trim().toLowerCase()
                    );

                    if (dadosCurso && dadosCurso.ranking && dadosCurso.ranking.length > 0) {
                        dadosCurso.ranking.forEach((entrada, index) => {
                            let medalhaHtml = '';

                            // Definindo a medalha para os 3 primeiros lugares
                            if (index === 0) {
                                medalhaHtml = '<img src="/imgs/gold_medal.png" alt="Medalha de Ouro" style="width: 40px; height: 40px;">';
                            } else if (index === 1) {
                                medalhaHtml = '<img src="/imgs/silver_medal.png" alt="Medalha de Prata" style="width: 40px; height: 40px;">';
                            } else if (index === 2) {
                                medalhaHtml = '<img src="/imgs/bronze_medal.png" alt="Medalha de Bronze" style="width: 40px; height: 40px;">';
                            } else {
                                // Alunos sem medalha mostram apenas a posição numérica
                                medalhaHtml = `<span>${index + 1}º</span>`;
                            }

                            // Agora, somamos os pontos totais de cada aluno
                            let pontosTotais = entrada.pontosTotais;

                            // Criando a linha de tabela para cada aluno
                            const linha = document.createElement('tr');
                            if (user.tipoUsuario != 'Aluno') {
                                linha.innerHTML = `
                                <td>${medalhaHtml}</td>
                                <td style="text-align: right;">
                                    <img src="" alt="Imagem de perfil" class="img-thumbnail" style="width: 50px;" id="img-${entrada.aluno.id}">
                                </td>
                                <td>
                                    <span style="font-weight: 800;">${entrada.aluno.primeiroNome} ${entrada.aluno.sobrenome}</span> <br>
                                    <small style="font-weight: 200;">${entrada.aluno.email}</small>
                                </td>
                                <td>
                                    ${entrada.pontosTotais}
                                </td>
                            `;
                            } else {
                                linha.innerHTML = `
                                <td>${medalhaHtml}</td>
                                <td style="text-align: right;">
                                    <img src="" alt="Imagem de perfil" class="img-thumbnail" style="width: 50px;" id="img-${entrada.aluno.id}">
                                </td>
                                <td>
                                    <span style="font-weight: 800;">${entrada.aluno.primeiroNome} ${entrada.aluno.sobrenome}</span> <br>
                                    <small style="font-weight: 200;">${entrada.aluno.email}</small>
                                </td>
                            `;
                            }

                            tabelaRanking.appendChild(linha);

                            // Carregar a imagem de perfil do aluno
                            carregarImagemPerfil(entrada.aluno.id);

                            // Exibe a soma dos pontos totais de cada aluno
                            // Verificamos se o aluno já tem pontos de outros cursos somados
                            const alunoId = entrada.aluno.id;
                            let pontosSoma = sessionStorage.getItem(`pontosTotais_${alunoId}`);
                            if (!pontosSoma) {
                                pontosSoma = 0;
                            }
                            pontosSoma = parseInt(pontosSoma) + pontosTotais;
                            sessionStorage.setItem(`pontosTotais_${alunoId}`, pontosSoma);
                        });
                    }
                });
            } catch (error) {
                console.error('Erro ao buscar os dados:', error);
            } finally {
                loader.style.display = 'none';
            }
        });

        document.getElementById('filtroCurso').addEventListener('change', async function () {
            loader.style.display = 'flex'; // Mostra o loader no início
            try {
                const cursoSelecionadoNome = this.options[this.selectedIndex].text.trim().toLowerCase();
        
                if (cursoSelecionadoNome === 'selecione um curso') {
                    await buscarEExibirRanking();
                } else {
                    const response = await fetch('/pontuacoes/ranking');
                    if (!response.ok) throw new Error('Falha ao buscar o ranking por curso.');
        
                    const dados = await response.json();
        
                    const dadosCurso = Object.values(dados).find(curso =>
                        curso.nomeCurso.trim().toLowerCase() === cursoSelecionadoNome
                    );
        
                    if (dadosCurso && dadosCurso.ranking && dadosCurso.ranking.length > 0) {
                        tabelaRanking.innerHTML = ''; // Limpa a tabela
        
                        dadosCurso.ranking.forEach((entrada, index) => {
                            let medalhaHtml = '';
        
                            // Definindo a medalha para os 3 primeiros lugares
                            if (index === 0) {
                                medalhaHtml = '<img src="/imgs/gold_medal.png" alt="Medalha de Ouro" style="width: 40px; height: 40px;">';
                            } else if (index === 1) {
                                medalhaHtml = '<img src="/imgs/silver_medal.png" alt="Medalha de Prata" style="width: 40px; height: 40px;">';
                            } else if (index === 2) {
                                medalhaHtml = '<img src="/imgs/bronze_medal.png" alt="Medalha de Bronze" style="width: 40px; height: 40px;">';
                            } else {
                                // Alunos sem medalha mostram apenas a posição numérica
                                medalhaHtml = `<span>${index + 1}º</span>`;
                            }
        
                            // Criando a linha de tabela para cada aluno
                            const linha = document.createElement('tr');
                            if (user.tipoUsuario != 'Aluno') {
                                linha.innerHTML = `
                                <td>${medalhaHtml}</td>
                                <td style="text-align: right;">
                                    <img src="" alt="Imagem de perfil" class="img-thumbnail" style="width: 50px;" id="img-${entrada.aluno.id}">
                                </td>
                                <td>
                                    <span style="font-weight: 800;">${entrada.aluno.primeiroNome} ${entrada.aluno.sobrenome}</span> <br>
                                    <small style="font-weight: 200;">${entrada.aluno.email}</small>
                                </td>
                                <td>
                                    ${entrada.pontosTotais}
                                </td>
                            `;
                            } else {
                                linha.innerHTML = `
                                <td>${medalhaHtml}</td>
                                <td style="text-align: right;">
                                    <img src="" alt="Imagem de perfil" class="img-thumbnail" style="width: 50px;" id="img-${entrada.aluno.id}">
                                </td>
                                <td>
                                    <span style="font-weight: 800;">${entrada.aluno.primeiroNome} ${entrada.aluno.sobrenome}</span> <br>
                                    <small style="font-weight: 200;">${entrada.aluno.email}</small>
                                </td>
                            `;
                            }
        
                            tabelaRanking.appendChild(linha);
        
                            carregarImagemPerfil(entrada.aluno.id);
                        });
                    } else {
    
                        tabelaRanking.innerHTML = `
                            <tr>
                                <td colspan="4" style="text-align: center;">Não há pontuações nesse curso.</td>
                            </tr>
                        `;
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar o ranking por curso:', error);
            } finally {
                loader.style.display = 'none'; 
            }
        });
        

        buscarEExibirRanking();
        popularFiltroCategorias();
    } else {
        console.error('Elementos necessários não encontrados.');
    }
});
