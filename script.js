// --- ESTADO GLOBAL E SAVE ---
let isPaused = false; // Controle de pausa para jogos em tempo real

let gameState = {
    faseAtual: 1,
    coordenada: ["_", "_", "_", "_"],
    termoo: { tentativas: [], gameOver: false },
    dino: { gameOver: false },
    snake: { gameOver: false },
    ttt: { board: Array(25).fill(''), gameOver: false }
};

window.onload = () => {
    const save = localStorage.getItem('saveAventura');
    if (save) {
        document.getElementById('btn-retomar').disabled = false;
    }
};

// --- NAVEGAÇÃO E TELAS ---
function mostrarTela(idTela) {
    document.querySelectorAll('.screen').forEach(tela => tela.classList.add('hidden'));
    document.getElementById(idTela).classList.remove('hidden');
}

function iniciarNovaAventura() {
    gameState = {
        faseAtual: 1,
        coordenada: ["_", "_", "_", "_"],
        termoo: { tentativas: [], gameOver: false },
        dino: { gameOver: false },
        snake: { gameOver: false },
        ttt: { board: Array(25).fill(''), gameOver: false }
    };
    localStorage.setItem('saveAventura', JSON.stringify(gameState));
    carregarFase();
}

function retomarAventura() {
    const save = localStorage.getItem('saveAventura');
    if (save) {
        gameState = JSON.parse(save);
        if (!gameState.dino) gameState.dino = { gameOver: false };
        if (!gameState.snake) gameState.snake = { gameOver: false };
        if (!gameState.ttt) gameState.ttt = { board: Array(25).fill(''), gameOver: false };
        carregarFase();
    }
}

function carregarFase() {
    mostrarTela('tela-jogo');
    document.getElementById('titulo-fase').innerText = `Fase ${gameState.faseAtual}`;
    document.getElementById('senha-revelada').innerText = gameState.coordenada.join(" ");
    
    // Esconde todos os jogos primeiro
    document.querySelectorAll('.game-container').forEach(c => c.classList.add('hidden'));

    if (gameState.faseAtual === 1) {
        iniciarTermoo();
    } else if (gameState.faseAtual === 2) {
        iniciarDino();
    } else if (gameState.faseAtual === 3) {
        iniciarSnake();
    } else if (gameState.faseAtual === 4) {
        iniciarTTT(); 
    } else if (gameState.faseAtual > 4) {
        prepararTelaMapa();
        mostrarTela('tela-mapa');
    }
}

function getSenhaFinal() {
    return gameState.coordenada.join("");
}

function normalizarSenha(valor) {
    return valor.toString().trim().replace(/\s+/g, '').replace(/[^0-9.,\-]/g, '');
}

function extrairSenha(valor) {
    const texto = normalizarSenha(valor);
    const match = texto.match(/^(-?\d+(?:\.\d+)?)[, ]?(-?\d+(?:\.\d+)?)$/);
    if (match) {
        return `${match[1]},${match[2]}`;
    }
    return texto;
}

function prepararTelaMapa() {
    const input = document.getElementById('senha-input');
    const container = document.getElementById('mapa-container');
    const iframe = document.getElementById('mapa-iframe');
    const senhaFinalText = document.getElementById('senha-final');
    const botaoEnviar = document.getElementById('btn-senha-enviar');

    if (input) {
        input.value = '';
        input.disabled = false;
    }
    if (container) container.classList.add('hidden');
    if (iframe) iframe.src = '';
    if (senhaFinalText) senhaFinalText.innerText = '';
    if (botaoEnviar) botaoEnviar.disabled = false;
}

