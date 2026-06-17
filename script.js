// Canvas setup
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game objects
const paddleWidth = 10;
const paddleHeight = 80;
const ballSize = 8;
const paddleSpeed = 6;

const playerPaddle = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: paddleSpeed
};

const computerPaddle = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: paddleSpeed * 0.8
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballSize,
    dx: 5,
    dy: 5,
    speed: 5
};

// Game state
let playerScore = 0;
let computerScore = 0;
let gameActive = false;
let mouseY = canvas.height / 2;

// Input tracking
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    w: false,
    W: false
};

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        e.preventDefault();
        gameActive = !gameActive;
    }
    if (e.key in keys) {
        keys[e.key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

// Draw functions
function drawRect(x, y, width, height, color = '#00d4ff') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawCircle(x, y, radius, color = '#00d4ff') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(26, 26, 46, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    drawCenterLine();

    // Draw paddles
    drawRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height);
    drawRect(computerPaddle.x, computerPaddle.y, computerPaddle.width, computerPaddle.height);

    // Draw ball
    drawCircle(ball.x, ball.y, ball.radius);

    // Draw game status
    if (!gameActive) {
        ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to Start', canvas.width / 2, 50);
    }
}

// Update functions
function updatePlayerPaddle() {
    // Keyboard control
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        playerPaddle.y -= playerPaddle.speed;
    }
    if (keys['ArrowDown']) {
        playerPaddle.y += playerPaddle.speed;
    }

    // Mouse control - smooth following
    const paddleCenter = playerPaddle.y + playerPaddle.height / 2;
    const diff = mouseY - paddleCenter;
    if (Math.abs(diff) > 5) {
        playerPaddle.y += diff * 0.1;
    }

    // Boundary check
    if (playerPaddle.y < 0) playerPaddle.y = 0;
    if (playerPaddle.y + playerPaddle.height > canvas.height) {
        playerPaddle.y = canvas.height - playerPaddle.height;
    }
}

function updateComputerPaddle() {
    // AI logic - track ball position with slight delay
    const computerCenter = computerPaddle.y + computerPaddle.height / 2;
    const diff = ball.y - computerCenter;

    if (Math.abs(diff) > 10) {
        if (diff > 0) {
            computerPaddle.y += computerPaddle.speed;
        } else {
            computerPaddle.y -= computerPaddle.speed;
        }
    }

    // Boundary check
    if (computerPaddle.y < 0) computerPaddle.y = 0;
    if (computerPaddle.y + computerPaddle.height > canvas.height) {
        computerPaddle.y = canvas.height - computerPaddle.height;
    }
}

function updateBall() {
    if (!gameActive) return;

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top and bottom wall collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = ball.y - ball.radius < 0 ? ball.radius : canvas.height - ball.radius;
    }

    // Player paddle collision
    if (
        ball.x - ball.radius < playerPaddle.x + playerPaddle.width &&
        ball.y > playerPaddle.y &&
        ball.y < playerPaddle.y + playerPaddle.height
    ) {
        ball.dx = Math.abs(ball.dx);
        ball.x = playerPaddle.x + playerPaddle.width + ball.radius;
        
        // Add spin based on paddle hit location
        const hitPos = (ball.y - playerPaddle.y) / playerPaddle.height - 0.5;
        ball.dy += hitPos * 4;
    }

    // Computer paddle collision
    if (
        ball.x + ball.radius > computerPaddle.x &&
        ball.y > computerPaddle.y &&
        ball.y < computerPaddle.y + computerPaddle.height
    ) {
        ball.dx = -Math.abs(ball.dx);
        ball.x = computerPaddle.x - ball.radius;

        // Add spin based on paddle hit location
        const hitPos = (ball.y - computerPaddle.y) / computerPaddle.height - 0.5;
        ball.dy += hitPos * 4;
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        computerScore++;
        document.getElementById('computerScore').textContent = computerScore;
        resetBall();
    }

    if (ball.x + ball.radius > canvas.width) {
        playerScore++;
        document.getElementById('playerScore').textContent = playerScore;
        resetBall();
    }

    // Cap ball speed
    const maxSpeed = 8;
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    if (speed > maxSpeed) {
        ball.dx = (ball.dx / speed) * maxSpeed;
        ball.dy = (ball.dy / speed) * maxSpeed;
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.dy = (Math.random() - 0.5) * 4;
    gameActive = false;
}

function update() {
    updatePlayerPaddle();
    updateComputerPaddle();
    updateBall();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();