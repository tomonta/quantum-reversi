window.CpuHard = class CpuHard {
    constructor(game) {
        this.game = game;
        this.MAX_DEPTH = 3; // Lookahead depth
        this.weights = this.initWeights();
    }

    initWeights() {
        // Stronger positional weights for Hard AI
        const W = Array(8).fill(0).map(() => Array(8).fill(1));
        const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
        corners.forEach(([r, c]) => W[r][c] = 120);

        const xsq = [[1, 1], [1, 6], [6, 1], [6, 6]];
        xsq.forEach(([r, c]) => W[r][c] = -120); // Standard Penalty

        const csq = [[0, 1], [1, 0], [0, 6], [1, 7], [6, 0], [7, 1], [6, 7], [7, 6]];
        csq.forEach(([r, c]) => W[r][c] = -60); // Standard Prevention

        for (let i = 2; i <= 5; i++) {
            W[0][i] = 20; W[7][i] = 20;
            W[i][0] = 20; W[i][7] = 20;
        }
        return W;
    }


    async decideMove() {
        console.log("CpuHard: Thinking... (AlphaBeta Depth " + this.MAX_DEPTH + ")");
        const startTime = Date.now();
        this.nodeCount = 0; // Reset counter
        const rootState = this.getGameState(this.game);

        // 1. Normal Move Search
        const aiColor = rootState.currentPlayer;
        const moveEval = this.alphaBeta(rootState, this.MAX_DEPTH, -Infinity, Infinity, true, aiColor);

        // 2. Observation Search (Branch)
        // Check if we have observations left
        let observeScore = -Infinity;
        if (rootState.observationsLeft[rootState.currentPlayer] > 0) {
            const observeState = this.simulateObserve(rootState);
            // After observe, it is Opponent's turn (Minimizing from our perspective)
            // But alphaBeta always returns score from Maximizer (Root) perspective?
            // Wait, alphaBeta recursive call:
            // return this.alphaBeta(childState, depth - 1, alpha, beta, !maximizingPlayer);
            // If maximizingPlayer is FALSE (Opponent), it returns MIN(Score).
            // So if we call alphaBeta(..., false), it returns the MINIMIZED score (Worst case for us).
            // This is exactly what we want as "The Value of this Path".
            const observeResult = this.alphaBeta(observeState, this.MAX_DEPTH, -Infinity, Infinity, false, aiColor);
            observeScore = observeResult.score;
        }

        console.log(`CpuHard: Search Complete in ${Date.now() - startTime}ms. Nodes visited: ${this.nodeCount}`);
        console.log(`Moves Score: ${moveEval.score}, Observe Score: ${observeScore}`);

        // 3. Decision Logic
        // Threshold: How much better must Observation be to justify consuming a turn?
        const OBSERVE_THRESHOLD = 20;

        // CRITICAL OVERRIDE: If we hit the Quantum Limit (2 unobserved 100s), Force Observe
        // Fallback to heuristic check for Critical Limits
        const fallbackCheck = this.evaluateObservation(rootState, this.MAX_DEPTH);

        if ((observeScore > moveEval.score + OBSERVE_THRESHOLD || fallbackCheck.shouldObserve) && rootState.observationsLeft[rootState.currentPlayer] > 0) {
            return { action: 'observe' };
        }

        if (moveEval.bestMove) {
            return moveEval.bestMove;
        }

        return null; // Pass
    }

    simulateObserve(state) {
        // Create new state branch where Observation happened
        const newState = {
            board: state.board.map(row => row.map(cell => cell ? { ...cell } : null)),
            currentPlayer: state.currentPlayer === 'black' ? 'white' : 'black', // Turn switches
            observationsLeft: { ...state.observationsLeft },
            stats: { ...state.stats },
            prevMove: { ...state.prevMove }
        };

        // Decrement count
        newState.observationsLeft[state.currentPlayer]--;

        // Exec Observe: Mark all as observed (Assuming "Most Likely Outcome" = No Change in Color)
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (newState.board[r][c]) {
                    newState.board[r][c].observed = true;
                }
            }
        }
        return newState;
    }

    // Capture lightweight state
    getGameState(gameMock) {
        return {
            board: gameMock.board.map(row => row.map(cell => cell ? { ...cell } : null)),
            currentPlayer: gameMock.currentPlayer,
            observationsLeft: { ...gameMock.observationsLeft },
            stats: gameMock.countPieceTypes(gameMock.currentPlayer), // Heuristic stats
            prevMove: gameMock.lastMoveType ? { ...gameMock.lastMoveType } : {}
        };
    }

    // Minimax with Alpha-Beta
    alphaBeta(state, depth, alpha, beta, maximizingPlayer, cpuColor) {
        this.nodeCount++;
        // Terminal conditions
        // Note: We check legal moves for CURRENT player in state
        const legalMoves = this.getLegalMoves(state, state.currentPlayer);

        if (depth === 0) {
            return { score: this.evaluateBoard(state, cpuColor) };
        }

        if (legalMoves.length === 0) {
            // PASS Logic
            const childState = { ...state, currentPlayer: state.currentPlayer === 'black' ? 'white' : 'black' };
            return this.alphaBeta(childState, depth - 1, alpha, beta, !maximizingPlayer, cpuColor);
        }

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            let bestMove = null;

            this.sortMoves(legalMoves);

            for (const move of legalMoves) {
                const childState = this.simulateMove(state, move);
                // Next turn is opponent
                childState.currentPlayer = childState.currentPlayer === 'black' ? 'white' : 'black';

                const evalResult = this.alphaBeta(childState, depth - 1, alpha, beta, false, cpuColor);

                if (evalResult.score > maxEval) {
                    maxEval = evalResult.score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, evalResult.score);
                if (beta <= alpha) break;
            }
            return { score: maxEval, bestMove };
        } else {
            let minEval = Infinity;

            for (const move of legalMoves) {
                const childState = this.simulateMove(state, move);
                childState.currentPlayer = childState.currentPlayer === 'black' ? 'white' : 'black';

                const evalResult = this.alphaBeta(childState, depth - 1, alpha, beta, true, cpuColor);

                if (evalResult.score < minEval) {
                    minEval = evalResult.score;
                }
                beta = Math.min(beta, evalResult.score);
                if (beta <= alpha) break;
            }
            return { score: minEval };
        }
    }

    evaluateBoard(state, aiColor) {
        // --- Dynamic Heuristics (v2.2) ---
        // 1. Determine Game Phase
        // Simple heuristic: Count non-null cells
        let discCount = 0;
        let myDiscExpected = 0;
        let opDiscExpected = 0;

        const opponent = aiColor === 'black' ? 'white' : 'black';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = state.board[r][c];
                if (cell) {
                    discCount++;
                    // Basic Expected Value (for Endgame)
                    const val = cell.observed ? 1.0 : (cell.type / 100.0);
                    if (cell.color === aiColor) myDiscExpected += val;
                    if (cell.color === opponent) opDiscExpected += val;
                }
            }
        }

        const PHASE_OPEN = 20;
        const PHASE_MID = 48; // Up to 48 discs (approx 3/4 full)

        // --- Phase 3: ENDGAME ---
        // Objective: Hybrid (Disc Count + Position)
        // Pure Disc Count at depth 3 is dangerous. Hybridize with weights to protect corners.
        let posScore = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (state.board[r][c]) {
                    if (state.board[r][c].color === aiColor) posScore += this.weights[r][c];
                    else posScore -= this.weights[r][c];
                }
            }
        }
        return (myDiscExpected - opDiscExpected) * 10 + posScore;

        let score = 0;

        // --- Phase 1: OPENING ---
        if (discCount <= PHASE_OPEN) {
            // Objective: Mobility & Frontier (Open Space Control)
            // Weight: Mobility is King.

            const myMoves = this.getLegalMoves(state, aiColor).length;
            const opMoves = this.getLegalMoves(state, opponent).length;

            // Mobility Score: Mobility is King in Opening
            score += (myMoves - opMoves) * 20;

            // Positional Score (Weight 0.4 - Balanced)
            let posScore = 0;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (state.board[r][c] && state.board[r][c].color === aiColor) {
                        posScore += this.weights[r][c];
                    } else if (state.board[r][c]) {
                        posScore -= this.weights[r][c];
                    }
                }
            }
            score += posScore * 0.4;

            return score;
        }

        // --- Phase 2: MIDGAME (Default) ---
        // Objective: Position, Stability, Mobility mixture
        // Use existing weights logic but refined.

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = state.board[r][c];
                if (cell) {
                    const val = this.weights[r][c];
                    // Stability multiplier
                    let stability = 1.0;
                    if (!cell.observed) {
                        stability = cell.type / 100.0;
                    }

                    if (cell.color === aiColor) {
                        score += val * stability;

                        // Corner Stability Bonus
                        if (Math.abs(val) >= 100) {
                            if (cell.type === 100 || cell.observed) {
                                score += 50;
                            } else {
                                score -= 30;
                            }
                        }
                    } else {
                        score -= val * stability;
                        // Opponent Corner Stability
                        if (Math.abs(val) >= 100) {
                            if (cell.type === 100 || cell.observed) {
                                score -= 50;
                            } else {
                                score += 30;
                            }
                        }
                    }
                }
            }
        }

        // Quantum Potential Bonus (Midgame Special)
        // If I observe, do I gain lots of pieces?
        // Heuristic: Unobserved pieces count.
        // Actually, let's stick to "Observation Potential" from prompt as:
        // "Unobserved Count * 0.5"? Or is it something else?
        // Prompt Check: "Quantum Strategy: If observation yields +5 expected... add score."
        // Since we can't simulate easily here, let's use Unstable Count as a proxy for "Potential to gain control" 
        // OR "Risk".
        // Let's implement StabilityScore (already in loop) + Small Bonus for having Unobserved 90s (Potential to flip back if lost?)
        // Prompt says: "ObservationPotential * 0.5".
        // Let's use: Count of My Unobserved Pieces * 5 (Reward for keeping Quantum state alive midgame? Or penalty?)
        // Actually, prompt says "Penalize 70/90 usage" in Midgame? No, "Corner 70/90: -30".
        // "Observation Potential" seems to imply "Value of holding the observe Button".
        // Let's stick to the core Stability + Position.

        // Midgame Mobility
        const myMoves = this.getLegalMoves(state, aiColor).length;
        const opMoves = this.getLegalMoves(state, opponent).length;
        score += (myMoves - opMoves) * 10;

        return score;
    }

    getLegalMoves(state, player) {
        const moves = [];
        // Basic getValidMoves clone based on state.board
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.isValidMove(state.board, r, c, player)) {
                    // Expand to Types
                    // Constant branching factor reduction by picking Best Piece Type
                    const type = this.getBestPieceType(state, player);
                    moves.push({ r, c, type });
                }
            }
        }
        return moves;
    }

    // Helper to check valid move on statless board
    isValidMove(board, r, c, player) {
        if (board[r][c]) return false;
        const opponent = player === 'black' ? 'white' : 'black';
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

        for (const [dr, dc] of directions) {
            let tr = r + dr, tc = c + dc;
            let hasOpponent = false;
            while (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
                const cell = board[tr][tc];
                if (cell && cell.color === opponent) {
                    hasOpponent = true;
                } else if (cell && cell.color === player) {
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

    getBestPieceType(state, player) {
        // Enforce Game Rules Strictly (Manual 1.2)
        // 1. Count existing Unobserved pieces
        let c100 = 0, c90 = 0, c70 = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = state.board[r][c];
                if (cell && cell.color === player && !cell.observed) {
                    if (cell.type === 100) c100++;
                    if (cell.type === 90) c90++;
                    if (cell.type === 70) c70++;
                }
            }
        }

        const lastMoveWas70 = (state.prevMove && state.prevMove[player] === 70);

        // Try 100 (Strongest)
        // Rules: < 90s AND Last=70
        if (c100 < c90 && lastMoveWas70) {
            return 100;
        }

        // Try 90 (Stronger)
        // Rules: < 70s
        if (c90 < c70) {
            return 90;
        }

        // Default 70 (Always valid)
        return 70;
    }

    simulateMove(state, move) {
        // Create new state branch
        const newState = {
            board: state.board.map(row => row.map(cell => cell ? { ...cell } : null)),
            currentPlayer: state.currentPlayer,
            observationsLeft: state.observationsLeft, // No change on move
            stats: state.stats,
            prevMove: state.prevMove
        };

        // Place Piece
        newState.board[move.r][move.c] = {
            color: move.type ? state.currentPlayer : state.currentPlayer,
            type: move.type || 70,
            observed: false
        };

        // Flip logic (State update)
        const player = state.currentPlayer;
        const opponent = player === 'black' ? 'white' : 'black';
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

        for (const [dr, dc] of directions) {
            let tr = move.r + dr, tc = move.c + dc;
            let path = [];
            while (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
                const cell = newState.board[tr][tc];
                if (cell && cell.color === opponent) {
                    path.push([tr, tc]);
                } else if (cell && cell.color === player) {
                    // Flip
                    path.forEach(([pr, pc]) => {
                        newState.board[pr][pc].color = player;
                    });
                    break;
                } else {
                    break;
                }
                tr += dr; tc += dc;
            }
        }

        return newState;
    }

    sortMoves(moves) {
        // Heuristic sort: Corners first, then capture counts
        // Simplified: just put corners at front
        moves.sort((a, b) => {
            const valA = this.weights[a.r][a.c];
            const valB = this.weights[b.r][b.c];
            return valB - valA;
        });
    }

    evaluateObservation(state, depth) {
        // Defensive Observation check
        // If high value pieces are unobserved and could be lost (heuristic), 
        // suggest observation.

        let unobserved100 = 0;
        let unobserved90 = 0;
        let unobservedTotal = 0;
        let hasUnobservedEdge = false;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = state.board[r][c];
                if (cell && cell.color === state.currentPlayer && !cell.observed) {
                    unobservedTotal++;
                    if (cell.type === 100) unobserved100++;
                    if (cell.type === 90) unobserved90++;

                    // Check Corner/Edge
                    if (this.weights[r][c] >= 20) {
                        hasUnobservedEdge = true; // Includes Corners (120) and Edges (20)
                    }
                }
            }
        }

        // CRITICAL STRATEGY: Quantum Limits (Soft Cap)
        // If we have too many unstable 90s (5), we might want to observe to free up slots.
        // But 100s no longer have a hard cap of 2. 
        // We can keep the 90s cap check as a strategy, but remove the 100s check.
        if (unobserved90 >= 5) return { shouldObserve: true };

        // STRATEGY: Secure High Value Positions
        if (hasUnobservedEdge) return { shouldObserve: true };

        // STRATEGY: Volume (Don't let too many pieces remain unstable)
        if (unobservedTotal >= 4) return { shouldObserve: true };

        return { shouldObserve: false };
    }
};