function validarSenhaFinal() {
    const input = document.getElementById('senha-input');
    const botao = document.getElementById('btn-senha-enviar');
    const container = document.getElementById('mapa-container');
    const iframe = document.getElementById('mapa-iframe');
    const senhaFinalText = document.getElementById('senha-final');

    if (!input || !container || !iframe || !senhaFinalText || !botao) return;

    const entrada = extrairSenha(input.value);
    const senhaCorreta = extrairSenha(getSenhaFinal());
    const senhaPadrao = extrairSenha('-20.6156,-46.0494');
    const senhaFinal = senhaCorreta !== '' ? senhaCorreta : senhaPadrao;

    if (entrada === senhaFinal && senhaFinal !== '') {
        container.classList.remove('hidden');
        iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(senhaFinal)}&output=embed`;
        senhaFinalText.innerText = `Senha aceita: ${senhaFinal}`;
        input.disabled = true;
        botao.disabled = true;
    } else {
        console.debug('Senha inválida', { entrada, senhaFinal });
        mostrarAlerta("Senha incorreta. Verifique as partes que você já desbloqueou e tente novamente.");
    }
}

function abrirGoogleMaps() {
    const senhaCorreta = extrairSenha(getSenhaFinal()) || extrairSenha('-20.6156,-46.0494');
    if (!senhaCorreta) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(senhaCorreta)}`, '_blank');
}

function avancarFase() {
    gameState.faseAtual++;
    localStorage.setItem('saveAventura', JSON.stringify(gameState));
    carregarFase();
}

// --- INTERFACE (SIDEBAR E ALERTAS) ---
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

document.querySelectorAll('.sidebar-content button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });
});

let alertCallback = null;
function mostrarAlerta(msg, callback) {
    document.getElementById('alert-message').innerText = msg;
    document.getElementById('custom-alert').classList.remove('hidden');
    alertCallback = callback;
}

function fecharAlerta() {
    document.getElementById('custom-alert').classList.add('hidden');
    isPaused = false; // Retira do pause ao fechar o alerta
    if (alertCallback) alertCallback();
    alertCallback = null;
}

// --- BOTÕES DA SIDEBAR ---
function pausarJogo() {
    isPaused = true;
    mostrarAlerta("Jogo Pausado!\nRespire, beba uma água e volte quando quiser.");
}

function salvarESair() {
    localStorage.setItem('saveAventura', JSON.stringify(gameState));
    isPaused = true;
    mostrarAlerta("Progresso salvo com muito amor! ❤️", () => {
        document.getElementById('btn-retomar').disabled = false;
        mostrarTela('tela-menu');
    });
}

function sairSemSalvar() {
    isPaused = true;
    mostrarAlerta("Tem certeza? O progresso não salvo será perdido.", () => {
        mostrarTela('tela-menu');
    });
}

// --- LÓGICA DA FASE 1: TERMOO ---
const PALAVRA_TERMOO = "PAMONHA";
const TENTATIVAS_MAX = 6;
let termooAtual = "";

function iniciarTermoo() {
    document.getElementById('jogo-termoo').classList.remove('hidden');
    
    if (gameState.termoo.gameOver) {
        document.getElementById('btn-proxima-fase').classList.remove('hidden');
    } else {
        document.getElementById('btn-proxima-fase').classList.add('hidden');
    }
    
    termooAtual = "";
    desenharTabuleiroTermoo();
    desenharTecladoTermoo();
    
    document.removeEventListener('keydown', handleTeclaTermoo);
    document.addEventListener('keydown', handleTeclaTermoo);
}

