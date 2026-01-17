const BOARD_SIZE = 8;
const BLACK = 'black';
const WHITE = 'white';
const GRAY = 'gray'; // 50-koma color
const VERSION = 'v2.1.0-50koma';

class Reversi {
    constructor() {
        this.board = [];
        this.currentPlayer = BLACK;
        this.gameOver = false;
        // Multiplayer state
        this.gameId = null;
        this.myRole = null; // 'black' or 'white'
        this.isOnline = false;

        // DOM Elements
        this.boardElement = document.getElementById('board');
        this.scoreBlackEl = document.getElementById('score-black');
        this.scoreWhiteEl = document.getElementById('score-white');
        this.statusEl = document.getElementById('status-message');
        this.restartBtn = document.getElementById('restart-btn');
        this.langSelect = document.getElementById('lang-select');
        this.lobbyLangSelect = document.getElementById('lobby-lang-select');

        // Multiplayer DOM
        this.lobbyOverlay = document.getElementById('lobby');
        this.gameContainer = document.getElementById('game-container');
        this.createGameBtn = document.getElementById('create-game-btn');
        this.joinGameBtn = document.getElementById('join-game-btn');
        this.joinInput = document.getElementById('join-game-input');
        this.lobbyStatus = document.getElementById('lobby-status');
        this.gameInfoDisplay = document.getElementById('game-info-display');
        this.opponentStatusEl = document.getElementById('opponent-status');
        this.lobbyStatus = document.getElementById('lobby-status');
        this.gameInfoDisplay = document.getElementById('game-info-display');
        this.opponentStatusEl = document.getElementById('opponent-status');
        this.versionEl = document.getElementById('version-display');

        // Quantum UI Elements
        this.btn50 = document.getElementById('btn-50');
        this.btn70 = document.getElementById('btn-70');
        this.btn90 = document.getElementById('btn-90');
        this.btn100 = document.getElementById('btn-100');
        this.btnObserve = document.getElementById('btn-observe');
        this.btnPass = document.getElementById('btn-pass');

        // Lobby Elements
        this.toggle50Koma = document.getElementById('toggle-50koma');

        // Help UI Elements
        this.btnHelp = document.getElementById('btn-help');
        this.helpModal = document.getElementById('help-modal');
        this.closeHelpBtn = document.getElementById('close-help');
        this.helpTitle = document.getElementById('help-title');
        this.helpBody = document.getElementById('help-body');

        this.passNotification = document.getElementById('pass-notification');

        // New Selectors
        this.gameModeSelect = document.getElementById('game-mode-select');
        this.turnSelect = document.getElementById('turn-select');


        this.observationsLeft = { [BLACK]: 2, [WHITE]: 2 };
        this.selectedType = 100; // Default
        this.isProcessingCpu = false;
        this.moveHistory = []; // Debug

        // Debug Listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'd' || e.key === 'D') {
                if (confirm(this.translations[this.currentLang].confirmExport || "Export debug data?")) {
                    if (this.exportDebugData) this.exportDebugData();
                }
            }
        });

        this.lastMoveType = { [BLACK]: null, [WHITE]: null };

        // Turn tracking for observation cooldown
        this.currentTurn = 0;
        this.lastObservationTurn = { [BLACK]: -Infinity, [WHITE]: -Infinity };

        // 50-koma usage tracking
        this.hasUsed50 = { [BLACK]: false, [WHITE]: false };
        this.enable50Koma = true; // Default to true

        this.currentLang = 'en';

        this.translations = {
            en: {
                title: 'Quversi',
                black: 'Black',
                white: 'White',
                newGame: 'New Game',
                turnBlack: "Black's Turn",
                turnWhite: "White's Turn",
                yourTurn: "Your Turn!",
                opponentTurn: "Opponent's Turn",
                waitingForOpponent: "Waiting for opponent...",
                pass: (player) => `${player} passed!`,
                winBlack: 'Black Wins!',
                winWhite: 'White Wins!',
                draw: 'Draw!',
                youAre: (color) => `You are playing as ${color}`,
                gameId: (id) => `Game ID: ${id}`,
                online: 'Opponent: Online 🟢',
                offline: 'Opponent: Offline ⚪',
                observe: (count) => `Observe (${count})`,
                passMsg: 'No valid moves! Passing turn...',
                helpTitle: 'Quantum Rules',
                helpContent: `
                    <h3>Piece Types</h3>
                    <ul>
                        <li><strong>70%</strong>: Can be placed anywhere. (Stable foundation)</li>
                    <ul>
                        <li><strong>90%</strong>: Placeable if you have fewer 90s than 70s.</li>
                        <li><strong>100%</strong>: Placeable if fewer 100s than 90s AND your last move was a 70% piece.</li>
                        <li><strong>50% (Joker)</strong>: Unlocks on Turn 4 (charged pie chart). Usable ONCE. Can be used to skip if no moves.</li>
                    </ul>
                    <h3>Observation (The Key!)</h3>
                    <p><strong>Placing pieces (even 70%/90%) instantly flips opponent's pieces</strong> just like normal Reversi.</p>
                    <p>However, <strong>Observe</strong> (button) forces all quantum pieces (70% & 90%) to "collapse" to a single color (or disappear) based on their probability.</p>
                    <ul>
                        <li><strong>90% Piece</strong>: 10% chance to flip color when observed.</li>
                        <li><strong>70% Piece</strong>: 30% chance to flip color when observed.</li>
                    </ul>
                    <p>You have <strong>2 Observations</strong> per game. Use them wisely to potentially disrupt your opponent's board!</p>
                `,
                // Lobby Status
                creatingGame: "Creating game...",
                createError: "Error creating game. Check config.",
                joining: "Joining...",
                gameFull: "Game is full.",
                idNotFound: "Game ID not found.",
                joinError: "Failed to join game.",

                // New UI
                lobbyTitle: "Game Lobby",
                lobbyStatus: "Select a mode to start",
                createGame: "Start Game",
                joinGame: "Join",
                modeLabel: "Mode:",
                modePvP: "Online PvP",
                modeCpuEasy: "CPU (Easy)",
                modeCpuNormal: "CPU (Normal)",
                modeCpuHard: "CPU (Hard)",
                turnLabel: "Your Turn:",
                turnBlack: "First (Black)",
                turnWhite: "Second (White)",
                turnRandom: "Random",
                or: "OR",
                enterIdPlaceholder: "Game ID",

                // CPU Status
                cpuThinking: "CPU is thinking...",
                cpuObserving: "CPU is Observing!",
                restart: "Restart Game",
                // 50-koma
                enable50Koma: "Enable 50% Koma",
                noValidMoves: "No Valid Moves",
                passConfirm: "You have no normal moves available. Would you like to use your 50-koma or pass?",
                use50: "Use 50-koma",
                passSave: "Pass (Save 50%)",
                use50: "Use 50-koma",
                passSave: "Pass (Save 50%)",
                selected50: "Selected 50-koma. Place your piece.",
                confirmExport: "Do you want to download the debug data?"
            },
            ja: {
                title: 'Quversi',
                black: '黒',
                white: '白',
                newGame: '新しいゲーム',
                turnBlack: '黒の番です',
                turnWhite: '白の番です',
                yourTurn: "あなたの番です！",
                opponentTurn: "相手の番です",
                waitingForOpponent: "対戦相手を待っています...",
                pass: (player) => `${player}はパスしました！`,
                winBlack: '黒の勝ち！',
                winWhite: '白の勝ち！',
                draw: '引き分け！',
                youAre: (color) => `あなたは${color}です`,
                gameId: (id) => `ゲームID: ${id}`,
                online: '対戦相手：オンライン 🟢',
                offline: '対戦相手：オフライン ⚪',
                observe: (count) => `観測 (${count})`,
                observe: (count) => `観測 (${count})`,
                passMsg: '置ける場所がありません！パスします...',
                helpTitle: 'Quversiのルール',
                confirmExport: "デバッグデータをダウンロードしますか？",
                helpContent: `
                    <h3>コマの種類</h3>
                    <ul>
                        <li><strong>70%コマ</strong>: いつでも置けます（土台になります）。</li>
                        <li><strong>90%コマ</strong>: 盤面の「自分の70%コマ」より少ない時だけ置けます。</li>
                        <li><strong>100%コマ</strong>: 盤面の「自分の90%コマ」より少なく、かつ<em>自分の一つ前の手が70%コマ</em>の時だけ置けます。</li>
                    </ul>
                    <h3>「観測」について (重要！)</h3>
                    <p><strong>70%コマや90%コマを置いた際も、通常のリバーシ同様に相手のコマを挟んでひっくり返せます。</strong></p>
                    <p><strong>「観測」ボタン</strong>を押すと、盤上のすべての量子コマ（70%, 90%）の状態が確定します。</p>
                    <ul>
                        <li><strong>90%コマ</strong>: 10%の確率で色が反転します。</li>
                        <li><strong>70%コマ</strong>: 30%の確率で色が反転します。</li>
                    </ul>

                    <h3>50%コマ (ジョーカー)</h3>
                    <p>4ターン目でチャージ完了（円グラフ）。<strong>1回だけ</strong>使えます。</p>
                    <p><strong>特徴:</strong></p>
                    <ul>
                        <li><strong>自分または相手が置ける場所</strong>ならどこにでも置けます（お邪魔キャラとして使用可能！）</li>
                        <li><strong>双方の色として機能</strong>するため、接する相手の石を挟めます。</li>
                        <li><strong>50%コマ自体は反転しません</strong>（置いた瞬間は確定しないため）。</li>
                        <li>観測すると、50%の確率で黒または白に確定します。</li>
                    </ul>
                    <p>観測は1ゲームにつき<strong>2回</strong>まで使えます（50%コマ使用とは別カウントです）。</p>

                `,
                // Lobby Status
                creatingGame: "ゲームを作成中...",
                createError: "作成に失敗しました。設定を確認してください。",
                joining: "参加中...",
                gameFull: "満員です。",
                idNotFound: "ゲームIDが見つかりません。",
                joinError: "ゲームに参加できませんでした",

                // New UI
                lobbyTitle: "ゲームロビー",
                lobbyStatus: "モードを選択して開始してください",
                createGame: "ゲーム開始",
                joinGame: "参加",
                modeLabel: "モード:",
                modePvP: "オンライン対戦",
                modeCpuEasy: "CPU (初級)",
                modeCpuNormal: "CPU (中級)",
                modeCpuHard: "CPU (上級)",
                turnLabel: "手番:",
                turnBlack: "先攻 (黒)",
                turnWhite: "後攻 (白)",
                turnRandom: "ランダム",
                or: "または",
                enterIdPlaceholder: "ゲームIDを入力",

                // CPU Status
                cpuThinking: "CPU思考中...",
                cpuObserving: "CPUが観測しました！",
                restart: "リスタート",
                // 50-koma
                enable50Koma: "50%コマを有効化",
                noValidMoves: "有効な手がありません",
                passConfirm: "通常の手がありません。50%コマを使いますか？それともパス（温存）しますか？",
                use50: "50%コマを使う",
                passSave: "パス (50%を温存)",
                selected50: "50%コマを選択しました。配置してください。"
            }
        };

        this.init();
    }

    init() {
        if (this.versionEl) this.versionEl.textContent = VERSION;
        // Quantum Refactor: Board stores objects or null
        this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        this.currentPlayer = BLACK;

        // Initial setup (Standard Othello setup but with Quantum Objects)
        // Standard start pieces are usually considered "stable" (100) and "observed" (true)
        const mid = BOARD_SIZE / 2;
        this.board[mid - 1][mid - 1] = { color: WHITE, type: 100, observed: true };
        this.board[mid][mid] = { color: WHITE, type: 100, observed: true };
        this.board[mid - 1][mid] = { color: BLACK, type: 100, observed: true };
        this.board[mid][mid - 1] = { color: BLACK, type: 100, observed: true };

        // Reset Quantum State
        this.observationsLeft = { [BLACK]: 2, [WHITE]: 2 };
        this.observedThisTurn = false; // Track if observation was used this turn
        this.selectedType = 100;
        this.lastMoveType = { [BLACK]: null, [WHITE]: null };

        // Turn tracking for observation cooldown
        this.currentTurn = 0;
        this.lastObservationTurn = { [BLACK]: -Infinity, [WHITE]: -Infinity };

        // 50-koma usage tracking
        this.hasUsed50 = { [BLACK]: false, [WHITE]: false };

        // Mode Change Listener (Hide 50-koma toggle for CPU)
        if (this.gameModeSelect) {
            this.gameModeSelect.addEventListener('change', () => this.updateLobbyUI());
        }
        this.updateLobbyUI(); // Initial check

        this.restartBtn.addEventListener('click', () => this.resetGame());
        // Language Selector
        const handleLangChange = (e) => {
            const newLang = e.target.value;
            this.setLanguage(newLang);
            // Sync selectors
            if (this.langSelect) this.langSelect.value = newLang;
            if (this.lobbyLangSelect) this.lobbyLangSelect.value = newLang;
        };

        if (this.langSelect) {
            this.langSelect.addEventListener('change', handleLangChange);
        }

        if (this.lobbyLangSelect) {
            this.lobbyLangSelect.addEventListener('change', handleLangChange);
        }// Multiplayer Listeners
        this.createGameBtn.addEventListener('click', () => this.createGame());
        this.joinGameBtn.addEventListener('click', () => this.joinGame());

        // Quantum Listeners
        this.btn50.addEventListener('click', () => this.selectType(50));
        this.btn70.addEventListener('click', () => this.selectType(70));
        this.btn90.addEventListener('click', () => this.selectType(90));
        this.btn100.addEventListener('click', () => this.selectType(100));
        this.btnObserve.addEventListener('click', () => this.handleObserve());
        // this.btnPass.addEventListener('click', () => this.passTurn()); // Removed manual button listener
        // Force hide btnPass logic just in case CSS fails?
        this.btnPass.style.display = 'none'; // Explicitly hide inline if needed, or rely on hidden class + updateControlsState

        // Help Listeners
        this.btnHelp.addEventListener('click', () => this.toggleHelp(true));
        this.closeHelpBtn.addEventListener('click', () => this.toggleHelp(false));
        // Close modal when clicking outside content
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) this.toggleHelp(false);
        });

        this.renderBoard();
        this.updateUI();
        this.updateHelpContent(); // Initial set
        this.restartBtn.textContent = this.translations[this.currentLang].restart;
    }

    toggleHelp(show) {
        if (show) this.helpModal.classList.remove('hidden');
        else this.helpModal.classList.add('hidden');
    }

    updateHelpContent() {
        this.helpTitle.textContent = this.translations[this.currentLang].helpTitle;
        this.helpBody.innerHTML = this.translations[this.currentLang].helpContent;
    }

    setLanguage(lang) {
        this.currentLang = lang;
        const tr = this.translations[lang];

        // Update static elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (tr[key]) {
                if (el.tagName === 'INPUT' && el.type === 'text') { // Assuming placeholder is for text input
                    el.placeholder = tr[key];
                } else {
                    el.textContent = tr[key];
                }
            }
        });

        // Update 50-koma toggle label separately if needed (it's inside a span)
        const toggleSpan = document.querySelector('label[for="toggle-50koma"] span');
        if (toggleSpan) toggleSpan.textContent = tr.enable50Koma;

        this.restartBtn.textContent = tr.restart;
        this.updateHelpContent();
        this.updateControlsState(); // Added this call
        this.updateUI();
    }

    showPassNotification() {
        if (this.currentPlayer !== this.myRole) return; // Safety check
        this.passNotification.textContent = this.translations[this.currentLang].passMsg;
        this.passNotification.classList.remove('hidden');
    }

    hidePassNotification() {
        this.passNotification.classList.add('hidden');
    }

    isCpuMatch() {
        return this.gameMode && this.gameMode.startsWith('cpu');
    }

    // --- Multiplayer Logic ---

    generateGameId() {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    async createGame() {
        this.gameId = this.generateGameId();

        // Read Settings
        const modeVal = this.gameModeSelect.value; // pvp, cpu-easy, cpu-hard
        const turnVal = this.turnSelect.value; // black, white, random

        // Force disable 50-koma if CPU mode, otherwise use toggle
        if (modeVal.startsWith('cpu')) {
            this.enable50Koma = false;
        } else {
            this.enable50Koma = this.toggle50Koma ? this.toggle50Koma.checked : true;
        }

        // Determine My Role
        if (turnVal === 'random') {
            this.myRole = Math.random() < 0.5 ? BLACK : WHITE;
        } else {
            this.myRole = turnVal;
        }

        this.gameMode = modeVal;
        this.isOnline = true; // Even CPU games use Firebase as requested
        this.cpuInstance = null;

        // Initialize CPU if needed
        if (this.gameMode === 'cpu-easy') {
            this.cpuInstance = new window.CpuEasy(this);
        } else if (this.gameMode === 'cpu-normal') {
            this.cpuInstance = new window.CpuNormal(this);
        } else if (this.gameMode === 'cpu-hard') {
            this.cpuInstance = new window.CpuHard(this);
        }

        this.lobbyStatus.textContent = this.translations[this.currentLang].creatingGame;

        try {
            // Reset Game State for New Game
            this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
            const mid = BOARD_SIZE / 2;
            this.board[mid - 1][mid - 1] = { color: WHITE, type: 100, observed: true };
            this.board[mid - 1][mid] = { color: BLACK, type: 100, observed: true };
            this.board[mid][mid - 1] = { color: BLACK, type: 100, observed: true };
            this.board[mid][mid] = { color: WHITE, type: 100, observed: true };

            this.hasUsed50 = { [BLACK]: false, [WHITE]: false };
            this.observationsLeft = { [BLACK]: 2, [WHITE]: 2 };
            this.lastMoveType = { [BLACK]: null, [WHITE]: null };
            this.lastObservationTurn = { [BLACK]: -Infinity, [WHITE]: -Infinity };
            this.currentTurn = 0;

            // Prepare safe board data (now clean)
            const safeBoard = this.board.map(row => row.map(cell => cell || ""));

            await window.db.ref('games/' + this.gameId).set({
                board: safeBoard,
                currentPlayer: BLACK, // Black always starts
                lastMoveType: { [BLACK]: null, [WHITE]: null },
                observationsLeft: { [BLACK]: 2, [WHITE]: 2 },
                status: 'waiting',
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                gameMode: this.gameMode,
                hostRole: this.myRole, // Save host role so joiner knows what to be
                enable50Koma: this.enable50Koma // Store 50-koma setting
            });

            // If playing against CPU and CPU is Black (First), trigger CPU move?
            // CPU trigger will be handled in startGameListener or separate logic.

            this.lobbyOverlay.classList.add('hidden');
            this.gameContainer.classList.remove('hidden');
            this.setupPresence();
            this.startGameListener();
            this.updateUI();
        } catch (e) {
            console.error(e);
            this.lobbyStatus.textContent = this.translations[this.currentLang].createError;
        }
    }

    async joinGame() {
        const id = this.joinInput.value.trim().toUpperCase();
        if (!id) return;

        this.lobbyStatus.textContent = this.translations[this.currentLang].joining;

        try {
            const snapshot = await window.db.ref('games/' + id).once('value');
            if (snapshot.exists()) {
                const data = snapshot.val();

                if (data.status === 'full') {
                    this.lobbyStatus.textContent = this.translations[this.currentLang].gameFull;
                    return;
                }

                // Block joining CPU games as a player (Spectator mode not requested yet)
                if (data.gameMode && data.gameMode !== 'pvp') {
                    this.lobbyStatus.textContent = "Cannot join CPU game";
                    return;
                }

                // Determine Role based on Host's choice
                if (data.hostRole) {
                    this.myRole = (data.hostRole === BLACK) ? WHITE : BLACK;
                } else {
                    this.myRole = WHITE; // Default for legacy games
                }

                this.gameId = id;
                this.isOnline = true;
                this.enable50Koma = data.enable50Koma !== undefined ? data.enable50Koma : true; // Sync 50-koma setting

                await window.db.ref('games/' + id).update({
                    status: 'full',
                    // presence logic handles connection
                });

                this.lobbyOverlay.classList.add('hidden');
                this.gameContainer.classList.remove('hidden');
                this.setupPresence();
                this.startGameListener();
                this.updateUI();
            } else {
                this.lobbyStatus.textContent = this.translations[this.currentLang].idNotFound;
            }
        } catch (e) {
            console.error(e);
            this.lobbyStatus.textContent = this.translations[this.currentLang].joinError;
        }
    }

    sanitizeBoard(remoteBoard) {
        // Always return a valid 8x8 array with nulls
        const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

        if (!remoteBoard) return newBoard;

        for (let r = 0; r < BOARD_SIZE; r++) {
            if (remoteBoard[r]) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    const val = remoteBoard[r][c];
                    // If it's an object (our piece) or valid non-empty
                    if (val && typeof val === 'object') {
                        newBoard[r][c] = val;
                    }
                    // Ignore "" or null/undefined
                }
            }
        }
        return newBoard;
    }

    setupPresence() {
        // Handle my presence
        const presenceRef = window.db.ref(`games/${this.gameId}/presence/${this.myRole}`);
        const connectedRef = window.db.ref('.info/connected');

        connectedRef.on('value', (snap) => {
            if (snap.val() === true) {
                presenceRef.onDisconnect().remove();
                presenceRef.set(true);
            }
        });

        // Track opponent presence
        const opponentRole = this.myRole === BLACK ? WHITE : BLACK;
        window.db.ref(`games/${this.gameId}/presence/${opponentRole}`).on('value', (snap) => {
            const isOnline = snap.val() === true;
            this.updatePresenceUI(isOnline);
        });
    }

    updatePresenceUI(isOnline) {
        if (!this.opponentStatusEl) return;

        const text = isOnline ? this.translations[this.currentLang].online : this.translations[this.currentLang].offline;
        this.opponentStatusEl.textContent = text;

        this.opponentStatusEl.className = 'status-badge ' + (isOnline ? 'status-online' : 'status-offline');
    }

    startGameListener() {
        window.db.ref('games/' + this.gameId).on('value', (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            // Update local state from DB
            this.board = this.sanitizeBoard(data.board);
            this.currentPlayer = data.currentPlayer;
            this.gameOver = !!data.winner;

            if (data.observationsLeft) this.observationsLeft = data.observationsLeft;
            if (data.lastMoveType) this.lastMoveType = data.lastMoveType;
            if (data.lastMoveType) this.lastMoveType = data.lastMoveType;
            if (data.hasUsed50) this.hasUsed50 = data.hasUsed50; // Sync 50-koma usage
            if (data.enable50Koma !== undefined) this.enable50Koma = data.enable50Koma; // Sync 50-koma setting

            // Sync Board UI
            this.refreshBoardDisplay();
            this.updateUI(); // This handles turn updates

            // Handle Animation Event (Roulette)
            if (data.animationEvent && data.animationEvent.timestamp > (this.lastAnimationTimestamp || 0)) {
                this.lastAnimationTimestamp = data.animationEvent.timestamp;
                // Run animation (no await, let it float)
                this.playRouletteAnimation(data.animationEvent.updates);
            }

            // Check for PASS condition (My Turn + No Moves)
            if (!this.gameOver && this.isOnline && this.currentPlayer === this.myRole) {
                if (!this.hasValidMoves(this.myRole)) {
                    // Check if opponent has moves to decide if it's a PASS or GAME OVER
                    const opponent = this.myRole === BLACK ? WHITE : BLACK;

                    // Note: We need to know if opponent has moves. 
                    // But technically if I have no moves, I must pass.
                    // If opponent ALSO has no moves, then game ends.
                    // But if I pass, the opponent will get the turn.
                    // If they have no moves, their client will see "Pass" or "Game Over".
                    // Standard Othello: Game ends when BOTH cannot move.

                    if (this.hasValidMoves(opponent)) {
                        // Pass
                        this.showPassNotification();
                        setTimeout(() => {
                            this.currentPlayer = opponent;
                            this.updateDB();
                            this.hidePassNotification();
                        }, 3000);
                    } else {
                        // Game Over (Both stuck)
                        this.finishGame();
                    }
                }
            }

            // If game over from DB
            if (data.winner) {
                this.gameOver = true;
                this.endGame(data.winner);
            } else {
                this.updateUI();

                if (this.gameMode && this.gameMode.startsWith('cpu')) {
                    if (this.currentPlayer !== this.myRole) {
                        this.processCpuTurn();
                    } else {
                        // Check Human Turn
                        this.checkHumanTurn();
                    }
                } else {
                    // PvP
                    this.checkHumanTurn();
                }
            }
        });
    }

    async processCpuTurn() {
        if (this.isProcessingCpu) return;
        this.isProcessingCpu = true;

        try {
            if (!this.cpuInstance) {
                console.log("Initializing CPU Mode:", this.gameMode); // Debug Log
                if (this.gameMode === 'cpu-easy') this.cpuInstance = new window.CpuEasy(this);
                else if (this.gameMode === 'cpu-normal') this.cpuInstance = new window.CpuNormal(this);
                else this.cpuInstance = new window.CpuHard(this);
            }

            let turnActive = true;
            while (turnActive) {
                // Show thinking status
                const indicator = document.getElementById('turn-indicator');
                if (indicator) {
                    indicator.textContent = (this.currentPlayer === BLACK ? "Black" : "White") +
                        ` (${this.translations[this.currentLang].cpuThinking})`;
                }

                // 1s Delay before EACH action (Observe or Move)
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Debug: Log flag state before decideMove
                console.log(`[CPU Turn] observedThisTurn before decideMove: ${this.observedThisTurn}`);

                const decision = await this.cpuInstance.decideMove();

                if (decision && decision.action === 'observe') {
                    // CPU Observe
                    this.showNotification(this.translations[this.currentLang].cpuObserving);
                    this.handleObserve(); // Decrements count, updates board
                    this.updateDB(); // Checkpoint state

                    // CRITICAL: Ensure flag is set (defensive programming)
                    // handleObserve() already sets this.observedThisTurn = true
                    if (!this.observedThisTurn) {
                        console.error("BUG: observedThisTurn not set after handleObserve!");
                        this.observedThisTurn = true;
                    }

                    // Debug: Confirm flag is set
                    console.log(`[CPU Turn] observedThisTurn after observe: ${this.observedThisTurn}`);

                    // turnActive remains true -> Loop back to Move
                    // Small extra delay after observation to let user see it
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } else if (decision) {
                    // Move - Pass type directly to executeMove without setting this.selectedType
                    this.executeMove(decision.r, decision.c, this.currentPlayer, decision.type);

                    this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
                    this.updateDB();
                    turnActive = false; // Turn Ends

                } else {
                    // Pass
                    const cpuRoleName = (this.currentPlayer === BLACK) ?
                        this.translations[this.currentLang].black :
                        this.translations[this.currentLang].white;

                    this.showNotification(this.translations[this.currentLang].pass(cpuRoleName));

                    await new Promise(resolve => setTimeout(resolve, 2000));

                    this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
                    this.updateDB();
                    // No need to hidePassNotification as we used showNotification (toast)
                    turnActive = false; // Turn Ends
                }
            }

        } catch (e) {
            console.error("CPU Error:", e);
        } finally {
            this.isProcessingCpu = false;
            // Restore indicator text logic handled by updateUI usually
        }
    }

    checkHumanTurn() {
        if (this.gameOver || this.isCpuMatch() && this.currentPlayer !== this.myRole) return;

        // This is called after turn update.
        // Check if current player has normal moves.
        const hasNormal = this.hasNormalMoves(this.currentPlayer);

        if (!hasNormal) {
            const has50 = this.has50Moves(this.currentPlayer);
            if (has50) {
                // Show Choice Modal
                this.showPassOptionsModal();
            } else {
                // Standard Pass
                this.showNotification(this.translations[this.currentLang].pass(
                    this.currentPlayer === BLACK ? this.translations[this.currentLang].black : this.translations[this.currentLang].white
                ));
                setTimeout(() => this.passTurn(), 2000);
            }
        }
    }

    showPassOptionsModal() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '2000';

        const content = document.createElement('div');
        content.style.backgroundColor = '#1e1e1e';
        content.style.padding = '24px';
        content.style.borderRadius = '12px';
        content.style.textAlign = 'center';
        content.style.maxWidth = '90%';
        content.style.width = '350px';
        content.style.border = '1px solid #444';

        const tr = this.translations[this.currentLang];

        const title = document.createElement('h3');
        title.textContent = tr.noValidMoves;
        title.style.color = '#fff';
        title.style.marginBottom = '12px';

        const desc = document.createElement('p');
        desc.textContent = tr.passConfirm;
        desc.style.color = '#ccc';
        desc.style.marginBottom = '20px';

        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.gap = '12px';
        btnGroup.style.justifyContent = 'center';

        const btnUse50 = document.createElement('button');
        btnUse50.textContent = tr.use50;
        btnUse50.className = 'btn-small';
        btnUse50.style.background = '#3498db';
        btnUse50.onclick = () => {
            document.body.removeChild(overlay);
            this.selectType(50);
            this.showNotification(tr.selected50);
        };

        const btnPass = document.createElement('button');
        btnPass.textContent = tr.passSave;
        btnPass.className = 'btn-small';
        btnPass.style.background = '#e74c3c'; // Red for pass
        btnPass.onclick = () => {
            document.body.removeChild(overlay);
            this.passTurn();
        };

        btnGroup.appendChild(btnUse50);
        btnGroup.appendChild(btnPass);
        content.appendChild(title);
        content.appendChild(desc);
        content.appendChild(btnGroup);
        overlay.appendChild(content);

        document.body.appendChild(overlay);
    }

    showNotification(msg) {
        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.textContent = msg;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 2000);
    }

    updateDB() {
        if (!this.isOnline) return;
        // Map null to "" for Firebase sparse array prevention
        const safeBoard = this.board.map(row => row.map(cell => cell || ""));
        window.db.ref('games/' + this.gameId).update({
            board: safeBoard,
            currentPlayer: this.currentPlayer,
            observationsLeft: this.observationsLeft,
            hasUsed50: this.hasUsed50, // Sync usage
            lastMoveType: this.lastMoveType || {},
            enable50Koma: this.enable50Koma // Persist 50-koma setting
        });
    }

    // --- Game Logic ---

    // Quantum Helper: Count specific types for a player
    countPieceTypes(player) {
        let counts = { 70: 0, 90: 0, 100: 0 };
        if (!this.board) return counts;

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = this.board[r][c];
                // Only count Unobserved (Quantum) pieces for the hierarchy limit
                if (cell && cell.color === player && !cell.observed) {
                    if (cell.type === 70) counts[70]++;
                    else if (cell.type === 90) counts[90]++;
                    else if (cell.type === 100) counts[100]++;
                }
            }
        }
        return counts;
    }

    selectType(type) {
        if (this.currentPlayer !== this.myRole && this.isOnline) return; // Prevent changing if not my turn (visual only)

        this.selectedType = type;

        // Update UI
        this.btn50.classList.toggle('active', type === 50);
        this.btn70.classList.toggle('active', type === 70);
        this.btn90.classList.toggle('active', type === 90);
        this.btn100.classList.toggle('active', type === 100);

        this.updateControlsState(); // Trigger visual update (especially for 50-koma styles)
        this.updateValidMoves(); // Refresh valid move highlights (crucial for 50-koma)
    }

    updateControlsState() {
        if (!this.board) return;

        const counts = this.countPieceTypes(this.currentPlayer);
        const myTurn = !this.isOnline || (this.currentPlayer === this.myRole);

        const targetPlayer = (this.isOnline && this.myRole) ? this.myRole : this.currentPlayer;

        // Update Observation Button
        const obsLeft = this.observationsLeft[targetPlayer];
        const displayLeft = (obsLeft !== undefined) ? obsLeft : 0;

        // Use translation function
        this.btnObserve.textContent = this.translations[this.currentLang].observe(displayLeft);
        this.btnObserve.disabled = !myTurn || this.observationsLeft[this.currentPlayer] <= 0 || this.gameOver;

        if (!myTurn) {
            this.btn50.disabled = true;
            this.btn70.disabled = true;
            this.btn90.disabled = true;
            this.btn100.disabled = true;
            this.btnPass.classList.add('hidden'); // Hide pass button if not my turn
            return;
        }

        // Rule: 90 allowed if count(90) < count(70)
        // Rule: 100 allowed if count(100) < count(90) AND lastMoveType[player] === 70
        // Rule: 70 always allowed

        const lastWas70 = this.lastMoveType[this.currentPlayer] === 70;
        const can90 = counts[90] <= counts[70];
        const can100 = (counts[100] <= counts[90]) && lastWas70;

        // 50-koma logic & Visuals
        const unlockTurn = 4;
        const currentT = this.currentTurn;
        const can50 = this.enable50Koma && (currentT >= unlockTurn) && !this.hasUsed50[this.currentPlayer] && !this.isCpuMatch();

        this.btn50.disabled = !can50;

        // Reset styling defaults
        this.btn50.style.background = '';
        this.btn50.style.color = '';
        this.btn50.style.border = '';
        this.btn50.style.boxShadow = '';
        this.btn50.style.textShadow = '';
        this.btn50.style.fontSize = '';

        if (!this.enable50Koma || this.isCpuMatch()) {
            if (this.isCpuMatch()) {
                this.btn50.style.display = 'none';
            }
        } else {
            this.btn50.style.display = 'flex'; // Ensure visible

            if (this.hasUsed50[this.currentPlayer]) {
                this.btn50.textContent = "Used";
                this.btn50.style.background = '#333';
                this.btn50.style.color = '#777';
                this.btn50.style.border = '1px solid #444';
            } else if (currentT < unlockTurn) {
                // CHARGING EFFECT (Pie Chart)
                const progress = Math.min((currentT / unlockTurn) * 100, 100);
                const turnsLeft = unlockTurn - currentT;

                this.btn50.textContent = `${turnsLeft}`; // Countdown Number
                this.btn50.title = `Unlocks in ${turnsLeft} turns`;

                // Conic Gradient for Pie Chart
                this.btn50.style.background = `conic-gradient(
                     var(--accent-color) 0% ${progress}%, 
                     #222 ${progress}% 100%
                 )`;
                this.btn50.style.color = '#fff';
                this.btn50.style.border = '2px solid #555';
                this.btn50.style.textShadow = '0 0 4px #000';
                this.btn50.style.fontSize = '1.5rem';
            } else {
                // READY (100% Charged)
                // Use a distinct color for 50% button (e.g., Teal/Cyan distinct from Green/Orange/Purple)
                const btnColor = '#00BCD4'; // Cyan-ish

                if (this.selectedType === 50) {
                    this.btn50.textContent = "50%";
                    this.btn50.style.background = btnColor;
                    this.btn50.style.color = '#000';
                    this.btn50.style.fontWeight = 'bold';
                    this.btn50.style.boxShadow = `0 0 10px ${btnColor}`;
                    this.btn50.title = "Ready!";
                } else {
                    this.btn50.textContent = "50%";
                    // Normal state (Ready but not selected)
                    // Do NOT set solid background. Just border/text color to indicate readiness.
                    this.btn50.style.background = 'transparent';
                    this.btn50.style.color = btnColor;
                    this.btn50.style.border = `2px solid ${btnColor}`;
                    this.btn50.style.textShadow = `0 0 5px ${btnColor}`;
                    this.btn50.title = "Ready!";
                }
            }
        }

        this.btn70.disabled = false;
        this.btn90.disabled = !can90;
        this.btn100.disabled = !can100;

        // Handle Visibility for 50-koma
        // Hide if CPU match OR if disabled via toggle
        if (this.isCpuMatch() || !this.enable50Koma) {
            this.btn50.style.display = 'none';
        } else {
            this.btn50.style.display = 'inline-block';
        }

        // Skip Button Logic - MOVED TO MODAL
        /*
        const hasNormal = this.hasNormalMoves(this.currentPlayer);
        const has50 = this.has50Moves(this.currentPlayer);
        
        // Show pass if: No normal moves AND Has 50 moves
        if (!hasNormal && has50) {
            this.btnPass.classList.remove('hidden');
        } else {
            this.btnPass.classList.add('hidden');
        }
        */
        this.btnPass.classList.add('hidden'); // Always hide, used modal now

        // If currently selected is disabled, switch to 70 (always safe)
        if (this.selectedType === 50 && !can50) this.selectType(70);
        if (this.selectedType === 90 && !can90) this.selectType(70);
        if (this.selectedType === 100 && !can100) this.selectType(70);
    }

    async handleObserve() {
        if (this.observationsLeft[this.currentPlayer] <= 0) return;

        // Decrease count
        this.observationsLeft[this.currentPlayer]--;
        this.observedThisTurn = true;
        this.lastObservationTurn[this.currentPlayer] = this.currentTurn;

        // Phase 1: Identify 50-koma pieces (Do NOT update model yet)
        const fiftyUpdates = [];
        const cells = document.querySelectorAll('.cell');

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = this.board[r][c];
                if (cell && !cell.observed && cell.type === 50) {
                    const isBlack = Math.random() < 0.5;
                    const finalColor = isBlack ? BLACK : WHITE;
                    fiftyUpdates.push({ r, c, finalColor });
                }
            }
        }

        // Trigger Animation Event in DB (Syncs to opponent)
        // We include a timestamp to ensure uniqueness
        if (fiftyUpdates.length > 0 && this.isOnline) {
            await window.db.ref('games/' + this.gameId).update({
                animationEvent: {
                    type: 'roulette_50',
                    updates: fiftyUpdates,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                }
            });
        }

        // Wait for Animation Duration (matches animate50Roulette max duration)
        // Max duration is 7000ms. We wait 7500ms to be safe.
        if (fiftyUpdates.length > 0) {
            const boardEl = document.querySelector('.board');
            if (boardEl) boardEl.style.pointerEvents = 'none'; // Lock immediately

            // We rely on the listener to play the visual. 
            // We just wait here before finalizing the board logic.
            await new Promise(resolve => setTimeout(resolve, 7500));

            if (boardEl) boardEl.style.pointerEvents = 'auto';
        }

        // Apply 50-koma updates to Model (Finalize)
        fiftyUpdates.forEach(({ r, c, finalColor }) => {
            const cell = this.board[r][c];
            if (cell) {
                cell.color = finalColor;
                cell.type = 100;
                cell.observed = true;
            }
        });

        // Phase 2: Process ALL other pieces (70/90) & Updates
        let changed = false;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = this.board[r][c];
                if (cell && !cell.observed) {
                    // Skip if already processed (the 50-komas we just updated)
                    // We can check if it WAS 50, but now it is type 100 and observed=true.
                    // The loop condition !cell.observed handles it automatically! 
                    // (Since we set observed=true for 50s above).

                    let type = cell.type;
                    changed = true;
                    cell.observed = true;

                    // Probability Logic
                    let threshold = 0;
                    if (type === 90) threshold = 0.1;
                    else if (type === 70) threshold = 0.3;
                    // Type 50 is strictly handled above, so no case needed here.

                    if (threshold > 0) {
                        if (Math.random() < threshold) {
                            cell.color = (cell.color === BLACK) ? WHITE : BLACK;
                        }
                    }
                }
            }
        }

        // Unlock Board
        const boardEl = document.querySelector('.board');
        if (boardEl) boardEl.style.pointerEvents = 'auto';

        this.renderBoard();
        this.updateDB();
        this.updateControlsState();
    }

    // Helper to play animation from Listener
    async playRouletteAnimation(updates) {
        if (!updates || updates.length === 0) return;

        const boardEl = document.querySelector('.board');
        if (boardEl) boardEl.style.pointerEvents = 'none';

        const cells = document.querySelectorAll('.cell');
        const animations = [];

        updates.forEach(({ r, c, finalColor }) => {
            const index = r * BOARD_SIZE + c;
            const cell = cells[index];
            const pieceEl = cell ? cell.querySelector('.piece') : null;
            if (pieceEl) {
                animations.push(this.animate50Roulette(pieceEl, finalColor));
            }
        });

        if (animations.length > 0) {
            await Promise.all(animations);
        }

        if (boardEl) boardEl.style.pointerEvents = 'auto';
    }

    animate50Roulette(element, finalColor) {
        return new Promise(resolve => {
            // Random duration between 5000ms and 7000ms
            const duration = 5000 + Math.random() * 2000;
            const startTime = Date.now();

            let currentColor = 'black'; // Start color
            // Ensure style override
            element.style.transition = 'none'; // Disable CSS transitions for sharp swapping

            const loop = () => {
                const now = Date.now();
                const elapsed = now - startTime;

                if (elapsed >= duration) {
                    // Finish
                    element.className = `piece ${finalColor}`;
                    element.textContent = '100'; // Reveal it is now 100
                    // Restore styles if needed? The class should handle it.
                    // But we might need to clear inline styles set by previous logic
                    element.style.background = '';
                    element.style.border = '';
                    element.style.color = finalColor === 'black' ? '#fff' : '#000';
                    resolve();
                    return;
                }

                // Swap Logic
                currentColor = (currentColor === 'black') ? 'white' : 'black';

                // Update Visuals
                element.className = `piece ${currentColor}`;
                // Keep showing "50%" or "?" during spin?
                element.textContent = '50%';

                // Style overrides to make it look like a piece (remove special 50-koma styles)
                element.style.background = ''; // Use class color
                element.style.border = '2px solid gold'; // Highlight effect during spin?
                element.style.color = currentColor === 'black' ? '#fff' : '#000';

                // Calculate next interval (Ease Out)
                const progress = elapsed / duration;
                // interval: 50ms -> 600ms
                const nextInterval = 50 + (550 * (progress * progress)); // Quadratic

                setTimeout(loop, nextInterval);
            };

            loop();
        });
    }

    // Modified to use updateDB and Quantum Objects
    executeMove(r, c, player, pieceType = null) {
        const type = pieceType !== null ? pieceType : (this.selectedType || 70);
        // All new pieces start as "Unobserved" (Active in the stack), 
        // even 100% pieces (which are 0% risk but count towards the limit until observed).
        const isObserved = false;

        if (type === 50) {
            // 50-koma: Gray, Owned by Player, No Flips
            this.board[r][c] = {
                color: GRAY,
                type: 50,
                owner: player,
                observed: false
            };
            this.hasUsed50[player] = true;
        } else {
            // Normal Placement
            this.board[r][c] = {
                color: player,
                type: type,
                observed: isObserved
            };

            // Flip logic (State update)
            const opponent = player === BLACK ? WHITE : BLACK;
            const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

            for (const [dr, dc] of directions) {
                let tr = r + dr, tc = c + dc;
                let path = [];
                while (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE) {
                    const cell = this.board[tr][tc];
                    // Relay Logic Check:
                    // If cell is opponent color -> continue (sandwiching)
                    // If cell is MY color OR MY 50-koma -> Anchor found -> Flip path

                    if (cell && cell.color === opponent) {
                        path.push([tr, tc]);
                    } else if (cell && (cell.color === player || cell.type === 50)) {
                        // Anchor Found! (Any 50-koma counts as anchor)
                        // Flip all in path.
                        // IMPORTANT: 50-koma itself is NOT flipped.
                        // It must be a continuous line of Opponent's COLORED pieces.

                        path.forEach(([pr, pc]) => {
                            const p = this.board[pr][pc];
                            // Double check handling
                            if (p.type !== 50) { // Ensure we don't flip an opponent's 50-koma if it somehow got into the path (it shouldn't based on the break logic)
                                p.color = player;
                            }
                        });
                        break;
                    } else {
                        // Gray (Un-owned or Opponent's 50) or Null -> Break
                        break;
                    }
                    tr += dr; tc += dc;
                }
            }
        }

        // Track History (Debug)
        if (this.moveHistory) {
            this.moveHistory.push({
                turn: this.moveHistory.length + 1,
                player: player,
                r, c, type: pieceType,
                fen: this.getFenLikeString ? this.getFenLikeString() : 'N/A'
            });
        }

        // Update last move type (only for non-50 pieces, as 50 is a special action)
        if (type !== 50) {
            this.lastMoveType[player] = type;
        }

        // Increment turn counter
        this.currentTurn++;

        // Reset observation flag when a move is made
        this.observedThisTurn = false;



        // Sync to DB
        this.updateDB();
    }

    getFenLikeString() {
        if (!this.board) return '';
        // Simple FEN-like: 8 rows separated by /
        // p=Piece, lower=white, upper=black. number=empty count.
        // But we have quantum types... too complex for standard FEN.
        return 'QFEN';
    }

    updateLobbyUI() {
        if (!this.gameModeSelect) return;
        const mode = this.gameModeSelect.value;
        const isCpu = mode.startsWith('cpu');

        // Find the container for the 50-koma switch
        // Assuming it's the parent of the label or input
        const toggleInput = document.getElementById('toggle-50koma');
        if (toggleInput) {
            // Traverse up to the container div (usually .switch-container or just parent)
            const container = toggleInput.closest('div'); // Adjust selector based on HTML structure logic
            // Actually, let's just use the closest label parent or direct container if known.
            // Based on standard HTML input inside label or next to it.
            // Safest: Hide the PARENT of the label/input combo to hide the whole row.
            if (container) {
                container.style.display = isCpu ? 'none' : 'flex'; // Or block
            }
        }
    }
    handleCellClick(r, c) {
        if (this.gameOver) return;

        // Online check: Is it my turn?
        if (this.isOnline && this.currentPlayer !== this.myRole) {
            return; // Not your turn
        }

        // Validation Logic
        let isValid = this.isValidMove(r, c, this.currentPlayer);

        // 50-koma Exception: Can place on Opponent's valid moves too
        if (this.selectedType === 50) {
            const opponent = this.currentPlayer === BLACK ? WHITE : BLACK;
            // If not valid for me, check if valid for opponent
            if (!isValid && this.isValidMove(r, c, opponent)) {
                isValid = true;
            }
        }

        if (!isValid) return;

        this.executeMove(r, c, this.currentPlayer);
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
        this.updateDB(); // Sync turn change

        this.refreshBoardDisplay();
        this.updateUI();

        // Removed predictive pass logic. 
        // Generative Pass Logic is now handled by the client receiving the turn.
    }

    finishGame() {
        const blackScore = this.countPieces(BLACK);
        const whiteScore = this.countPieces(WHITE);
        let winner = 'draw';
        if (blackScore > whiteScore) winner = BLACK;
        if (whiteScore > blackScore) winner = WHITE;

        if (this.isOnline) {
            window.db.ref('games/' + this.gameId).update({
                winner: winner
            });
        }
        this.endGame(winner);
    }

    exportDebugData() {
        // Create comprehensive game state export
        const debugData = {
            version: VERSION,
            gameMode: this.gameMode || 'pvp',
            myRole: this.myRole,
            currentPlayer: this.currentPlayer,
            moveHistory: this.moveHistory || [],
            currentBoard: this.getBoardAsString(),
            observations: {
                black: this.observationsLeft[BLACK],
                white: this.observationsLeft[WHITE]
            },
            hasUsed50: this.hasUsed50
        };

        // Convert to JSON
        const jsonString = JSON.stringify(debugData, null, 2);

        // Create human-readable timestamp
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

        // Create downloadable file
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quversi_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('Game data exported!');
    }

    getBoardAsString() {
        // Convert board to readable string format for export
        const result = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            const row = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = this.board[r][c];
                if (!cell) {
                    row.push('--');
                } else {
                    let colorPrefix = 'W';
                    if (cell.color === BLACK) colorPrefix = 'B';
                    else if (cell.color === GRAY) colorPrefix = 'G'; // 50-koma support

                    const typeStr = cell.type.toString();
                    const observedMark = cell.observed ? '*' : '';
                    row.push(`${colorPrefix}${typeStr}${observedMark}`);
                }
            }
            result.push(row);
        }
        return result;
    }


    // ... (isValidMove, countPieces same as before)
    // ... (isValidMove, countPieces same as before)
    // Helper to check valid move on stateless board
    isValidMove(r, c, player, board = this.board) {
        // Support old signature where board was missing (handled by default param)
        // But wait, if I call isValidMove(board, r, c, player), r is board.
        // I should just detect types.
        let b = board;
        let R = r;
        let C = c;
        let P = player;

        if (Array.isArray(r)) {
            // Called as (board, r, c, player)
            b = r;
            R = c;
            C = player;
            P = arguments[3];
        }

        if (!b || !b[R] || b[R][C]) return false;

        const opponent = P === BLACK ? WHITE : BLACK;
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

        for (const [dr, dc] of directions) {
            let tr = R + dr, tc = C + dc;
            let hasOpponent = false;
            while (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
                const cell = b[tr][tc];
                // Relay Logic:
                if (cell && cell.color === opponent) {
                    hasOpponent = true;
                } else if (cell && (cell.color === P || cell.type === 50)) {
                    if (hasOpponent) return true;
                    break;
                } else {
                    break;
                }
                tr += dr; tc += dc;
            }
        }
        return false;
    }

    // --- Refactored Move Validation Handlers ---

    hasNormalMoves(player) {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (this.isValidMove(r, c, player)) return true;
            }
        }
        return false;
    }

    has50Moves(player) {
        // Check availability (Settings, Turn, Used, CPU)
        const can50 = this.enable50Koma && (this.currentTurn >= 4) && !this.hasUsed50[player] && !this.isCpuMatch();
        if (can50) {
            const opponent = player === BLACK ? WHITE : BLACK;
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (this.isValidMove(r, c, opponent)) return true;
                }
            }
        }
        return false;
    }

    hasValidMoves(player) {
        // Returns true if ANY move is possible (preventing auto-pass).
        // If only 50-koma is possible, we return TRUE here to let the turn start.
        // The Pass button will be shown in updateControlsState.
        return this.hasNormalMoves(player) || this.has50Moves(player);
    }

    passTurn() {
        console.log("Player passed turn explicitly");
        this.currentTurn++; // Increment turn even on pass? usually Reversi semantics vary. 
        // Standard Reversi: If pass, no stone placed.
        // We switch player.
        this.currentPlayer = (this.currentPlayer === BLACK) ? WHITE : BLACK;
        this.observedThisTurn = false; // Reset obs flag

        this.updateUI();
        this.updateDB();

        // Re-check for chain passes?
        // If next player also has no moves, logic in loop or next interaction handles it.
    }

    countPieces(player) {
        if (!this.board) return 0;
        return this.board.flat().filter(c => c && c.color === player).length;
    }

    capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.addEventListener('click', () => this.handleCellClick(r, c));
                const cellData = this.board[r][c];
                if (cellData) this.createPiece(cell, cellData.color, cellData.type);
                this.boardElement.appendChild(cell);
            }
        }
        this.updateValidMoves();
    }

    createPiece(cell, color, type = 100, isObserved = false, isNew = false) {
        const piece = document.createElement('div');
        piece.classList.add('piece', color);
        if (isNew) piece.classList.add('new');

        // Show 70/90 ONLY if not observed
        if (type !== 100 && !isObserved) {
            piece.innerText = type;
            piece.style.display = 'flex';
            piece.style.justifyContent = 'center';
            piece.style.alignItems = 'center';
            piece.style.color = color === 'black' ? '#fff' : '#000'; // Contrast text
            piece.style.fontWeight = 'bold';
            piece.style.fontSize = '0.8rem';
        }

        cell.appendChild(piece);
    }

    refreshBoardDisplay() {
        if (!this.board) return;
        const cells = document.querySelectorAll('.cell');
        for (let r = 0; r < BOARD_SIZE; r++) {
            if (!this.board[r]) continue; // Safety check for row
            for (let c = 0; c < BOARD_SIZE; c++) {
                const index = r * BOARD_SIZE + c;
                const cell = cells[index];
                const piece = cell.querySelector('.piece'); // Existing piece element
                const cellData = this.board[r][c];

                if (cellData) {
                    // Update or Create
                    if (!piece) {
                        this.createPiece(cell, cellData.color, cellData.type, cellData.observed, true);
                    } else {
                        // Update class if color changed
                        // Reset class
                        piece.className = `piece ${cellData.color}`;
                        // Update text: Only show if quantum AND NOT observed
                        const showLabel = (cellData.type !== 100 && !cellData.observed);
                        piece.innerText = showLabel ? cellData.type : '';

                        // Ensure styles are applied if showing label (in case it wasn't before)
                        if (showLabel) {
                            piece.style.display = 'flex';
                            piece.style.justifyContent = 'center';
                            piece.style.alignItems = 'center';
                            piece.style.color = cellData.color === 'black' ? '#fff' : '#000';
                            piece.style.fontWeight = 'bold';
                            piece.style.fontSize = '0.8rem';
                        } else {
                            piece.innerText = '';
                        }
                    }
                } else if (piece) {
                    piece.remove();
                }
            }
        }
        this.updateValidMoves();
    }

    updateValidMoves() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => cell.classList.remove('valid-move'));
        if (this.gameOver) return;

        // Only show valid moves if it's MY turn (or local)
        if (this.isOnline && this.currentPlayer !== this.myRole) return;

        const player = this.currentPlayer;
        const opponent = player === BLACK ? WHITE : BLACK;
        const can50 = (this.selectedType === 50); // Specifically when 50 is SELECTED

        // Logic: 
        // If selected 50: Highlight Union(MyMoves, OpponentMoves)
        // Else: Highlight MyMoves

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                let isValid = this.isValidMove(r, c, player);
                if (can50 && !isValid) {
                    if (this.isValidMove(r, c, opponent)) {
                        isValid = true;
                    }
                }

                if (isValid) {
                    cells[r * BOARD_SIZE + c].classList.add('valid-move');
                }
            }
        }
    }

    resetGame() {
        // In multiplayer, restart is tricky. For now, just reload page.
        location.reload();
    }

    updateUI() {
        const blackScore = this.countPieces(BLACK);
        const whiteScore = this.countPieces(WHITE);

        this.scoreBlackEl.textContent = blackScore;
        this.scoreWhiteEl.textContent = whiteScore;

        const obsBlackEl = document.getElementById('obs-black');
        const obsWhiteEl = document.getElementById('obs-white');
        if (obsBlackEl) obsBlackEl.textContent = `👁️ ${this.observationsLeft[BLACK]}`;
        if (obsWhiteEl) obsWhiteEl.textContent = `👁️ ${this.observationsLeft[WHITE]}`;

        document.querySelector('.player-black').classList.toggle('active', this.currentPlayer === BLACK);
        document.querySelector('.player-white').classList.toggle('active', this.currentPlayer === WHITE);

        this.updateControlsState(); // Check button availability

        let statusMsg = '';
        if (this.isOnline) {
            this.gameInfoDisplay.textContent = this.translations[this.currentLang].gameId(this.gameId) +
                " - " + this.translations[this.currentLang].youAre(this.translations[this.currentLang][this.myRole]);

            if (this.currentPlayer === this.myRole) {
                statusMsg = this.translations[this.currentLang].yourTurn;
            } else {
                statusMsg = this.translations[this.currentLang].opponentTurn;
            }
        } else {
            const turnKey = this.currentPlayer === BLACK ? 'turnBlack' : 'turnWhite';
            statusMsg = this.translations[this.currentLang][turnKey];
        }

        if (!this.gameOver) {
            this.statusEl.textContent = statusMsg;
        }
    }


    endGame(winner) {
        this.gameOver = true;
        const blackScore = this.countPieces(BLACK);
        const whiteScore = this.countPieces(WHITE);

        let msg = '';
        if (winner === BLACK || (winner === 'draw' && blackScore > whiteScore)) msg = this.translations[this.currentLang].winBlack;
        else if (winner === WHITE || (winner === 'draw' && whiteScore > blackScore)) msg = this.translations[this.currentLang].winWhite;
        else msg = this.translations[this.currentLang].draw;

        this.statusEl.textContent = msg;
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('valid-move'));

        // Show restart button
        this.restartBtn.style.display = 'block';
    }

    // --- Debug Helper ---


    getFenLikeString() {
        if (!this.board) return '';
        return this.board.map(row => row.map(c => c ? (c.color === 'black' ? 'B' : 'W') : '.').join('')).join('/');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Reversi();
});
