class Fish {
    constructor(x, y, sizeMultiplier = 1, colorHue = 180, behaviorType = 1) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = (20 + Math.random() * 20) * sizeMultiplier;
        this.color = `hsl(${colorHue}, 70%, 50%)`;
        this.tailAngle = 0;
        this.tailSpeed = 0.01;
        this.tailDirection = 1;
        this.isEating = false;
        this.normalMaxSpeed = 0.5 / sizeMultiplier; // Larger fish swim slower
        this.chaseMaxSpeed = 0.75 / sizeMultiplier; // Larger fish swim slower
        this.velocity = {
            x: (Math.random() * 2 - 1) * 0.1 * (1 / sizeMultiplier),
            y: (Math.random() * 2 - 1) * 0.1 * (1 / sizeMultiplier)
        };
        this.behaviorType = behaviorType;
    }

    update(food) {
        this.tailAngle += this.tailSpeed * this.tailDirection;
        if (Math.abs(this.tailAngle) > 0.3) {
            this.tailDirection *= -1;
        }

        const isChasing = food && food.active;
        const currentMaxSpeed = isChasing ? this.chaseMaxSpeed : this.normalMaxSpeed;

        if (isChasing) {
            this.targetX = food.x;
            this.targetY = food.y;
        } else if (!this.isEating) {
            if (Math.random() < 0.002) {
                this.targetX = Math.random() * canvas.width;
                this.targetY = Math.random() * canvas.height;
            }
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            const accelerationFactor = isChasing ? 0.015 : 0.01;
            this.velocity.x += (dx / distance) * accelerationFactor;
            this.velocity.y += (dy / distance) * accelerationFactor;
        }

        this.velocity.x *= 0.99;
        this.velocity.y *= 0.99;

        const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (currentSpeed > currentMaxSpeed) {
            this.velocity.x = (this.velocity.x / currentSpeed) * currentMaxSpeed;
            this.velocity.y = (this.velocity.y / currentSpeed) * currentMaxSpeed;
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        if (this.x < this.size) {
            this.x = this.size;
            this.velocity.x *= -0.5;
        }
        if (this.x > canvas.width - this.size) {
            this.x = canvas.width - this.size;
            this.velocity.x *= -0.5;
        }
        if (this.y < this.size) {
            this.y = this.size;
            this.velocity.y *= -0.5;
        }
        if (this.y > canvas.height - this.size) {
            this.y = canvas.height - this.size;
            this.velocity.y *= -0.5;
        }

        if (food && food.active) {
            const foodDistance = Math.sqrt(
                Math.pow(this.x - food.x, 2) + 
                Math.pow(this.y - food.y, 2)
            );
            if (foodDistance < this.size) {
                food.active = false;
                this.isEating = true;
                this.size *= 1.05; // Increase size by 5% when eating
                setTimeout(() => {
                    this.isEating = false;
                }, 2000);
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.ellipse(0, 0, this.size, this.size/2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.quadraticCurveTo(
            -this.size * 1.5,
            this.size * this.tailAngle,
            -this.size * 2,
            0
        );
        ctx.quadraticCurveTo(
            -this.size * 1.5,
            -this.size * this.tailAngle,
            -this.size,
            0
        );
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.arc(this.size/2, -this.size/4, this.size/6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.arc(this.size/2, -this.size/4, this.size/10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Food {
    constructor(x) {
        this.x = x;
        this.y = 0;
        this.size = 5;
        this.speed = 0.55; // Increased speed by 10%
        this.active = true;
    }

    update() {
        if (this.active) {
            this.y += this.speed;
            if (this.y > canvas.height) {
                this.active = false;
            }
        }
    }

    draw(ctx) {
        if (this.active) {
            ctx.beginPath();
            ctx.fillStyle = '#FF9900';
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Bubble {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 2 + Math.random() * 4;
        this.speed = 0.1 + Math.random() * 0.2;
        this.wobble = {
            frequency: 0.002 + Math.random() * 0.003,
            amplitude: 0.5 + Math.random(),
            offset: Math.random() * Math.PI * 2
        };
    }

    update() {
        this.y -= this.speed;
        this.x += Math.sin((this.y * this.wobble.frequency) + this.wobble.offset) * this.wobble.amplitude;
        
        if (this.y < -this.size) {
            this.y = canvas.height + this.size;
            this.x = Math.random() * canvas.width;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Plant {
    constructor(x, y, height) {
        this.x = x;
        this.y = y;
        this.height = height;
        this.segments = 10;
        this.segmentHeight = height / this.segments;
        this.movement = {
            primaryFreq: 0.001 + Math.random() * 0.0005,
            secondaryFreq: 0.0015 + Math.random() * 0.0005,
            phaseShift: Math.random() * Math.PI * 2,
            amplitude: 5 + Math.random() * 2
        };
        this.timeOffset = Math.random() * 10000;
        this.hovered = false;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        
        const time = Date.now() + this.timeOffset;
        
        for (let i = 0; i <= this.segments; i++) {
            const segmentY = this.y - i * this.segmentHeight;
            const progress = i / this.segments;
            
            const primaryWave = Math.sin(time * this.movement.primaryFreq + this.movement.phaseShift);
            const secondaryWave = Math.sin(time * this.movement.secondaryFreq + this.movement.phaseShift * 2);
            
            const waveOffset = (primaryWave * 0.7 + secondaryWave * 0.3) * 
                             this.movement.amplitude * 
                             Math.pow(progress, 1.5);
            
            ctx.lineTo(this.x + waveOffset, segmentY);
        }
        
        ctx.strokeStyle = this.hovered ? '#0D8B1C' : '#0D5B1C';
        ctx.lineWidth = 6;
        ctx.stroke();
    }

    checkHover(mouseX, mouseY) {
        const distance = Math.sqrt(Math.pow(this.x - mouseX, 2) + Math.pow(this.y - mouseY, 2));
        this.hovered = distance < 100; // Increase hover detection radius
        if (this.hovered) {
            this.movement.amplitude = 15; // Significantly increase amplitude when hovered
        } else {
            this.movement.amplitude = 5 + Math.random() * 2; // Reset amplitude
        }
    }
}

const canvas = document.getElementById('aquarium');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const fishes = [
    ...Array(3).fill(null).map(() => new Fish(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1, 180, 1)), // Type 1
    ...Array(3).fill(null).map(() => new Fish(Math.random() * canvas.width, Math.random() * canvas.height, 1.3, 0.7, 200, 2)), // Type 2
    ...Array(3).fill(null).map(() => new Fish(Math.random() * canvas.width, Math.random() * canvas.height, 0.7, 1.3, 220, 3))  // Type 3
];

const bubbles = Array(50).fill(null).map(() =>
    new Bubble(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    )
);

const plants = Array(30).fill(null).map(() => 
    new Plant(
        Math.random() * canvas.width, // Random x position for more chaos
        canvas.height,
        100 + Math.random() * 50
    )
);

let currentFood = null;
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    plants.forEach(plant => plant.checkHover(mouseX, mouseY));
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (!currentFood || !currentFood.active) {
        currentFood = new Food(x);
        // Make all fish go for the food
        fishes.forEach(fish => {
            fish.targetX = currentFood.x;
            fish.targetY = currentFood.y;
        });
    }
});

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    plants.forEach(plant => plant.draw(ctx));

    bubbles.forEach(bubble => {
        bubble.update();
        bubble.draw(ctx);
    });

    if (currentFood) {
        currentFood.update();
        currentFood.draw(ctx);
    }

    fishes.forEach(fish => {
        if (currentFood && currentFood.active) {
            if (fish.update(currentFood)) {
                currentFood.active = false;
            }
        } else {
            fish.update(null);
        }
        fish.draw(ctx);
    });

    requestAnimationFrame(animate);
}

animate();
