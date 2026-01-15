const BOARD_SIZE = 8;
const BLACK = 'black';
const WHITE = 'white';
const VERSION = 'v2.0.0-cpu'; // Update this for every minor change (2.1, 2.2...)

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
        this.btn70 = document.getElementById('btn-70');
        this.btn90 = document.getElementById('btn-90');
        this.btn100 = document.getElementById('btn-100');
        this.btn70 = document.getElementById('btn-70');
        this.btn90 = document.getElementById('btn-90');
        this.btn100 = document.getElementById('btn-100');
        this.btnObserve = document.getElementById('btn-observe');

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
                if (this.exportDebugData) this.exportDebugData();
            }
        });

        this.lastMoveType = { [BLACK]: null, [WHITE]: null };

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
                        <li><strong>90%</strong>: Placeable if you have fewer 90s than 70s.</li>
                        <li><strong>100%</strong>: Placeable if fewer 100s than 90s AND your last move was a 70% piece.</li>
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
                restart: "Restart Game"
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
                passMsg: '置ける場所がありません！パスします...',
                helpTitle: 'Quversiのルール',
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
                    <p>観測は1ゲームにつき<strong>2回</strong>まで使えます。相手の計算を狂わせる強力な武器です！</p>
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
                lobbyStatus: "対戦モードを選択してください",
                createGame: "ゲーム開始",
                joinGame: "参加",
                modeLabel: "対戦モード:",
                modePvP: "オンライン対戦",
                modeCpuEasy: "CPU (かんたん)",
                modeCpuNormal: "CPU (ふつう)",
                modeCpuHard: "CPU (むずかしい)",
                turnLabel: "自分の手番:",
                turnBlack: "先手 (黒)",
                turnWhite: "後手 (白)",
                turnRandom: "ランダム",
                or: "または",
                enterIdPlaceholder: "ゲームIDを入力",

                // CPU Status
                cpuThinking: "CPUが考え中...",
                cpuObserving: "CPUが観測しました！",
                restart: "リスタート"
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
        this.selectedType = 100;
        this.lastMoveType = { [BLACK]: null, [WHITE]: null };

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
        this.btn70.addEventListener('click', () => this.selectType(70));
        this.btn90.addEventListener('click', () => this.selectType(90));
        this.btn100.addEventListener('click', () => this.selectType(100));
        this.btnObserve.addEventListener('click', () => this.handleObserve());

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
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.translations[lang][key]) {
                el.innerText = this.translations[lang][key];
            }
        });
        this.restartBtn.textContent = this.translations[lang].restart;
        this.updateUI();
        this.updateHelpContent();
    }

    showPassNotification() {
        if (this.currentPlayer !== this.myRole) return; // Safety check
        this.passNotification.textContent = this.translations[this.currentLang].passMsg;
        this.passNotification.classList.remove('hidden');
    }

    hidePassNotification() {
        this.passNotification.classList.add('hidden');
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
            // Prepare safe board data
            const safeBoard = this.board.map(row => row.map(cell => cell || ""));

            await window.db.ref('games/' + this.gameId).set({
                board: safeBoard,
                currentPlayer: BLACK, // Black always starts
                lastMoveType: { [BLACK]: null, [WHITE]: null },
                observationsLeft: { [BLACK]: 2, [WHITE]: 2 },
                status: 'waiting',
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                gameMode: this.gameMode,
                hostRole: this.myRole // Save host role so joiner knows what to be
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

            // Sync Board UI
            this.refreshBoardDisplay();
            this.updateUI(); // This handles turn updates

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

                // CPU Trigger
                if (!this.gameOver && this.gameMode && this.gameMode.startsWith('cpu')) {
                    if (this.currentPlayer !== this.myRole) {
                        this.processCpuTurn();
                    }
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

                const decision = await this.cpuInstance.decideMove();

                if (decision && decision.action === 'observe') {
                    // CPU Observe
                    this.showNotification(this.translations[this.currentLang].cpuObserving);
                    this.handleObserve(true); // Decrements count, updates board
                    this.updateDB(); // Checkpoint state
                    // turnActive remains true -> Loop back to Move

                    // Small extra delay after observation to let user see it
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } else if (decision) {
                    // Move
                    this.selectedType = decision.type;
                    this.executeMove(decision.r, decision.c, this.currentPlayer);

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
            lastMoveType: this.lastMoveType || {}
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
        this.btn70.classList.toggle('active', type === 70);
        this.btn90.classList.toggle('active', type === 90);
        this.btn100.classList.toggle('active', type === 100);
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
            this.btn70.disabled = true;
            this.btn90.disabled = true;
            this.btn100.disabled = true;
            return;
        }

        // Rule: 90 allowed if count(90) < count(70)
        // Rule: 100 allowed if count(100) < count(90) AND lastMoveType[player] === 70
        // Rule: 70 always allowed

        const can90 = counts[90] < counts[70];
        const lastWas70 = this.lastMoveType[this.currentPlayer] === 70;
        const can100 = (counts[100] < counts[90]) && lastWas70;

        this.btn70.disabled = false;
        this.btn90.disabled = !can90;
        this.btn100.disabled = !can100;

        // If currently selected is disabled, switch to 70 (always safe)
        if (this.selectedType === 90 && !can90) this.selectType(70);
        if (this.selectedType === 100 && !can100) this.selectType(70);
    }

    handleObserve() {
        if (this.observationsLeft[this.currentPlayer] <= 0) return;

        // Logic:
        // 1. Decrement count
        // 2. Iterate all pieces.
        // 3. If !observed:
        //    Mark observed = true.
        //    If type 90 or 70: Roll RNG.
        //    90% type: 10% chance to flip color.
        //    70% type: 30% chance to flip color.
        // 4. Update Board (render).
        // 5. Update DB. (Wait, observation logic needs to happen on ONE client and sync?)
        //    Yes. If I observe, I calculate the new state and push the entire board to DB.

        this.observationsLeft[this.currentPlayer]--;

        let changed = false;

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = this.board[r][c];
                if (cell && !cell.observed) {
                    let type = cell.type;
                    changed = true; // Board has changed state

                    // Mark as observed regardless of type
                    cell.observed = true;

                    // Probability Logic
                    let threshold = 0;
                    if (type === 90) threshold = 0.1; // 10% chance to flip
                    else if (type === 70) threshold = 0.3; // 30% chance to flip

                    // 100% pieces have threshold 0, so they never flip.

                    if (threshold > 0) {
                        const rand = Math.random();
                        if (rand < threshold) {
                            // FLIP COLOR
                            cell.color = (cell.color === BLACK) ? WHITE : BLACK;
                        }
                    }
                }    // NO SANDWICH LOGIC ON OBSERVATION
            }
        }

        this.renderBoard();
        this.updateControlsState();

        // Use a special DB update that includes observation stats?
        // Since we don't sync observation stats in DB currently (just board), 
        // we might lose the "count" of observations if we reload. 
        // Ideally we add `observationsLeft` to DB game state.
        // For now, I'll update board. The counts are local-ish (risky but acceptable for MVP).
        // Actually, if I reload, `init` resets observation counts to 2. 
        // So refreshed player gets 2 observations again? Abuse!
        // TODO: Persist observation counts.

        this.updateDB();
    }

    // Modified to use updateDB and Quantum Objects
    executeMove(r, c, player) {
        const pieceType = this.selectedType || 70; // Fallback to 70 if something wrong
        // All new pieces start as "Unobserved" (Active in the stack), 
        // even 100% pieces (which are 0% risk but count towards the limit until observed).
        const isObserved = false;

        this.board[r][c] = {
            color: player,
            type: pieceType,
            observed: isObserved
        };

        // Track History (Debug)
        if (this.moveHistory) {
            this.moveHistory.push({
                turn: this.moveHistory.length + 1,
                player: player,
                r, c, type: pieceType,
                fen: this.getFenLikeString ? this.getFenLikeString() : 'N/A'
            });
        }

        // Update last move type
        this.lastMoveType[player] = pieceType;

        const opponent = player === BLACK ? WHITE : BLACK;
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        let piecesToFlip = [];

        for (const [dr, dc] of directions) {
            let tr = r + dr;
            let tc = c + dc;
            let potentialFlips = [];

            while (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE) {
                const cell = this.board[tr][tc];
                if (cell && cell.color === opponent) {
                    potentialFlips.push([tr, tc]);
                } else if (cell && cell.color === player) {
                    if (potentialFlips.length > 0) {
                        piecesToFlip.push(...potentialFlips);
                    }
                    break;
                } else {
                    break;
                }
                tr += dr;
                tc += dc;
            }
        }

        // Apply flips - Transfer Color Only
        piecesToFlip.forEach(([fr, fc]) => {
            // Keep existing type/observed, change color
            if (this.board[fr][fc]) {
                this.board[fr][fc].color = player;
            }
        });

        // Sync to DB
        this.updateDB();
    }

    handleCellClick(r, c) {
        if (this.gameOver) return;

        // Online check: Is it my turn?
        if (this.isOnline && this.currentPlayer !== this.myRole) {
            return; // Not your turn
        }

        if (!this.isValidMove(r, c, this.currentPlayer)) return;

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

    // ... (isValidMove, countPieces same as before)
    // ... (isValidMove, countPieces same as before)
    isValidMove(r, c, player) {
        if (!this.board || !this.board[r]) return false;
        if (this.board[r][c] !== null) return false; // Must be empty

        const opponent = player === BLACK ? WHITE : BLACK;
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (const [dr, dc] of directions) {
            let tr = r + dr, tc = c + dc, foundOpponent = false;
            while (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE) {
                const cell = this.board[tr][tc];
                if (cell && cell.color === opponent) foundOpponent = true;
                else if (cell && cell.color === player) {
                    if (foundOpponent) return true;
                    break;
                } else break;
                tr += dr; tc += dc;
            }
        }
        return false;
    }

    hasValidMoves(player) {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (this.isValidMove(r, c, player)) return true;
            }
        }
        return false;
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

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (this.isValidMove(r, c, this.currentPlayer)) {
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
    exportDebugData() {
        const debugInfo = {
            version: VERSION,
            gameMode: this.gameMode,
            myRole: this.myRole,
            currentPlayer: this.currentPlayer,
            moveHistory: this.moveHistory, // May be undefined in old instances
            currentBoard: this.board.map(row => row.map(c => c ? `${c.color[0].toUpperCase()}${c.type}${c.observed ? '*' : ''}` : '--')),
            observations: this.observationsLeft
        };
        console.log("=== DEBUG DATA ===", debugInfo);
        alert("Debug data dumped to Console (F12). Check '=== DEBUG DATA ==='");

        // Auto-download JSON
        try {
            const json = JSON.stringify(debugInfo, null, 2);
            const blob = new Blob([json], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `reversi_debug_${Date.now()}.json`;
            a.click();
        } catch (e) { console.error("Download failed:", e); }
    }

    getFenLikeString() {
        if (!this.board) return '';
        return this.board.map(row => row.map(c => c ? (c.color === 'black' ? 'B' : 'W') : '.').join('')).join('/');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Reversi();
});