function desenharTabuleiroTermoo() {
    const board = document.getElementById('termoo-board');
    board.innerHTML = '';
    const tentativas = gameState.termoo.tentativas;
    
    for (let i = 0; i < TENTATIVAS_MAX; i++) {
        const row = document.createElement('div');
        row.className = 'termoo-row';
        
        let palavra = tentativas[i] || "";
        if (i === tentativas.length) palavra = termooAtual;
        
        for (let j = 0; j < PALAVRA_TERMOO.length; j++) {
            const cell = document.createElement('div');
            cell.className = 'termoo-cell';
            cell.innerText = palavra[j] || "";
            
            if (i < tentativas.length) {
                if (palavra[j] === PALAVRA_TERMOO[j]) {
                    cell.classList.add('correct');
                } else if (PALAVRA_TERMOO.includes(palavra[j])) {
                    cell.classList.add('present');
                } else {
                    cell.classList.add('absent');
                }
            }
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}

function desenharTecladoTermoo() {
    const keyboard = document.getElementById('termoo-keyboard');
    keyboard.innerHTML = '';
    const linhas = [
        ['Q','W','E','R','T','Y','U','I','O','P'],
        ['A','S','D','F','G','H','J','K','L'],
        ['ENTER','Z','X','C','V','B','N','M','BACK']
    ];

    linhas.forEach(linha => {
        const row = document.createElement('div');
        row.className = 'key-row';
        linha.forEach(tecla => {
            const btn = document.createElement('button');
            btn.className = 'key';
            btn.innerText = tecla === 'BACK' ? '⌫' : tecla;
            btn.onclick = () => processarEntradaTermoo(tecla);
            row.appendChild(btn);
        });
        keyboard.appendChild(row);
    });
}

function handleTeclaTermoo(e) {
    if (gameState.termoo.gameOver || gameState.faseAtual !== 1) return;
    if (e.key === 'Enter') processarEntradaTermoo('ENTER');
    else if (e.key === 'Backspace') processarEntradaTermoo('BACK');
    else if (/^[a-zA-Z]$/.test(e.key)) processarEntradaTermoo(e.key.toUpperCase());
}

function processarEntradaTermoo(tecla) {
    if (gameState.termoo.gameOver) return;

    if (tecla === 'BACK') {
        termooAtual = termooAtual.slice(0, -1);
    } else if (tecla === 'ENTER') {
        if (termooAtual.length === PALAVRA_TERMOO.length) {
            gameState.termoo.tentativas.push(termooAtual);
            localStorage.setItem('saveAventura', JSON.stringify(gameState));
            verificarVitoriaTermoo();
            termooAtual = "";
        } else {
            mostrarAlerta("A palavra precisa ter 7 letras, amor!");
        }
    } else if (termooAtual.length < PALAVRA_TERMOO.length) {
        termooAtual += tecla;
    }
    
    desenharTabuleiroTermoo();
}

function verificarVitoriaTermoo() {
    const ultimaTentativa = gameState.termoo.tentativas[gameState.termoo.tentativas.length - 1];
    
    if (ultimaTentativa === PALAVRA_TERMOO) {
        gameState.termoo.gameOver = true;
        gameState.coordenada[3] = ".0494";
        localStorage.setItem('saveAventura', JSON.stringify(gameState));
        
        document.getElementById('senha-revelada').innerText = gameState.coordenada.join(" ");
        document.getElementById('btn-proxima-fase').classList.remove('hidden');
        
        mostrarAlerta("Parabéns, linda! Você descobriu a palavra secreta e liberou o final da senha!");
        
    } else if (gameState.termoo.tentativas.length >= TENTATIVAS_MAX) {
        gameState.termoo.gameOver = true;
        mostrarAlerta("Poxa, acabaram as tentativas... Mas como eu te amo demais, vou apagar tudo e deixar você tentar de novo! ❤️", () => {
            gameState.termoo.tentativas = [];
            gameState.termoo.gameOver = false;
            localStorage.setItem('saveAventura', JSON.stringify(gameState));
            iniciarTermoo();
        });
    }
}

// --- LÓGICA DA FASE 2: DINO ---
let dinoCanvas, dinoCtx;
let dinoLoop;
let dino = { x: 50, y: 100, width: 20, height: 20, dy: 0, gravity: 0.6, jumpPower: -10, grounded: false };
let obstacles = [];
let dinoScore = 0;
let dinoFrame = 0;
let dinoIsPlaying = false;

function iniciarDino() {
    document.getElementById('jogo-dino').classList.remove('hidden');
    
    if (gameState.dino.gameOver) {
        document.getElementById('btn-proxima-fase').classList.remove('hidden');
    } else {
        document.getElementById('btn-proxima-fase').classList.add('hidden');
    }
    
    dinoCanvas = document.getElementById('dino-canvas');
    dinoCtx = dinoCanvas.getContext('2d');
    
    dinoScore = 0;
    obstacles = [];
    dino.y = 100;
    dino.dy = 0;
    dinoFrame = 0;
    dinoIsPlaying = !gameState.dino.gameOver;
    
    document.getElementById('dino-score').innerText = dinoScore;

    // Controles
    document.removeEventListener('keydown', dinoJumpEvent);
    document.addEventListener('keydown', dinoJumpEvent);
    dinoCanvas.onpointerdown = (e) => { e.preventDefault(); dinoJump(); }; // Funciona para Touch e Mouse

    if (dinoIsPlaying) {
        cancelAnimationFrame(dinoLoop);
        dinoUpdate();
    } else {
        desenharDinoParado();
    }
}

function dinoJumpEvent(e) {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && dinoIsPlaying) {
        e.preventDefault();
        dinoJump();
    }
}

function dinoJump() {
    if (dino.grounded && dinoIsPlaying && !isPaused) {
        dino.dy = dino.jumpPower;
        dino.grounded = false;
    }
}

function dinoUpdate() {
    if (!dinoIsPlaying || gameState.faseAtual !== 2) return;
    
    if (isPaused) {
        dinoLoop = requestAnimationFrame(dinoUpdate);
        return;
    }

    dinoCtx.clearRect(0, 0, dinoCanvas.width, dinoCanvas.height);
    
    // Desenha o Chão
    dinoCtx.beginPath();
    dinoCtx.moveTo(0, 120);
    dinoCtx.lineTo(dinoCanvas.width, 120);
    dinoCtx.strokeStyle = "#576574";
    dinoCtx.stroke();

    // Física do Dino
    dino.dy += dino.gravity;
    dino.y += dino.dy;
    
    if (dino.y + dino.height >= 120) {
        dino.y = 120 - dino.height;
        dino.dy = 0;
        dino.grounded = true;
    }

    // Desenha o Dino
    dinoCtx.fillStyle = '#ff4757';
    dinoCtx.fillRect(dino.x, dino.y, dino.width, dino.height);

    // Geração de Obstáculos
    if (dinoFrame % 80 === 0) {
        let obsHeight = Math.random() > 0.5 ? 20 : 35;
        let gap = Math.random() * 50;
        obstacles.push({ x: dinoCanvas.width + gap, y: 120 - obsHeight, width: 15, height: obsHeight });
    }

    // Movimenta e desenha obstáculos
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= 4.5;
        
        dinoCtx.fillStyle = '#2ed573';
        dinoCtx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Verifica Colisão
        if (dino.x < obs.x + obs.width && dino.x + dino.width > obs.x &&
            dino.y < obs.y + obs.height && dino.y + dino.height > obs.y) {
            
            dinoIsPlaying = false;
            isPaused = true;
            mostrarAlerta("Ai! Tropeçou! Mas no nosso amor a gente sempre levanta e tenta de novo. ❤️", () => {
                iniciarDino(); 
            });
            return; 
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }

    // Sistema de Pontuação
    dinoFrame++;
    if (dinoFrame % 4 === 0) {
        dinoScore++;
        document.getElementById('dino-score').innerText = dinoScore;
    }

    // Condição de Vitória (Mude o 1000 aqui pra testar mais rápido se quiser)
    if (dinoScore >= 1000) {
        dinoIsPlaying = false;
        gameState.dino.gameOver = true;
        gameState.coordenada[2] = "-46"; // Parte 2 da coordenada
        localStorage.setItem('saveAventura', JSON.stringify(gameState));
        
        document.getElementById('senha-revelada').innerText = gameState.coordenada.join(" ");
        document.getElementById('btn-proxima-fase').classList.remove('hidden');
        
        mostrarAlerta("UAU! 1000 pontos! Que fôlego! Você liberou mais uma parte da senha.");
        desenharDinoParado();
        return;
    }

    dinoLoop = requestAnimationFrame(dinoUpdate);
}

function desenharDinoParado() {
    dinoCtx.clearRect(0, 0, dinoCanvas.width, dinoCanvas.height);
    dinoCtx.beginPath();
    dinoCtx.moveTo(0, 120);
    dinoCtx.lineTo(dinoCanvas.width, 120);
    dinoCtx.stroke();
    dinoCtx.fillStyle = '#ff4757';
    dinoCtx.fillRect(dino.x, 120 - dino.height, dino.width, dino.height);
}

// --- LÓGICA DA FASE 3: COBRINHA ---
let snakeCanvas, snakeCtx;
let snakeLoop;
let snakeGrid = 20;
let snakeCount = 0;
let snakeScore = 0;
let snakeBody = [];
let apple = { x: 160, y: 160 };
let snakeDx = snakeGrid; // Velocidade em X
let snakeDy = 0;         // Velocidade em Y
let nextSnakeDx = snakeGrid; // Buffer para botões rápidos
let nextSnakeDy = 0;
let snakeIsPlaying = false;

function iniciarSnake() {
    document.getElementById('jogo-snake').classList.remove('hidden');
    
    if (gameState.snake.gameOver) {
        document.getElementById('btn-proxima-fase').classList.remove('hidden');
    } else {
        document.getElementById('btn-proxima-fase').classList.add('hidden');
    }

    snakeCanvas = document.getElementById('snake-canvas');
    snakeCtx = snakeCanvas.getContext('2d');

    // Estado inicial
    snakeScore = 0;
    document.getElementById('snake-score').innerText = snakeScore;
    snakeDx = snakeGrid;
    snakeDy = 0;
    nextSnakeDx = snakeGrid;
    nextSnakeDy = 0;
    snakeBody = [ { x: 160, y: 160 }, { x: 140, y: 160 }, { x: 120, y: 160 } ];
    
    gerarMaca();
    snakeIsPlaying = !gameState.snake.gameOver;

    // Controles pelo Teclado (PC)
    document.removeEventListener('keydown', handleTeclaSnake);
    document.addEventListener('keydown', handleTeclaSnake);

    if (snakeIsPlaying) {
        cancelAnimationFrame(snakeLoop);
        snakeUpdate();
    } else {
        desenharSnakeParada();
    }
}

function gerarMaca() {
    // Garante que a maçã caia alinhada no grid
    apple.x = Math.floor(Math.random() * (snakeCanvas.width / snakeGrid)) * snakeGrid;
    apple.y = Math.floor(Math.random() * (snakeCanvas.height / snakeGrid)) * snakeGrid;
}

// Controle PC
function handleTeclaSnake(e) {
    if (!snakeIsPlaying || isPaused || gameState.faseAtual !== 3) return;
    
    if (e.key === 'ArrowLeft' && snakeDx === 0) { nextSnakeDx = -snakeGrid; nextSnakeDy = 0; }
    else if (e.key === 'ArrowUp' && snakeDy === 0) { nextSnakeDx = 0; nextSnakeDy = -snakeGrid; }
    else if (e.key === 'ArrowRight' && snakeDx === 0) { nextSnakeDx = snakeGrid; nextSnakeDy = 0; }
    else if (e.key === 'ArrowDown' && snakeDy === 0) { nextSnakeDx = 0; nextSnakeDy = snakeGrid; }
    
    // Bloqueia o scroll da página se usar as setas
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}

// Controle Mobile (Botões na tela)
function mudarDirecao(dir) {
    if (!snakeIsPlaying || isPaused) return;
    if (dir === 'LEFT' && snakeDx === 0) { nextSnakeDx = -snakeGrid; nextSnakeDy = 0; }
    else if (dir === 'UP' && snakeDy === 0) { nextSnakeDx = 0; nextSnakeDy = -snakeGrid; }
    else if (dir === 'RIGHT' && snakeDx === 0) { nextSnakeDx = snakeGrid; nextSnakeDy = 0; }
    else if (dir === 'DOWN' && snakeDy === 0) { nextSnakeDx = 0; nextSnakeDy = snakeGrid; }
}

function snakeUpdate() {
    if (!snakeIsPlaying || gameState.faseAtual !== 3) return;

    // O requestAnimationFrame avisa o navegador para animar a próxima tela
    snakeLoop = requestAnimationFrame(snakeUpdate);

    if (isPaused) return;

    // Atraso para a cobrinha não correr na velocidade da luz (atualiza a cada 6 frames)
    if (++snakeCount < 6) return;
    snakeCount = 0;

    snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);

    // Aplica a direção do comando do jogador
    snakeDx = nextSnakeDx;
    snakeDy = nextSnakeDy;

    // Calcula a nova posição da cabeça
    let headX = snakeBody[0].x + snakeDx;
    let headY = snakeBody[0].y + snakeDy;

    // Efeito Pac-Man: Atravessar a parede e sair do outro lado (facilita pro celular)
    if (headX < 0) headX = snakeCanvas.width - snakeGrid;
    else if (headX >= snakeCanvas.width) headX = 0;
    if (headY < 0) headY = snakeCanvas.height - snakeGrid;
    else if (headY >= snakeCanvas.height) headY = 0;

    // Insere a nova cabeça
    snakeBody.unshift({ x: headX, y: headY });

    // Comeu a maçã/coração?
    if (headX === apple.x && headY === apple.y) {
        
        // Magia da matemática: Primeira maçã dá 226, as outras dão 500
        if (snakeScore === 0) {
            snakeScore += 226;
        } else {
            snakeScore += 500;
        }

        document.getElementById('snake-score').innerText = snakeScore;
        gerarMaca();

        // CONDIÇÃO DE VITÓRIA
        // Dica: mude o 10226 para 226 se quiser testar a vitória ganhando na primeira bolinha!
        if (snakeScore >= 10226) {
            snakeIsPlaying = false;
            gameState.snake.gameOver = true;
            gameState.coordenada[1] = ".6156,"; // Adiciona a parte 3 da senha
            localStorage.setItem('saveAventura', JSON.stringify(gameState));

            document.getElementById('senha-revelada').innerText = gameState.coordenada.join(" ");
            document.getElementById('btn-proxima-fase').classList.remove('hidden');

            mostrarAlerta("Incrível! 10.226 pontos! Nosso amor tá grandão igual essa cobrinha! Você revelou mais uma parte da senha!", () => {
                avancarFase(); // Avança automaticamente ao fechar o aviso!
            });
            desenharSnakeParada();
            return;
        }
    } else {
        // Se não comeu a maçã, remove o último pedaço da cauda para ela andar
        snakeBody.pop();
    }

    // Desenha o coração (Maçã)
    snakeCtx.font = "18px Arial";
    snakeCtx.fillText("❤️", apple.x, apple.y + 16);

    // Desenha a Cobrinha
    for (let i = 0; i < snakeBody.length; i++) {
        // Verifica se a cabeça bateu no próprio corpo
        if (i !== 0 && snakeBody[i].x === headX && snakeBody[i].y === headY) {
            snakeIsPlaying = false;
            isPaused = true;
            mostrarAlerta("Oops! Deu um nó! Mas a gente desata isso e tenta de novo. ❤️", () => {
                iniciarSnake();
            });
            return;
        }

        // Pinta a cabeça mais escura e o corpo mais claro
        snakeCtx.fillStyle = (i === 0) ? '#26de81' : '#2ed573';
        snakeCtx.fillRect(snakeBody[i].x, snakeBody[i].y, snakeGrid - 1, snakeGrid - 1);
    }
}

