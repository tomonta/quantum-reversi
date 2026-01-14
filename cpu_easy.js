window.CpuEasy = class CpuEasy {
    constructor(game) {
        this.game = game;
    }

    // Main entry point
    async decideMove() {
        const game = this.game;
        const myColor = game.currentPlayer;

        // 1. Observation Check
        if (this.shouldObserve(game, myColor)) {
            return { action: 'observe' };
        }

        // 2. Get Valid Moves
        const moves = this.getValidMoves(game, myColor);
        if (moves.length === 0) return null; // Pass

        // 3. Piece Type Selection (Pre-select type to key off constraints?)
        // The user says "Select piece type randomly".
        // But some moves (placing 100/90) might not be valid if we pick the wrong type.
        // Strategy: First pick a move (coordinate), THEN pick a valid piece type for it?
        // Or pick a {r, c, type} tuple from all possible combinations?
        // User says: "choose legal move (square + piece)".
        // "合法な手（マスと駒の組み合わせ）をすべて抽出" -> "Extract all legal moves (Square + Piece combination)"

        const allLegalActions = [];
        const pieceTypes = [100, 90, 70];

        // Check constraints for types once
        const stats = game.countPieceTypes(myColor);
        // Valid types based on counts
        const validTypes = [];
        // 70 is always valid
        validTypes.push(70);
        // 90 if 90s < 70s
        if (stats[90] < stats[70]) validTypes.push(90);
        // 100 if 100s < 90s AND lastMove was 70
        // Need lastMoveType check. 
        // game.lastMoveType[myColor] === 70
        if (stats[100] < stats[90] && game.lastMoveType[myColor] === 70) validTypes.push(100);

        for (const move of moves) {
            for (const type of validTypes) {
                // Determine flip count for weighting (Greedy)
                const flipCount = this.simulateMoveScore(game, move.r, move.c, myColor);

                // Corner check
                const isCorner = (move.r === 0 || move.r === 7) && (move.c === 0 || move.c === 7);

                allLegalActions.push({
                    r: move.r,
                    c: move.c,
                    type: type,
                    flips: flipCount,
                    isCorner: isCorner
                });
            }
        }

        if (allLegalActions.length === 0) return null;

        // 4. Selection Logic
        let corners = allLegalActions.filter(a => a.isCorner);

        // Corner Bias (85%)
        if (corners.length > 0 && Math.random() < 0.85) {
            // Pick random corner move from available
            return corners[Math.floor(Math.random() * corners.length)];
        }

        // 70% Max Flips, 30% Random
        if (Math.random() < 0.70) {
            // Greedy: Filter to max flips
            const maxFlips = Math.max(...allLegalActions.map(a => a.flips));
            const bestMoves = allLegalActions.filter(a => a.flips === maxFlips);
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        } else {
            // Random
            return allLegalActions[Math.floor(Math.random() * allLegalActions.length)];
        }
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

    simulateMoveScore(game, r, c, player) {
        // Simplified flip count simulation
        // Just reuse logic from executeMove effectively or duplicate direction check
        // Since we don't want to mutate board, we duplicate direction logic:
        const opponent = player === 'black' ? 'white' : 'black';
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        let totalFlips = 0;

        for (const [dr, dc] of directions) {
            let tr = r + dr, tc = c + dc;
            let currentFlips = 0;
            while (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
                const cell = game.board[tr][tc];
                if (cell && cell.color === opponent) {
                    currentFlips++;
                } else if (cell && cell.color === player) {
                    totalFlips += currentFlips;
                    break;
                } else {
                    break;
                }
                tr += dr; tc += dc;
            }
        }
        return totalFlips;
    }

    shouldObserve(game, player) {
        // Check remaining
        if (game.observationsLeft[player] <= 0) return false;

        // Conditions
        // 1. Quantum count >= 8 (30%)
        // Count my quantum pieces
        let quantumCount = 0;
        let myTotal = 0;
        let opTotal = 0;
        const opponent = player === 'black' ? 'white' : 'black';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = game.board[r][c];
                if (cell) {
                    if (cell.color === player) {
                        myTotal++;
                        if (!cell.observed) quantumCount++;
                    } else {
                        opTotal++;
                    }
                }
            }
        }

        // Condition 1: 8+ quantum (30%)
        if (quantumCount >= 8 && Math.random() < 0.30) return true;

        // Condition 2: Start of turn (5%)
        // This function is called at start of turn, so just dice roll
        if (Math.random() < 0.05) return true;

        // Condition 3: Losing by 10+ (40%)
        if ((opTotal - myTotal) >= 10 && Math.random() < 0.40) return true;

        return false;
    }
};
