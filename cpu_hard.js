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
        // 1. Adaptive Depth Logic
        const emptyCount = this.countEmptyCells(this.game.board);

        let searchDepth = 4; // Default deeper than before (was 3)
        if (emptyCount <= 12) searchDepth = 10; // Endgame solving
        if (emptyCount <= 8) searchDepth = 14;  // Perfect solve

        console.log(`CpuHard: Thinking... (Empty: ${emptyCount}, Depth: ${searchDepth})`);
        const startTime = Date.now();
        this.nodeCount = 0;

        const rootState = this.getGameState(this.game);
        const aiColor = rootState.currentPlayer;

        // 2. Integrated Search (Moves + Observe)
        const result = this.alphaBeta(rootState, searchDepth, -Infinity, Infinity, true, aiColor);

        console.log(`CpuHard: Search Complete in ${Date.now() - startTime}ms. Nodes: ${this.nodeCount}`);
        console.log(`Best Score: ${result.score}`);

        if (result.bestMove) {
            return result.bestMove;
        }

        return null; // Pass
    }

    countEmptyCells(board) {
        let count = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (!board[r][c]) count++;
            }
        }
        return count;
    }

    // Capture lightweight state
    getGameState(gameMock) {
        return {
            board: gameMock.board.map(row => row.map(cell => cell ? { ...cell } : null)),
            currentPlayer: gameMock.currentPlayer,
            observationsLeft: { ...gameMock.observationsLeft },
            stats: gameMock.countPieceTypes(gameMock.currentPlayer), // Heuristic stats
            prevMove: gameMock.lastMoveType ? { ...gameMock.lastMoveType } : {},
            observedThisTurn: false // Track if observation was used in current turn
        };
    }

    // Minimax with Alpha-Beta and Integrated Observation
    alphaBeta(state, depth, alpha, beta, maximizingPlayer, cpuColor) {
        this.nodeCount++;

        // Terminal Check
        if (depth === 0 || state.gameOver) {
            return { score: this.evaluateBoard(state, cpuColor) };
        }

        // Get Moves
        const legalMoves = this.getLegalMoves(state, state.currentPlayer);

        // INTEGRATION: Add "Observe" as a candidate move if available
        // Only allow observation if: (1) observations left AND (2) NOT already observed this turn
        if (state.observationsLeft[state.currentPlayer] > 0 && !state.observedThisTurn) {
            legalMoves.push({ action: 'observe' });
        }

        if (legalMoves.length === 0) {
            // PASS Logic
            if (state.passedBefore) {
                // Double pass = Game Over code (handled by game logic usually, but here simulating)
                // If we simulate double pass, we should score it.
                // But simplistically just switch turn.
                // Better: Check if opponent also has no moves -> Game Over.
                // Assuming simple turn switch for now to avoid infinite recursion risk.
                const childState = { ...state, currentPlayer: state.currentPlayer === 'black' ? 'white' : 'black', passedBefore: true };
                // Reduce depth on pass?
                return this.alphaBeta(childState, depth - 1, alpha, beta, !maximizingPlayer, cpuColor);
            }
            const childState = { ...state, currentPlayer: state.currentPlayer === 'black' ? 'white' : 'black', passedBefore: true };
            return this.alphaBeta(childState, depth, alpha, beta, !maximizingPlayer, cpuColor);
        }

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            let bestMove = null;

            this.sortMoves(legalMoves);

            for (const move of legalMoves) {
                let childState;
                let penalty = 0;

                if (move.action === 'observe') {
                    childState = this.simulateObserve(state);

                    // NEW STRATEGY: Confidence-Based Dynamic Depth
                    // Observation clears uncertainty, allowing us to see deeper into the future reliability.
                    // We DO NOT apply artificial penalties here anymore.
                    // Instead, we rely on the "Deep Search Bonus" below.
                    penalty = 0;

                    // Small opportunity cost to prevent trivial observation at very end of game
                    // and to discourage wasting the first observation too early.
                    // Small opportunity cost to prevent trivial observation at very end of game
                    // and to discourage wasting the first observation too early.
                    const observationsRemaining = state.observationsLeft[state.currentPlayer];
                    if (observationsRemaining === 2) {
                        penalty += 30; // Mild cost for first observation

                        // STRICT EARLY GAME CHECK:
                        // If the board is still very empty (opening), DO NOT OBSERVE.
                        // It's a waste of a turn and a resource.
                        const emptyCount = this.countEmptyCells(state.board);
                        if (emptyCount >= 54) { // First ~10 moves
                            penalty += 500; //Huge Penalty forces it to wait
                        }
                    }
                } else {
                    childState = this.simulateMove(state, move);
                }

                // Next turn logic
                if (move.action !== 'observe') {
                    childState.currentPlayer = childState.currentPlayer === 'black' ? 'white' : 'black';
                    childState.passedBefore = false; // Reset pass flag
                    childState.observedThisTurn = false; // Reset observation flag on turn switch
                }

                // If Observe, same player moves again (Maximizer stays Maximizer)
                const nextMaximizing = (move.action === 'observe') ? maximizingPlayer : false;

                // DYNAMIC DEPTH LOGIC:
                // If we Observe, we extend the search horizon because the board becomes deterministic (easier to read).
                // "Deep Search Bonus": +1 depth for Observation.
                // This makes the AI value the "clarity" gained by observation.
                let nextDepth;
                if (move.action === 'observe') {
                    nextDepth = depth + 1; // Effectively extends search!
                } else {
                    nextDepth = depth - 1;
                }

                const evalResult = this.alphaBeta(childState, nextDepth, alpha, beta, nextMaximizing, cpuColor);

                // Apply Penalty (Subtract from score if Maximizer is CPU)
                const finalScore = evalResult.score - penalty;

                if (finalScore > maxEval) {
                    maxEval = finalScore;
                    bestMove = move;
                }
                alpha = Math.max(alpha, finalScore);
                if (beta <= alpha) break;
            }
            return { score: maxEval, bestMove };
        } else {
            let minEval = Infinity;

            for (const move of legalMoves) {
                let childState;
                let bonus = 0;

                if (move.action === 'observe') {
                    childState = this.simulateObserve(state);
                    // No artificial bonus needed.
                    bonus = 0;

                    const observationsRemaining = state.observationsLeft[state.currentPlayer];
                    if (observationsRemaining === 2) {
                        bonus += 30; // Same mild cost for opponent

                        // Strict Early Game Check for Opponent too
                        const emptyCount = this.countEmptyCells(state.board);
                        if (emptyCount >= 54) {
                            bonus += 500;
                        }
                    }
                } else {
                    childState = this.simulateMove(state, move);
                }

                // Next turn logic (Minimizer)
                if (move.action !== 'observe') {
                    childState.currentPlayer = childState.currentPlayer === 'black' ? 'white' : 'black';
                    childState.passedBefore = false;
                    childState.observedThisTurn = false;
                }

                // Recursive Call
                // If turn switched, swap to Maximizer (true).
                // If turn kept, keep Minimizer (false) - Opponent moves again (or observes again).
                const nextMaximizing = (move.action === 'observe') ? maximizingPlayer : true;

                // DYNAMIC DEPTH LOGIC (Minimizer)
                let nextDepth;
                if (move.action === 'observe') {
                    nextDepth = depth + 1; // Bonus depth for observation
                } else {
                    nextDepth = depth - 1;
                }

                const evalResult = this.alphaBeta(childState, nextDepth, alpha, beta, nextMaximizing, cpuColor);

                // Bonus means Opponent Score is Higher (Worse for them) from our perspective?
                // Wait, Minimax minimizes score. If score is HIGHER, it's BAD for Minimizer.
                const finalScore = evalResult.score + bonus;

                if (finalScore < minEval) {
                    minEval = finalScore;
                }
                beta = Math.min(beta, finalScore);
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
        const PHASE_ENDGAME = 58; // Last 6 moves are pure endgame

        // 2. Phase-Based Evaluation

        // --- Phase 3: ENDGAME (Pure Disc Maximization) ---
        if (discCount >= PHASE_ENDGAME || state.gameOver) {
            // In endgame, Position values imply nothing. Only the final count matters.
            // Note: Multiply by 1000 to prioritize winning over any residual positional bonus
            return (myDiscExpected - opDiscExpected) * 1000;
        }

        let score = 0;

        // --- Phase 1: OPENING (Mobility & minimal discs) ---
        if (discCount <= PHASE_OPEN) {
            // Objective: Mobility & Frontier (Open Space Control)
            // Weight: Mobility is King.

            const myMoves = this.getLegalMoves(state, aiColor).length;
            const opMoves = this.getLegalMoves(state, opponent).length;

            // Mobility Score: HUGE bonus for having more moves
            score += (myMoves - opMoves) * 50;

            // Positional Score (Use Weights but scale down)
            let posScore = 0;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const cell = state.board[r][c];
                    if (cell) {
                        const w = this.weights[r][c];
                        if (cell.color === aiColor) posScore += w;
                        else posScore -= w;
                    }
                }
            }
            score += posScore * 0.5;

            // Penalize having too many discs in opening (Evaporation strategy)
            score -= (myDiscExpected - opDiscExpected) * 5;

            return score;
        }

        // --- Phase 2: MIDGAME (Position & Stability) ---
        // Objective: Position, Stability, Mobility mixture

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
                                score -= 30; // Risk of losing corner
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

        // Midgame Mobility
        const myMoves = this.getLegalMoves(state, aiColor).length;
        const opMoves = this.getLegalMoves(state, opponent).length;
        score += (myMoves - opMoves) * 20;

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
                    const type = this.getBestPieceType(state, player, r, c);
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

    getBestPieceType(state, player, r, c) {
        // Enforce Game Rules Strictly (Manual 1.2)
        // 1. Count existing Unobserved pieces
        let c100 = 0, c90 = 0, c70 = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = state.board[row][col];
                if (cell && cell.color === player && !cell.observed) {
                    if (cell.type === 100) c100++;
                    if (cell.type === 90) c90++;
                    if (cell.type === 70) c70++;
                }
            }
        }

        const lastMoveWas70 = (state.prevMove && state.prevMove[player] === 70);

        // Context Check
        const weight = this.weights[r][c];
        const isCorner = weight >= 100;
        const isBad = weight < -10;

        // Strategy 1: Corner/Critical? Force Best Available
        if (isCorner) {
            if (c100 < c90 && lastMoveWas70) return 100;
            if (c90 < c70) return 90;
            return 70;
        }

        // Strategy 2: Bad Spot? Save Good Pieces (Use 70)
        // Unless we have NO choice (e.g. forced to play there)
        if (isBad) {
            return 70;
        }

        // Strategy 3: Normal Play
        // Try to balance. 
        // Default Logic (Greedy strength for control)
        if (c100 < c90 && lastMoveWas70) {
            return 100;
        }
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
            observationsLeft: { ...state.observationsLeft }, // Proper copy
            stats: state.stats,
            prevMove: state.prevMove ? { ...state.prevMove } : {},
            observedThisTurn: state.observedThisTurn || false // Preserve flag
        };

        // Place Piece
        newState.board[move.r][move.c] = {
            color: state.currentPlayer,
            type: move.type || 70,
            observed: false
        };

        // Update prevMove to track what type was just played
        newState.prevMove[state.currentPlayer] = move.type || 70;

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

    simulateObserve(state) {
        // Create new state branch
        const newState = {
            board: state.board.map(row => row.map(cell => cell ? { ...cell } : null)),
            currentPlayer: state.currentPlayer,
            observationsLeft: { ...state.observationsLeft },
            stats: state.stats,
            prevMove: state.prevMove ? { ...state.prevMove } : {},
            observedThisTurn: true // Mark that observation was used this turn
        };

        // Decrement observation count
        if (newState.observationsLeft[state.currentPlayer] > 0) {
            newState.observationsLeft[state.currentPlayer]--;
        }

        // Mark all as observed (Optimistic/Deterministic)
        // Note: Real game does probabilistic flip. Here we assume stability (no flip).
        // The Risk Penalty in alphaBeta accounts for the flip probability.
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (newState.board[r][c]) {
                    newState.board[r][c].observed = true;
                }
            }
        }

        return newState;
    }

    sortMoves(moves) {
        // Heuristic sort: Corners first, then capture counts
        // Simplified: just put corners at front
        moves.sort((a, b) => {
            // Observe last
            if (a.action === 'observe') return 1;
            if (b.action === 'observe') return -1;

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

        // Count-based check (Fixes probability mass issue)
        // If > 1/8th of board is unstable, observe!
        if (unobservedTotal >= 8) return { shouldObserve: true };

        return { shouldObserve: false };
    }

    // New Framework: ETO (Entropy-Triggered Observation)
    evaluateObservationMove(state, player) {
        let obsValue = 0;

        let myUnstableCount = 0;
        let opUnstableCount = 0;
        let myVolatility = 0; // Weighted risk
        let opVolatility = 0; // Weighted potential
        let opHasUnobservedCorner = false;

        const opponent = player === 'black' ? 'white' : 'black';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = state.board[r][c];
                if (cell && !cell.observed) {
                    const flipProb = (cell.type === 70) ? 0.3 : (cell.type === 90) ? 0.1 : 0;
                    const weight = Math.abs(this.weights[r][c]); // Absolute strategic weight

                    if (cell.color === player) {
                        myUnstableCount++;
                        myVolatility += flipProb * weight;
                    } else {
                        opUnstableCount++;
                        opVolatility += flipProb * weight;

                        // Check for Sniper Target
                        if (weight >= 100) { // Corner
                            opHasUnobservedCorner = true;
                        }
                    }
                }
            }
        }

        const totalUnstable = myUnstableCount + opUnstableCount;

        // 1. Base Aggression Formula
        // We value Opponent Volatility (Potential to flip to us) highly.
        // We value Self Volatility (Risk) less (Calculated Aggression).
        obsValue += (opVolatility * 2.5) - (myVolatility * 1.0);

        // 2. Chaos Bonus (Thresholds based on COUNT, not Prob Mass)
        // Previous code used 12.0 Mass (Impossible). Now we use Count.
        if (totalUnstable >= 12) {
            obsValue += 150; // Massive Chaos -> Crave Stability/Flip
        } else if (totalUnstable >= 8) {
            obsValue += 50;
        }

        // 3. Early Game / Low Value Penalty
        if (totalUnstable < 4) {
            // Unless it's a sniper shot!
            if (!opHasUnobservedCorner) {
                obsValue -= 200; // Penalty (Value drops)
            }
        }

        // 4. Sniper Bonus (Corner)
        if (opHasUnobservedCorner) {
            obsValue += 250; // Huge incentive to flip that corner
        }

        // 5. Resource Scarcity
        const obsLeft = state.observationsLeft[player];
        if (obsLeft === 2) {
            // Slight hesitation to use the first one unless value is high
            obsValue -= 50;
        }

        return obsValue;
    }
};