function desenharSnakeParada() {
    snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    for (let i = 0; i < snakeBody.length; i++) {
         snakeCtx.fillStyle = (i === 0) ? '#26de81' : '#2ed573';
         snakeCtx.fillRect(snakeBody[i].x, snakeBody[i].y, snakeGrid - 1, snakeGrid - 1);
    }
}

// --- LÓGICA DA FASE 4: JOGO DA VELHA (TIC-TAC-TOE) ---
// O tabuleiro é um grid 5x5 invisível. O centro 3x3 são os índices: 6,7,8, 11,12,13, 16,17,18
const CENTER_CELLS = [6, 7, 8, 11, 12, 13, 16, 17, 18];
let vezDoJogador = true; 
let tttAvisoEmpateMostrado = false;

function iniciarTTT() {
    document.getElementById('jogo-tictactoe').classList.remove('hidden');
    
    const btn = document.getElementById('btn-proxima-fase');
    if (gameState.ttt.gameOver) {
        btn.classList.remove('hidden');
        btn.innerText = "Ir para a tela da senha ➔";
        btn.onclick = () => {
            prepararTelaMapa();
            mostrarTela('tela-mapa');
        };
    } else {
        btn.classList.add('hidden');
    }

    vezDoJogador = true;
    tttAvisoEmpateMostrado = false;
    desenharBoardTTT();
}

