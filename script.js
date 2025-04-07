document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gomoku-board');
    const ctx = canvas.getContext('2d');
    const statusMessage = document.getElementById('status-message');
    const newGameButton = document.getElementById('new-game');
    const difficultySelect = document.getElementById('difficulty');
    const boardContainer = document.querySelector('.board-container');


    const BOARD_SIZE = 15; // Standard 15x15 board
    let cellSize;
    let pieceRadius;
    let board = []; // 0: empty, 1: black (player), 2: white (AI)
    let currentPlayer = 1; // Player (black) starts
    let isGameOver = false;
    let aiDifficulty = 'medium';
    const STAR_POINTS = [ // Star points for aesthetics
        { x: 3, y: 3 }, { x: 11, y: 3 }, { x: 7, y: 7 },
        { x: 3, y: 11 }, { x: 11, y: 11 }
    ];

    function resizeCanvas() {
        // Make canvas resolution match its display size
        const containerWidth = boardContainer.offsetWidth;
        canvas.width = containerWidth;
        canvas.height = containerWidth; // Keep it square

        // Recalculate cell size and piece radius
        cellSize = canvas.width / (BOARD_SIZE); // Use BOARD_SIZE for grid spacing
        pieceRadius = cellSize * 0.4; // Adjust piece size relative to cell

        drawBoard(); // Redraw after resize
        drawAllPieces(); // Redraw existing pieces
    }


    function initBoard() {
        board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    }

    function drawGrid() {
        ctx.strokeStyle = '#6b401a'; // Darker lines for grid
        ctx.lineWidth = 1;

        for (let i = 0; i < BOARD_SIZE; i++) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(cellSize / 2 + i * cellSize, cellSize / 2);
            ctx.lineTo(cellSize / 2 + i * cellSize, canvas.height - cellSize / 2);
            ctx.stroke();

            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(cellSize / 2, cellSize / 2 + i * cellSize);
            ctx.lineTo(canvas.width - cellSize / 2, cellSize / 2 + i * cellSize);
            ctx.stroke();
        }
    }

     function drawStarPoints() {
        ctx.fillStyle = '#6b401a';
        const starRadius = pieceRadius * 0.2; // Small radius for star points

        STAR_POINTS.forEach(point => {
            const canvasX = cellSize / 2 + point.x * cellSize;
            const canvasY = cellSize / 2 + point.y * cellSize;
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, starRadius, 0, Math.PI * 2);
            ctx.fill();
        });
    }


    function drawBoard() {
        // Clear canvas
        ctx.fillStyle = '#e4b47c'; // Board color
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawGrid();
        drawStarPoints(); // Draw the star points
    }

    function drawPiece(x, y, player) {
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[y][x] === 0) {
           // console.warn(`Attempted to draw piece at invalid or empty location: ${x}, ${y}`);
            return; // Don't draw if invalid or empty
        }
        // Use board indices (x, y)
        const canvasX = cellSize / 2 + x * cellSize;
        const canvasY = cellSize / 2 + y * cellSize;

        ctx.beginPath();
        ctx.arc(canvasX, canvasY, pieceRadius, 0, Math.PI * 2);
        ctx.fillStyle = player === 1 ? '#111' : '#eee'; // Black or White

        // Optional: Add a subtle border for definition
        ctx.strokeStyle = player === 1 ? '#444' : '#bbb';
        ctx.lineWidth = 1;

        ctx.fill();
        ctx.stroke(); // Draw the border
    }

    function drawAllPieces() {
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] !== 0) {
                    drawPiece(x, y, board[y][x]);
                }
            }
        }
    }


    function checkWin(x, y, player) {
        const directions = [
            [1, 0], // Horizontal
            [0, 1], // Vertical
            [1, 1], // Diagonal \
            [1, -1] // Diagonal /
        ];

        for (const [dx, dy] of directions) {
            let count = 1; // Count the piece just placed

            // Check in the positive direction
            for (let i = 1; i < 5; i++) {
                const nx = x + i * dx;
                const ny = y + i * dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                    count++;
                } else {
                    break; // Stop if out of bounds or different player
                }
            }

            // Check in the negative direction
            for (let i = 1; i < 5; i++) {
                const nx = x - i * dx;
                const ny = y - i * dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                    count++;
                } else {
                    break; // Stop if out of bounds or different player
                }
            }

            if (count >= 5) {
                return true; // Found five in a row
            }
        }
        return false; // No five in a row found
    }

    function handleBoardClick(event) {
        if (isGameOver || currentPlayer !== 1) { // Only player 1 (human) can click
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;    // relationship bitmap vs. element for X
        const scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y


        const canvasX = (event.clientX - rect.left) * scaleX;
        const canvasY = (event.clientY - rect.top) * scaleY;


        // Find the nearest intersection point
        const x = Math.round((canvasX - cellSize / 2) / cellSize);
        const y = Math.round((canvasY - cellSize / 2) / cellSize);


        if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[y][x] === 0) {
           placePiece(x, y, currentPlayer);
        }
    }

     function placePiece(x, y, player) {
         if (isGameOver || x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[y][x] !== 0) {
            return false; // Invalid move
        }

        board[y][x] = player;
        drawPiece(x, y, player); // Just draw the new piece

        if (checkWin(x, y, player)) {
            isGameOver = true;
            statusMessage.textContent = `${player === 1 ? '你赢了' : 'AI 赢了'}!`;
            return true; // Indicate move was placed and game ended
        }

        // Switch Player
        currentPlayer = 3 - player; // Switches between 1 and 2

        if (!isGameOver) {
            statusMessage.textContent = `轮到 ${currentPlayer === 1 ? '你' : 'AI'} (${currentPlayer === 1 ? '黑' : '白'}棋)`;
            if (currentPlayer === 2) { // If it's AI's turn
                // Add a small delay for AI 'thinking' time
                setTimeout(makeAiMove, 500);
            }
        }
        return true; // Indicate move was placed
     }


    function resetGame() {
        isGameOver = false;
        currentPlayer = 1; // Player (black) starts
        aiDifficulty = difficultySelect.value;
        statusMessage.textContent = '新游戏开始，请落子 (黑棋)';
        initBoard();
        resizeCanvas(); // Recalculate sizes and redraw empty board
    }

    // --- AI Logic ---

    function makeAiMove() {
        if (isGameOver) return;

        let bestMove = null;

        // Select AI strategy based on difficulty
        if (aiDifficulty === 'easy') {
            bestMove = findEasyMove();
        } else if (aiDifficulty === 'medium') {
            bestMove = findMediumMove();
        } else if (aiDifficulty === 'hard') {
            // Placeholder: Hard AI currently uses Medium strategy
            // console.warn("Hard AI not fully implemented, using Medium strategy.");
            bestMove = findMediumMove(); // Replace with findHardMove() when implemented
        }

        // If a valid move is found, place the piece
        if (bestMove) {
            placePiece(bestMove.x, bestMove.y, 2); // AI is player 2 (white)
        } else {
            // Fallback: place randomly if no strategic move found (shouldn't happen ideally)
             console.warn("AI couldn't find a strategic move, placing randomly.");
             const randomMove = findRandomMove();
             if(randomMove) {
                 placePiece(randomMove.x, randomMove.y, 2);
             } else {
                 // No empty spots left? (Draw - very rare in Gomoku)
                 isGameOver = true;
                 statusMessage.textContent = "棋盘已满，平局!";
             }
        }
    }

    function getAllEmptySpots() {
        const spots = [];
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) {
                    spots.push({ x, y });
                }
            }
        }
        return spots;
    }

     function findRandomMove() {
        const emptySpots = getAllEmptySpots();
        if (emptySpots.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptySpots.length);
            return emptySpots[randomIndex];
        }
        return null; // No empty spots
    }


    // --- Easy AI: Random + Basic Blocking/Winning ---
    function findEasyMove() {
         const emptySpots = getAllEmptySpots();
        if (emptySpots.length === 0) return null;

        // 1. Check if AI can win in one move
        for (const spot of emptySpots) {
            board[spot.y][spot.x] = 2; // Temporarily place AI piece
            if (checkWin(spot.x, spot.y, 2)) {
                board[spot.y][spot.x] = 0; // Reset
                return spot; // Winning move
            }
            board[spot.y][spot.x] = 0; // Reset
        }

        // 2. Check if Player can win in one move and block it
        for (const spot of emptySpots) {
            board[spot.y][spot.x] = 1; // Temporarily place Player piece
            if (checkWin(spot.x, spot.y, 1)) {
                board[spot.y][spot.x] = 0; // Reset
                return spot; // Blocking move
            }
            board[spot.y][spot.x] = 0; // Reset
        }

        // 3. Otherwise, choose a random empty spot
        return findRandomMove();
    }


    // --- Medium AI: Scoring Heuristic ---
    // (This is a simplified scoring model)
    function findMediumMove() {
        const emptySpots = getAllEmptySpots();
        if (emptySpots.length === 0) return null;

        let bestScore = -Infinity;
        let bestMove = null;

        for (const spot of emptySpots) {
            // Calculate score for AI placing here
            board[spot.y][spot.x] = 2; // Try AI move
            let aiScore = calculateScore(spot.x, spot.y, 2);
             if (checkWin(spot.x, spot.y, 2)) aiScore = 100000; // Winning move gets highest score
            board[spot.y][spot.x] = 0; // Reset

            // Calculate score for Player placing here (for blocking)
            board[spot.y][spot.x] = 1; // Try Player move
            let playerScore = calculateScore(spot.x, spot.y, 1);
             if (checkWin(spot.x, spot.y, 1)) playerScore = 50000; // Blocking opponent win is very important
            board[spot.y][spot.x] = 0; // Reset

            // Simple combination: prioritize winning, then blocking, then offensive/defensive scores
             let currentScore = aiScore + playerScore; // Combine scores (adjust weights for better AI)


            if (currentScore > bestScore) {
                bestScore = currentScore;
                bestMove = spot;
            }
             // Add slight randomness to choose between equally good moves
             else if (currentScore === bestScore && Math.random() > 0.5) {
                 bestMove = spot;
            }
        }

        // Fallback if no move evaluated positively (e.g., first move)
        if (!bestMove && emptySpots.length > 0) {
           // Pick center or near center if available as a fallback strategy
            const center = Math.floor(BOARD_SIZE / 2);
            for(let dx = 0; dx <= center; dx++){
                for(let dy = 0; dy <= center; dy++){
                    const candidates = [
                        {x: center+dx, y: center+dy}, {x: center-dx, y: center+dy},
                        {x: center+dx, y: center-dy}, {x: center-dx, y: center-dy}
                    ];
                    for(const c of candidates){
                        if(c.x >=0 && c.x < BOARD_SIZE && c.y >=0 && c.y < BOARD_SIZE && board[c.y][c.x] === 0){
                             return c; // Return first empty spot near center
                        }
                    }
                }
            }
           // If center is full somehow, just pick random
            return findRandomMove();
        }

        return bestMove;
    }

    // --- Heuristic Scoring Function (Simplified) ---
    function calculateScore(x, y, player) {
        let score = 0;
        const opponent = 3 - player;
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

        // Base score for occupying a spot (slightly higher near center)
        const center = Math.floor(BOARD_SIZE / 2);
        score += (center - Math.abs(x - center)) + (center - Math.abs(y - center));


        for (const [dx, dy] of directions) {
            // Check potential lines formed by placing piece at (x, y)
             // --- Check for 4 in a row (Live Four / Dead Four) ---
            if (countConsecutive(x, y, player, dx, dy, 4)) score += 5000; // Highly valuable

            // --- Check for 3 in a row (Live Three / Dead Three) ---
            if (countConsecutive(x, y, player, dx, dy, 3)) score += 500;

             // --- Check for 2 in a row (Live Two / Dead Two) ---
            if (countConsecutive(x, y, player, dx, dy, 2)) score += 50;

            // --- Check for blocking opponent's lines (Simplified) ---
             // Blocking opponent's 4 is handled by the checkWin in findMediumMove
             if (countConsecutive(x, y, opponent, dx, dy, 3)) score += 400; // Block opponent's 3
             if (countConsecutive(x, y, opponent, dx, dy, 2)) score += 40;  // Block opponent's 2

        }
        return score;
    }

    // Helper for calculateScore - Counts potential consecutive pieces *if* a piece were placed at x,y
    // This is a simplified check and doesn't fully evaluate "live" vs "dead" states.
    function countConsecutive(x, y, player, dx, dy, requiredCount) {
        let count = 1; // Start with the hypothetical piece at x, y

        // Check positive direction
        for (let i = 1; i < requiredCount; i++) {
            const nx = x + i * dx;
            const ny = y + i * dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                count++;
            } else if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === 0) {
                 // Allows counting potential if space is open
                 // More complex AI would differentiate between open ends (live) and blocked ends (dead)
                 break;
            }
            else {
                break; // Blocked by opponent or edge
            }
        }

        // Check negative direction
         for (let i = 1; i < requiredCount; i++) {
            const nx = x - i * dx;
            const ny = y - i * dy;
             if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                count++;
            } else if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === 0) {
                 break;
            } else {
                break;
            }
        }


        // This simple version just checks if placing the piece *could* lead to the required count
        // A real evaluation needs to check if the resulting line is "live" (open on both ends for 3s/4s)
        return count >= requiredCount;
    }


    // --- Hard AI: Placeholder ---
    // A real Hard AI would use Minimax with Alpha-Beta Pruning and a much more sophisticated
    // evaluation function considering live/dead threes/fours, VCF/VCT threats, etc.
    // This is complex to implement correctly.
    function findHardMove() {
        console.warn("Hard AI using Medium strategy for now.");
        return findMediumMove(); // Use medium strategy as a placeholder
    }


    // --- Event Listeners ---
    canvas.addEventListener('click', handleBoardClick);
    newGameButton.addEventListener('click', resetGame);
    difficultySelect.addEventListener('change', (event) => {
        aiDifficulty = event.target.value;
        // Optional: Reset game when difficulty changes? Or apply to next game?
        // resetGame(); // Uncomment to reset immediately on difficulty change
    });
     // Add resize listener
    window.addEventListener('resize', resizeCanvas);


    // --- Initial Game Setup ---
    resetGame(); // Initialize and draw the board on load

});