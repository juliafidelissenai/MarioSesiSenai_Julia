document.addEventListener('DOMContentLoaded', () => {
    const mario = document.querySelector('.mario');
    const pipe = document.querySelector('.pipe');
    const gameBoard = document.getElementById('game-board');
    const hudPlayerName = document.getElementById('hud-player-name');
    const scoreDisplay = document.getElementById('score-display');
    const jumpTip = document.getElementById('jump-tip');
    const starModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');
});

    const startModal = document.getElementyById('start-modal');
    const startForm = document.getElementyById('start-form');
    const playerInput = document.getElementyById('player-input');
    const btnviewRanking = document.getElementyById('btn-view-ranking');

    const gameoverModal = document.getElementyById('gameover-modal');
    const finalScoreValue = document.getElementyById('final-score-value');
    const saveStatusMsg = document.getElementyById('ranking-body');
    const btnRestart = document.getElementyById('btn-restart');
    const btnChangePlayer = document.getElementyById('btn-change-player');
    //variaveis de estado
    let currentPlayer = '';
    let score = 0;
    let isPlaying = false;
    let gameLoop = null;
    let scoreLoop = null;
    //recuperação do ultimo nome de usuario utilizado
    const savedName = localStorage.getItem('mario_jump_player');
    if (savedName && playerInput) {
        playerInput.value = savedName;
    }

    function startGame(){
        clearInterval(gameLoop);
        clearInterval(scoreLoop);
        //Resetei as posições virtuais
        resetElements();

        isPlaying = true;
        score = 0;
        scoreDisplay.textContent = '0';
        hudPlayerName.textContent = currentPlayer || 'Jogador';
        //Ativa as animações do CSS do jogo
        gameBoard.classList.add('running');
        //Loop de pontuação progressiva
        scoreLoop = setInterval(() => {
            if(isPaying){
                score += 1;
                scoreDisplay.textContent = score;
            }
        }, 100)

        gameLoop = setInterval(checkCollision, 10);

    }

    function resetElements(){
        pipe.style.animation = '';
        pipe.style.left = '';

        mario.src = '../assets/mario.gif';
        mario.style.animation = '';
        mario.style.bottom = '0px';
        mario.style.width = '';
        mario.style.marginLeft = '';
        mario.classList.remove('jump');
        if (jumpTip){
            jumpTip.style.opacity = '1';
        }
    }

    function jump(){
        if (!isPlaying) return;
        if (mario.classList.contains('jump')) return;

        mario.classList.add('jump');

        if(jumpTip){
            jumpTip.style.opacity = '0';
        }

        setTimeout(() => {
            mario.classList.remove('jump');
        }, 500);
    }
    //Verificar a colisão entre o Mario e o Cano(obstáculo)
    function checkCollision(){
        if (!isPlaying) return;

        const pipePosition = pipe.offsetLeft;
        const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');
        //Tolerancia de colisão: quando o cano está na faixa de contato com o Mário
        if(pipePosition <= 120 && pipePosition > 0 && marioPosition <80){
            triggerGameOver(pipePosition, marioPosition);
        }
    }
    //Tratar o GameOver
    function triggerGameOver(pipePosition, marioPosition){
        isPlaying = false;
        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        gameBoard.classList.remove('running');
        //Congela o cano na posição exata da colisão
        pipe.style.animation ='none';
        pipe.style.left = `${pipePosition}px`;
        //Congela o Mario na altura exata e muda para a imagem de Game Over
        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;
        mario.src = '../assets/game-over.png';
        mario.style.width = '75px';
        mario.style.marginLeft = '50px';
        //Atualização do modal de Game Over 
        finalScoreValue.textContent = score;
        saveStatusMsg.textContent = 'Salvando pontuação no banco...';
        saveStatusMsg.style.color = '#ffcc00';

        gameoverModal.classList.add('active');
        //Salva a pontuação no banco com a função criada chamada saveScore
        saveScore(currentPlayer, score);
    }

    function saveScore(playerName, finalScore){
        fetch('salvar_ranking.php',{
            method: 'POST',
            headers: {
                'Content-Type': 'aplication/json'
            },
            body: JSON.stringify({
                nome: playerName,
                pontos: finalScore
            })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'sucess'){
                saveStatusMsg.textContent = 'Pontuação registrada no banco!';
                saveStatusMsg.style.color = '#10b981';
                if (data.ranking){
                    renderRanking(data.ranking, playerName, finalScore);
                }
            }else {
                saveStatusMsg.textContent = (data.message || 'Erro ao registrar');
                saveStatusMsg.style.color = '#ef4444';
            }
        })
        .catch(err => {
            console.error('Erro na requisição', err);
            saveStatusMsg.textContent = 'Erro ao conectar ao servidor.';
            saveStatusMsg.style.color = '#ef4444';
        });
    }
    //Busca no ranking atualizado do banco
    function fetchRanking(){
        fetch('obter_ranking.php')
        .then(res => res.json())
        .then(data => {
            if(data.status === 'sucess' && data.ranking){
                renderRanking(data.ranking);
            }
        })
        .catch(err => console.error('Erro ao buscar o ranking', err));
    }
    //Vamos atualizar a tabela do ranking no HTML
    function renderRanking(list, highlightName = null, highlightScore = null){
        if (!rankingBody) return;
        rankingBody.innerHTML = '';
        if (!list || list.length === 0){
            rankingBody.innerHTML = `<tr><td> colspan="3" class="loading-cell">Nenhuma pontuação gravada ainda.</td></tr>`;
            return;
        }

        let highlightted = false;

        list.forEach((item, index) => {
            const tr = document.createElement('tr');

            if(!highlightted && highlightName && item.nome == highlightName && parseInt(item.pontos, 10) == highlightScore){
                tr.classList.add('highlight-current');
                highlightted = true;
            }

            let medal = `${index + 1}º`;
            if(index === 0) medal = '🥇 1º';
            if(index === 1) medal = '🥈 2º';
            else if (index === 2) medal = '🥉 3º';

            tr.innerHTML = `
                <td class="ranking-pos">${medal}</td>
                <td><strong>${escapeHtml(item.nome)}</strong></td>
                <td>${parseInt(item.pontos, 10)} pts</td>
            `;

            rankingBody.appendChild(tr);
        });
    }

    function escapeHtml(str){
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
    }

    //Eventos de controle e interface do jogo
    //Iniciar o jogo(formulário)
    startForm.addEventListener('submit', (e) => {
        e.preventDefault(); //Impede o regarregamento da página

        const nameValue = playerInput.value.trim();
        if(!nameValue) {
            playerInput.focus();
            return;
        }

        currentPlayer = nameValue;
        localStorage.setItem(mario_jump_player, currentPlayer);
        //Fecha a tela e começa o jogo depois de preencher os dados
        startModal.classList.remove('active');
        startGame();
    });

    //Botão ver Ranking