function desenharBoardTTT() {
    const board = document.getElementById('ttt-board');
    board.innerHTML = '';

    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'ttt-cell';
        
        if (CENTER_CELLS.includes(i)) cell.classList.add('center-cell');
        
        if (gameState.ttt.board[i] === 'X') { cell.innerText = 'X'; cell.classList.add('x'); } 
        else if (gameState.ttt.board[i] === 'O') { cell.innerText = 'O'; cell.classList.add('o'); }

        cell.onclick = () => {
            if (gameState.ttt.gameOver || gameState.ttt.board[i] !== '' || !vezDoJogador) return;
            jogarTTT(i, 'X');
        };
        board.appendChild(cell);
    }
}

function jogarTTT(index, jogador) {
    gameState.ttt.board[index] = jogador;
    localStorage.setItem('saveAventura', JSON.stringify(gameState));
    desenharBoardTTT();

    if (verificarVitoriaTTT(jogador)) {
        gameState.ttt.gameOver = true;
        localStorage.setItem('saveAventura', JSON.stringify(gameState));
        
        if (jogador === 'X') {
            gameState.coordenada[0] = "-20"; // Primeira parte da coordenada
            document.getElementById('senha-revelada').innerText = gameState.coordenada.join("");
            
            mostrarAlerta("VOCÊ CONSEGUIU! Ao invés de aceitar as regras, você criou as suas, assim como nosso amor! A senha está completa!", () => {
                const btn = document.getElementById('btn-proxima-fase');
                btn.classList.remove('hidden');
                btn.innerText = "Ir para a tela da senha ➔";
                btn.onclick = () => {
                    prepararTelaMapa();
                    mostrarTela('tela-mapa');
                };
            });
        }
        return;
    }

    if (jogador === 'X') {
        vezDoJogador = false;
        setTimeout(jogadaIA, 500);
    }
}

