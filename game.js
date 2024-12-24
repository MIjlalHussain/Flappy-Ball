	class FlappyBird {
    constructor() {
        this.bird = document.getElementById('bird');
        this.gameContainer = document.getElementById('game-container');
        this.gameDiv = document.getElementById('game');
        this.mainMenu = document.getElementById('main-menu');
        this.gameOverMenu = document.getElementById('game-over');
        this.scoreElement = document.getElementById('score');
        this.finalScoreElement = document.getElementById('final-score');
        
        this.birdPos = { x: 50, y: 200 };
        this.velocity = 0;
        this.gravity = 0.5;
        this.jump = -8;
        this.pipes = [];
        this.score = 0;
        this.gameLoop = null;
        this.isGameRunning = false;
        this.isDeathAnimating = false;
        this.ground = document.getElementById('ground');
        this.groundHeight = 100; // Height of the ground in pixels
        
        this.highScoreElement = document.getElementById('high-score');
        this.menuHighScoreElement = document.getElementById('menu-high-score');
        this.gameOverHighScoreElement = document.getElementById('game-over-high-score');
        this.newHighScoreElement = document.getElementById('new-high-score');
        
        this.highScore = parseInt(localStorage.getItem('flappyBirdHighScore')) || 0;
        this.updateHighScoreDisplay();
        
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.namePopup = document.getElementById('name-popup');
        this.playerNameInput = document.getElementById('player-name');
        this.submitScoreButton = document.getElementById('submit-score');
        
        this.leaderboard = JSON.parse(localStorage.getItem('flappyBirdLeaderboard')) || [];
        this.updateLeaderboardDisplay();
        
        this.submitScoreButton.addEventListener('click', () => this.submitScore());
        
        this.initializeEventListeners();
        this.initializeMonitorToggle();
        
        this.secretCode = '';
        this.targetCode = 'reset';
        this.resetPopup = document.getElementById('reset-popup');
        this.confirmResetButton = document.getElementById('confirm-reset');
        this.cancelResetButton = document.getElementById('cancel-reset');
        
        this.initializeSecretCode();
    }

    initializeEventListeners() {
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('restart-button').addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isGameRunning) {
                this.birdJump();
            }
        });
        
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitScore();
            }
        });
    }

    startGame() {
        this.clearPipes();
        this.resetGame();
        this.mainMenu.classList.add('hidden');
        this.gameOverMenu.classList.remove('fade-in');
        this.gameOverMenu.classList.add('hidden');
        this.gameDiv.classList.remove('hidden');
        
        // Reset bird's position and appearance
        this.bird.style.display = 'block';
        this.bird.style.top = '200px';  // Reset vertical position
        this.bird.style.animation = '';  // Clear any animations
        this.bird.classList.remove('death', 'explode');
        this.gameContainer.classList.remove('shake');
        
        // Reset game state
        this.isGameRunning = true;
        this.isDeathAnimating = false;  // Reset death animation flag
        
        // Clear and restart game loop
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), 16);
        this.newHighScoreElement.classList.add('hidden');
    }

    resetGame() {
        this.birdPos = { x: 50, y: 200 };
        this.velocity = 0;
        this.pipes = [];
        this.score = 0;
        this.scoreElement.textContent = '0';
        
        // Remove any existing particles
        const particles = document.querySelectorAll('.particle');
        particles.forEach(particle => particle.remove());
    }

    birdJump() {
        this.velocity = this.jump;
        this.bird.style.transform = 'rotate(-20deg)';
        this.bird.classList.add('flap');
        setTimeout(() => {
            this.bird.classList.remove('flap');
            if (this.isGameRunning) {
                this.bird.style.transform = 'rotate(0deg)';
            }
        }, 200);
    }

    createPipe() {
        const gap = 150;
        const minHeight = 50;
        const maxHeight = this.gameContainer.clientHeight - gap - minHeight - this.groundHeight;
        const pipeHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        const topPipe = document.createElement('div');
        topPipe.className = 'pipe top';
        topPipe.style.height = pipeHeight + 'px';
        
        const bottomPipe = document.createElement('div');
        bottomPipe.className = 'pipe bottom';
        bottomPipe.style.height = (this.gameContainer.clientHeight - pipeHeight - gap - this.groundHeight) + 'px';
        bottomPipe.style.bottom = this.groundHeight + 'px';
        
        const initialX = this.gameContainer.clientWidth;
        
        this.gameContainer.appendChild(topPipe);
        this.gameContainer.appendChild(bottomPipe);
        
        this.pipes.push({
            top: topPipe,
            bottom: bottomPipe,
            x: initialX,
            counted: false
        });
    }

    clearPipes() {
        this.pipes.forEach(pipe => {
            pipe.top.remove();
            pipe.bottom.remove();
        });
        this.pipes = [];
    }

    update() {
        // Update bird position
        this.velocity += this.gravity;
        this.birdPos.y += this.velocity;
        this.bird.style.top = this.birdPos.y + 'px';

        // Create new pipes
        if (this.pipes.length === 0 || 
            this.pipes[this.pipes.length - 1].x < this.gameContainer.clientWidth - 300) {
            this.createPipe();
        }

        // Update pipes position
        this.pipes.forEach((pipe, index) => {
            pipe.x -= 4;
            pipe.top.style.transform = `translateX(${pipe.x}px)`;
            pipe.bottom.style.transform = `translateX(${pipe.x}px)`;

            if (!pipe.counted && pipe.x < this.birdPos.x) {
                this.score++;
                this.scoreElement.textContent = this.score;
                pipe.counted = true;
            }

            if (pipe.x < -60) {
                pipe.top.remove();
                pipe.bottom.remove();
                this.pipes.splice(index, 1);
            }

            if (this.checkCollision(pipe)) {
                this.gameOver();
            }
        });

        // Check for collision with ground or ceiling
        if (this.birdPos.y < 0 || this.birdPos.y > this.gameContainer.clientHeight - this.groundHeight - 40) {
            this.gameOver();
        }
    }

    checkCollision(pipe) {
        const birdRect = this.bird.getBoundingClientRect();
        const topPipeRect = pipe.top.getBoundingClientRect();
        const bottomPipeRect = pipe.bottom.getBoundingClientRect();

        return (
            birdRect.right > topPipeRect.left &&
            birdRect.left < topPipeRect.right &&
            (birdRect.top < topPipeRect.bottom || birdRect.bottom > bottomPipeRect.top)
        );
    }

    createParticles(x, y) {
        const particleCount = 15;
        const container = this.gameContainer;
        const groundY = this.gameContainer.clientHeight - this.groundHeight;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Set initial position
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            // Calculate random angles and distances
            const angle = (i / particleCount) * 360;
            const distance = Math.random() * 150 + 100;
            const tx = Math.cos(angle * Math.PI / 180) * distance;
            const ty = Math.sin(angle * Math.PI / 180) * distance - 200;
            
            // Calculate collision points
            const finalY = Math.min(groundY - 20, y + ty + 400); // Ensure particles don't go below ground
            const collisionY = this.calculateCollisionY(x, y, tx, ty);
            
            // Set custom properties for animation with collision
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${collisionY - y}px`);
            particle.style.setProperty('--bounce-height', `${-30 - Math.random() * 20}px`);
            particle.style.setProperty('--rot', `${Math.random() * 720}deg`);
            
            // Add bounce animation
            particle.style.animation = 'particleWithCollision 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            
            container.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1500);
        }
    }

    calculateCollisionY(startX, startY, dx, dy) {
        const groundY = this.gameContainer.clientHeight - this.groundHeight - 20;
        let finalY = startY + dy + 400;
        
        // Check pipe collisions
        this.pipes.forEach(pipe => {
            if (startX + dx > pipe.x && startX + dx < pipe.x + 60) {
                const topPipeBottom = parseInt(pipe.top.style.height);
                const bottomPipeTop = this.gameContainer.clientHeight - this.groundHeight - parseInt(pipe.bottom.style.height);
                
                if (finalY < topPipeBottom) {
                    finalY = topPipeBottom;
                } else if (finalY > bottomPipeTop) {
                    finalY = bottomPipeTop;
                }
            }
        });
        
        // Ground collision
        return Math.min(finalY, groundY);
    }

    gameOver() {
        if (this.isDeathAnimating) return;
        this.isDeathAnimating = true;
        this.isGameRunning = false;
        clearInterval(this.gameLoop);

        const birdRect = this.bird.getBoundingClientRect();
        const containerRect = this.gameContainer.getBoundingClientRect();
        const birdX = birdRect.left - containerRect.left;
        const birdY = birdRect.top - containerRect.top;

        this.createParticles(birdX, birdY);
        this.bird.style.animation = 'explode 0.3s ease-out forwards';
        
        this.gameContainer.classList.add('shake');

        const isNewHighScore = this.checkHighScore();

        setTimeout(() => {
            this.finalScoreElement.textContent = this.score;
            this.bird.style.display = 'none';
            this.pipes.forEach(pipe => {
                pipe.top.style.display = 'none';
                pipe.bottom.style.display = 'none';
            });
            this.gameOverMenu.classList.remove('hidden');
            this.gameOverMenu.classList.add('fade-in');
            
            if (isNewHighScore) {
                this.newHighScoreElement.classList.remove('hidden');
            } else {
                this.newHighScoreElement.classList.add('hidden');
            }
            
            this.isDeathAnimating = false;
        }, 1000);
    }

    initializeMonitorToggle() {
        const toggleCheckbox = document.getElementById('monitor-toggle');
        const monitorFrame = document.querySelector('.monitor-frame');
        
        toggleCheckbox.addEventListener('change', function() {
            if (this.checked) {
                monitorFrame.classList.remove('disabled');
            } else {
                monitorFrame.classList.add('disabled');
            }
        });
    }

    updateHighScoreDisplay() {
        this.highScoreElement.textContent = `Best: ${this.highScore}`;
        this.menuHighScoreElement.textContent = this.highScore;
        this.gameOverHighScoreElement.textContent = this.highScore;
    }

    checkHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyBirdHighScore', this.highScore);
            this.updateHighScoreDisplay();
            
            this.namePopup.classList.remove('hidden');
            this.playerNameInput.focus();
            
            return true;
        }
        return false;
    }

    updateLeaderboardDisplay() {
        this.leaderboardList.innerHTML = '';
        const sortedLeaderboard = [...this.leaderboard]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Show top 10 scores instead of 5

        sortedLeaderboard.forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.className = 'leaderboard-entry';
            entryElement.innerHTML = `
                <span>${index + 1}. ${entry.name}</span>
                <span>${entry.score}</span>
            `;
            this.leaderboardList.appendChild(entryElement);
        });
    }

    submitScore() {
        const playerName = this.playerNameInput.value.trim();
        if (playerName) {
            // Remove previous entry with the same name if exists
            const existingIndex = this.leaderboard.findIndex(entry => entry.name.toLowerCase() === playerName.toLowerCase());
            if (existingIndex !== -1) {
                this.leaderboard.splice(existingIndex, 1);
            }
            
            // Add new score
            this.leaderboard.push({
                name: playerName,
                score: this.score
            });
            
            // Sort and keep only top 10 scores
            this.leaderboard.sort((a, b) => b.score - a.score);
            this.leaderboard = this.leaderboard.slice(0, 10);
            
            // Save to localStorage
            localStorage.setItem('flappyBirdLeaderboard', JSON.stringify(this.leaderboard));
            
            // Update leaderboard display to show all 10 scores
            this.updateLeaderboardDisplay();
            
            // Hide popup and reset input
            this.namePopup.classList.add('hidden');
            this.playerNameInput.value = '';
        }
    }

    initializeSecretCode() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName !== 'INPUT') {
                this.secretCode += e.key.toLowerCase();
                
                if (this.secretCode.length > 5) {
                    this.secretCode = this.secretCode.slice(-5);
                }
                
                if (this.secretCode === this.targetCode) {
                    this.resetPopup.classList.remove('hidden');
                    this.secretCode = '';
                }
            }
        });

        this.confirmResetButton.addEventListener('click', () => {
            localStorage.removeItem('flappyBirdHighScore');
            localStorage.removeItem('flappyBirdLeaderboard');
            
            this.highScore = 0;
            this.leaderboard = [];
            this.updateHighScoreDisplay();
            this.updateLeaderboardDisplay();
            
            this.resetPopup.classList.add('hidden');
        });

        this.cancelResetButton.addEventListener('click', () => {
            this.resetPopup.classList.add('hidden');
        });

        this.resetPopup.addEventListener('click', (e) => {
            if (e.target === this.resetPopup) {
                this.resetPopup.classList.add('hidden');
            }
        });
    }
}

// Initialize the game
window.onload = () => {
    new FlappyBird();
};

// Add this to your existing code to prevent right-click
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Add this to prevent keyboard shortcuts for copy/paste
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
    }
}); 