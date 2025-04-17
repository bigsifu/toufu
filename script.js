document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.cell');
    const statusDisplay = document.getElementById('status');
    const resetButton = document.getElementById('resetButton');
    const gameBoardElement = document.querySelector('.game-board');

    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X'; // X 是玩家, O 是 AI
    let gameActive = true;
    let moveCount = 0; // 总步数
    let playerXMoves = []; // 记录玩家 X 的棋子位置索引
    let playerOMoves = []; // 记录玩家 O 的棋子位置索引

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    const statusMessages = {
        xTurn: '玩家 X 回合',
        oTurn: '电脑 O 回合',
        xWin: '玩家 X 胜利！',
        oWin: '电脑 O 胜利！',
        draw: '平局！',
        removing: '正在移除棋子...'
    };

    // --- 游戏核心逻辑 ---

    function handleCellPlayed(clickedCell, clickedCellIndex) {
        // 1. 更新内部状态
        board[clickedCellIndex] = currentPlayer;
        const currentMovesList = currentPlayer === 'X' ? playerXMoves : playerOMoves;
        currentMovesList.push(clickedCellIndex);
        moveCount++;

        // 2. 更新界面
        clickedCell.innerHTML = `<span>${currentPlayer}</span>`; // 包裹 span 为了动画
        clickedCell.classList.add(currentPlayer);
        clickedCell.removeEventListener('click', handleCellClick); // 禁止再次点击

        // 3. 检查移除逻辑 (从第四轮开始，即总步数达到 7 时)
        const removalTriggerMove = 7; // 双方各下3子后，第7步开始触发
        if (moveCount >= removalTriggerMove) {
            handlePieceRemoval(currentPlayer);
        } else {
            // 如果不移除，直接检查结果和切换玩家
            checkResult();
            if (gameActive) {
                switchPlayer();
            }
        }
    }

    function handlePieceRemoval(player) {
        const movesList = player === 'X' ? playerXMoves : playerOMoves;
        // 需要移除的棋子数量必须多于3个
        // (因为添加后才检查，所以数量正好是 4 或更多时才执行)
        if (movesList.length > 3) {
            statusDisplay.textContent = statusMessages.removing;
            gameBoardElement.classList.add('disabled'); // 移除时禁止操作

            // 随机选择一个该玩家已下的棋子（不能是刚下的那一个）
            const previousMoves = movesList.slice(0, -1); // 排除最后一个（刚下的）
            const indexToRemoveFromList = Math.floor(Math.random() * previousMoves.length);
            const cellIndexToRemove = previousMoves[indexToRemoveFromList];

            // 从玩家棋子记录中移除该索引
            const globalIndexInList = movesList.indexOf(cellIndexToRemove);
            if (globalIndexInList > -1) {
                movesList.splice(globalIndexInList, 1);
            }

            // 执行动画并更新状态
            const cellToRemoveElement = document.querySelector(`.cell[data-index='${cellIndexToRemove}']`);
            cellToRemoveElement.classList.add('removing');

            // 动画结束后清理
            cellToRemoveElement.addEventListener('animationend', () => {
                board[cellIndexToRemove] = ''; // 清空棋盘状态
                cellToRemoveElement.innerHTML = ''; // 清空显示
                cellToRemoveElement.classList.remove('X', 'O', 'removing'); // 清除样式
                cellToRemoveElement.addEventListener('click', handleCellClick); // 重新允许点击

                // 动画完成后再检查结果和切换玩家
                checkResult();
                if (gameActive) {
                    switchPlayer();
                }
                gameBoardElement.classList.remove('disabled'); // 恢复操作
            }, { once: true }); // 确保事件只触发一次

        } else {
            // 如果棋子不足4个（例如前6步），正常流程
            checkResult();
            if (gameActive) {
                switchPlayer();
            }
        }
    }


    function checkResult() {
        let roundWon = false;
        let winningLine = null;
        for (let i = 0; i < winningConditions.length; i++) {
            const winCondition = winningConditions[i];
            const a = board[winCondition[0]];
            const b = board[winCondition[1]];
            const c = board[winCondition[2]];
            if (a === '' || b === '' || c === '') {
                continue; // 有空格子，这条线不可能赢
            }
            if (a === b && b === c) {
                roundWon = true;
                winningLine = winCondition; // 记录获胜的线
                break;
            }
        }

        if (roundWon) {
            statusDisplay.textContent = currentPlayer === 'X' ? statusMessages.xWin : statusMessages.oWin;
            gameActive = false;
            // 高亮获胜的格子 (可选)
            winningLine.forEach(index => cells[index].classList.add('winner'));
            disableBoard();
            return;
        }

        // 检查平局 (所有格子都满了，且没有赢家)
        // 注意：因为有移除机制，单纯看 board.includes('') 不可靠
        // 更好的平局判断可能需要结合步数或特定条件，这里简化处理：
        // 如果游戏没赢，且所有格子都被填过或正在被填 (moveCount足够大但非赢)，视为继续
        // 或者，当无法下棋时（虽然理论上总有地方下，除非代码bug）
        // 简单起见，我们仍然用 board 检查，但在移除逻辑后，平局可能性降低
        let roundDraw = !board.includes('') && gameActive;
        if (roundDraw) {
            statusDisplay.textContent = statusMessages.draw;
            gameActive = false;
            disableBoard();
            return;
        }
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        statusDisplay.textContent = currentPlayer === 'X' ? statusMessages.xTurn : statusMessages.oTurn;

        // 如果切换到 AI (O) 的回合
        if (currentPlayer === 'O' && gameActive) {
            gameBoardElement.classList.add('disabled'); // 禁用棋盘，防止玩家在 AI 思考时点击
            // 添加一点延迟，模拟 AI 思考
            setTimeout(makeAIMove, 700); // 延迟 700ms
        } else {
             gameBoardElement.classList.remove('disabled'); // 确保玩家回合可操作
        }
    }

    function disableBoard() {
        cells.forEach(cell => cell.removeEventListener('click', handleCellClick));
        gameBoardElement.classList.add('disabled');
    }

    function handleCellClick(event) {
        const clickedCell = event.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        // 如果格子已下或游戏结束或不是玩家回合，则忽略
        if (board[clickedCellIndex] !== '' || !gameActive || currentPlayer !== 'X') {
            return;
        }

        handlePlayerMove(clickedCell, clickedCellIndex);
    }

    function handlePlayerMove(cell, index) {
        if (board[index] === '' && gameActive) {
            handleCellPlayed(cell, index);
        }
    }

    // --- AI 逻辑 ---
    function makeAIMove() {
        if (!gameActive) return;

        let bestMove = findBestMove();

        if (bestMove !== -1) {
            const cellToPlay = document.querySelector(`.cell[data-index='${bestMove}']`);
             // 确保 AI 找到的格子确实是空的 (以防万一)
            if(cellToPlay && board[bestMove] === '') {
                handleCellPlayed(cellToPlay, bestMove);
            } else {
                 // 如果最佳移动无效（可能因为移除逻辑的意外情况），则随机选择一个有效位置
                findRandomMove();
            }
        } else {
             // 如果没有找到好的移动（例如棋盘满了但游戏没结束？理论上不应发生）
             findRandomMove(); // 作为后备
        }
        // AI移动处理完后，如果是玩家回合，则解除禁用
        if (currentPlayer === 'X') {
            gameBoardElement.classList.remove('disabled');
        }
    }

     function findRandomMove() {
        let availableCells = [];
        board.forEach((cell, index) => {
            if (cell === '') {
                availableCells.push(index);
            }
        });
        if (availableCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableCells.length);
            const randomMoveIndex = availableCells[randomIndex];
            const cellToPlay = document.querySelector(`.cell[data-index='${randomMoveIndex}']`);
            handleCellPlayed(cellToPlay, randomMoveIndex);
        }
        // 如果没有可用格子，游戏应该已经结束或平局
    }


    function findBestMove() {
        // 1. 检查 AI (O) 能否一步获胜
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'O'; // 试探
                if (checkWinCondition('O')) {
                    board[i] = ''; // 恢复
                    return i;
                }
                board[i] = ''; // 恢复
            }
        }

        // 2. 检查玩家 (X) 能否一步获胜，如果能，则阻止
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'X'; // 试探
                if (checkWinCondition('X')) {
                    board[i] = ''; // 恢复
                    return i; // 阻止对方获胜
                }
                board[i] = ''; // 恢复
            }
        }

        // 3. 策略：尝试占据中心 (4)
        if (board[4] === '') return 4;

        // 4. 策略：尝试占据角落 (0, 2, 6, 8)
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(index => board[index] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // 5. 策略：尝试占据边中间 (1, 3, 5, 7)
        const sides = [1, 3, 5, 7];
        const availableSides = sides.filter(index => board[index] === '');
        if (availableSides.length > 0) {
            return availableSides[Math.floor(Math.random() * availableSides.length)];
        }

        // 6. 如果以上都没有，随机找一个空格 (理论上应该有，除非棋盘满了)
        let availableCells = [];
        board.forEach((cell, index) => {
            if (cell === '') {
                availableCells.push(index);
            }
        });
         if (availableCells.length > 0) {
            return availableCells[Math.floor(Math.random() * availableCells.length)];
        }

        return -1; // 没有可移动的格子了
    }

    // 辅助函数：仅检查指定玩家是否满足获胜条件（用于 AI 判断）
    function checkWinCondition(player) {
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (board[a] === player && board[b] === player && board[c] === player) {
                return true;
            }
        }
        return false;
    }


    // --- 重置游戏 ---
    function resetGame() {
        board = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        gameActive = true;
        moveCount = 0;
        playerXMoves = [];
        playerOMoves = [];

        statusDisplay.textContent = statusMessages.xTurn;
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('X', 'O', 'winner', 'removing');
            cell.removeEventListener('click', handleCellClick); // 移除旧监听器
            cell.addEventListener('click', handleCellClick); // 添加新监听器
        });
         gameBoardElement.classList.remove('disabled'); // 确保棋盘可用
    }

    // --- 初始化 ---
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    resetButton.addEventListener('click', resetGame);

    // 初始状态设置
    statusDisplay.textContent = statusMessages.xTurn;
});