function verificarVitoriaTTT(j) {
    const b = gameState.ttt.board;
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            let i = r * 5 + c;
            if (c <= 2 && b[i] === j && b[i+1] === j && b[i+2] === j) return true;
            if (r <= 2 && b[i] === j && b[i+5] === j && b[i+10] === j) return true;
            if (r <= 2 && c <= 2 && b[i] === j && b[i+6] === j && b[i+12] === j) return true;
            if (r <= 2 && c >= 2 && b[i] === j && b[i+4] === j && b[i+8] === j) return true;
        }
    }
    return false;
}

function jogadaIA() {
    let availableCenter = CENTER_CELLS.filter(i => gameState.ttt.board[i] === '');
    
    if (availableCenter.length === 0) {
        vezDoJogador = true;
        if (!tttAvisoEmpateMostrado) {
            tttAvisoEmpateMostrado = true;
            mostrarAlerta("O jogo empatou no tabuleiro normal... A máquina parou de jogar, mas será que acabou? Tente clicar FORA DA CAIXA no espaço em branco ao redor!");
        }
        return;
    }

    const b = gameState.ttt.board;
    let jogadaMestra = -1;

    for (let i of availableCenter) { b[i] = 'O'; if (verificarVitoriaTTT('O')) jogadaMestra = i; b[i] = ''; }
    if (jogadaMestra === -1) { for (let i of availableCenter) { b[i] = 'X'; if (verificarVitoriaTTT('X')) jogadaMestra = i; b[i] = ''; } }
    if (jogadaMestra === -1 && b[12] === '') jogadaMestra = 12;
    if (jogadaMestra === -1) {
        const corners = [6, 8, 16, 18].filter(i => b[i] === '');
        if (corners.length > 0) jogadaMestra = corners[Math.floor(Math.random() * corners.length)];
    }
    if (jogadaMestra === -1) jogadaMestra = availableCenter[Math.floor(Math.random() * availableCenter.length)];

    jogarTTT(jogadaMestra, 'O');
    vezDoJogador = true;
}
