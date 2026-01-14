window.CpuNormal = class CpuNormal {
    constructor(game) {
        this.game = game;
        this.weights = this.initWeights();
    }

    initWeights() {
        const W = Array(8).fill(0).map(() => Array(8).fill(5)); // Default 5

        // Corners
        const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
        corners.forEach(([r, c]) => W[r][c] = 100);

        // X-Squares (Adjacent diagonal to corner)
        const xsq = [[1, 1], [1, 6], [6, 1], [6, 6]];
        xsq.forEach(([r, c]) => W[r][c] = -50);

        // C-Squares (Adjacent orthogonal to corner)
        const csq = [[0, 1], [1, 0], [0, 6], [1, 7], [6, 0], [7, 1], [6, 7], [7, 6]];
        csq.forEach(([r, c]) => W[r][c] = -20);

        // Edges (Remaining outer)
        for (let i = 2; i <= 5; i++) {
            W[0][i] = 30; W[7][i] = 30;
            W[i][0] = 30; W[i][7] = 30;
        }

        return W;
    }

    async decideMove() {
        const game = this.game;
        const myColor = game.currentPlayer;

        // 1. Observation Logic
        if (this.shouldObserve(game, myColor)) {
            return { action: 'observe' };
        }

        // 2. Generate All Legal Actions
        const moves = this.getValidMoves(game, myColor);
        if (moves.length === 0) return null;

        const stats = game.countPieceTypes(myColor);
        const validTypes = [70];
        if (stats[90] < stats[70]) validTypes.push(90);
        if (stats[100] < stats[90] && game.lastMoveType[myColor] === 70) validTypes.push(100);

        // 3. Evaluate Actions
        let bestScore = -Infinity;
        let bestAction = null;

        for (const move of moves) {
            for (const type of validTypes) {
                const score = this.calculateExpectedScore(game, move.r, move.c, type, myColor);
                // Greedy selection
                if (score > bestScore) {
                    bestScore = score;
                    bestAction = { r: move.r, c: move.c, type: type };
                } else if (score === bestScore) {
                    if (Math.random() < 0.5) bestAction = { r: move.r, c: move.c, type: type }; // Tie breaker
                }
            }
        }

        return bestAction;
    }

    getValidMoves(game, player) {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (game.isValidMove(r, c, player)) {
                    moves.push({ r, c });
                }
            }
        }
        return moves;
    }

    getStability(type) {
        if (type === 100) return 1.0;
        if (type === 90) return 0.9;
        if (type === 70) return 0.7;
        return 1.0; // Fallback or for observed pieces
    }

    calculateExpectedScore(game, r, c, pieceType, player) {
        const myStability = this.getStability(pieceType);
        const posWeight = this.weights[r][c];

        let score = posWeight * myStability;

        // Simulate flips to get flipped positions
        const flippables = this.getFlippables(game, r, c, player);

        for (const [fr, fc] of flippables) {
            const cell = game.board[fr][fc];
            let flipStability = 1.0;
            if (cell && !cell.observed) {
                flipStability = this.getStability(cell.type);
            }

            const flipWeight = this.weights[fr][fc];
            score += flipWeight * flipStability * myStability;
        }

        return score;
    }

    getFlippables(game, r, c, player) {
        const opponent = player === 'black' ? 'white' : 'black';
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        let flippables = [];

        for (const [dr, dc] of directions) {
            let tr = r + dr, tc = c + dc;
            let path = [];
            while (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
                const cell = game.board[tr][tc];
                if (cell && cell.color === opponent) {
                    path.push([tr, tc]);
                } else if (cell && cell.color === player) {
                    if (path.length > 0) flippables.push(...path);
                    break;
                } else {
                    break;
                }
                tr += dr; tc += dc;
            }
        }
        return flippables;
    }

    shouldObserve(game, player) {
        if (game.observationsLeft[player] <= 0) return false;

        // 1. Defense: Secure unobserved corners
        const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
        for (const [r, c] of corners) {
            const cell = game.board[r][c];
            if (cell && cell.color === player && !cell.observed) {
                return true;
            }
        }

        // 2. Attack: Stabilize high value mass
        let unobservedWeight = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = game.board[r][c];
                if (cell && cell.color === player && !cell.observed) {
                    if (this.weights[r][c] > 0) {
                        unobservedWeight += this.weights[r][c];
                    }
                }
            }
        }

        if (unobservedWeight > 200) return true;

        return false;
    }
};
