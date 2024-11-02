class Seed {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 5;
        this.speed = 0.5;
        this.landed = false;
    }

    update() {
        if (!this.landed) {
            this.y += this.speed;
            if (this.y >= canvas.height) {
                this.y = canvas.height;
                this.landed = true;
                plants.push(new Plant(this.x, canvas.height, 0));
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = '#00FF00';
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class HeartBubble {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 5 + Math.random() * 5;
        this.speedY = -0.5 - Math.random() * 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.alpha = 1;
        this.fadeRate = 0.02;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= this.fadeRate;
        return this.alpha <= 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = 'pink';
        ctx.beginPath();
        ctx.moveTo(0, -this.size / 4);
        ctx.bezierCurveTo(
            this.size / 2, -this.size / 2,
            this.size, 0,
            0, this.size
        );
        ctx.bezierCurveTo(
            -this.size, 0,
            -this.size / 2, -this.size / 2,
            0, -this.size / 4
        );
        ctx.fill();
        ctx.restore();
    }
}

class Fish {
    constructor(x, y, sizeMultiplier = 1, initialGrowthProgress = 0, name = '') {
        this.growthProgress = initialGrowthProgress;
        this.name = name;
        this.parents = [];
        this.babies = [];
        this.partnerFish = null;
        this.isDead = false;
        this.morphing = false;
        this.morphProgress = 0;

        // Assign gender randomly
        this.gender = Math.random() < 0.6 ? 'female' : 'male'; 

        this.lastKissTime = 0;
        this.canKiss = true;

        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.tailAngle = 0;
        this.tailSpeed = 0.1;
        this.tailDirection = 1;
        this.isEating = false;

        this.intimacyCount = 0;
        this.isInIntimacy = false;
        this.isKissing = false;
        this.kissStartTime = 0;
        this.cycleAngle = 0;
        this.cycleRadius = 30;
        this.cycleSpeed = 0.02;

        this.velocity = {
            x: (Math.random() * 2 - 1) * 0.1,
            y: (Math.random() * 2 - 1) * 0.1
        };

        // Initialize growth properties
        this.lastGrowthTime = Date.now();
        this.totalGrowthTime = 7 * 60; // 7 minutes in seconds
        this.growthRate = 7 / this.totalGrowthTime; 

        // Speed variation
        this.speedVariation = 0.9 + Math.random() * 0.2; // Random factor between 0.9 and 1.1

        // Tail wag speed
        this.tailWagSpeed = 0.0005; // Adjusted to slow down tail movement

        this.updateSize();
        this.updateSpeed();
        this.updateColor();

        this.isMirrored = false; // New property to track mirroring
        this.parentFish = null; // Reference to parent fish

        // Reproduction properties
        this.canReproduce = true;
        this.lastReproductionTime = 0;
    }

    updateSize() {
        const phaseSizes = [
            { min: 10, max: 15 },
            { min: 15, max: 20 },
            { min: 25, max: 30 },
            { min: 35, max: 40 },
            { min: 45, max: 50 },
            { min: 55, max: 60 },
            { min: 65, max: 70 },
            { min: 75, max: 80 }
        ];
        
        const totalPhases = phaseSizes.length - 1;
        const clampedProgress = Math.min(this.growthProgress, totalPhases);
        const phaseIndex = Math.floor(clampedProgress);
        const phaseFraction = clampedProgress - phaseIndex;

        const currentPhaseSize = phaseSizes[phaseIndex];
        const nextPhaseSize = phaseSizes[phaseIndex + 1] || phaseSizes[phaseIndex];

        // Interpolate size
        const minSize = currentPhaseSize.min + (nextPhaseSize.min - currentPhaseSize.min) * phaseFraction;
        const maxSize = currentPhaseSize.max + (nextPhaseSize.max - currentPhaseSize.max) * phaseFraction;
        this.size = (minSize + maxSize) / 2;
    }

    updateColor() {
        const lightness = 50 - (this.growthProgress * (30 / 7));
        if (this.gender === 'male') {
            this.color = `hsl(200, 100%, ${lightness}%)`; // Blue for males
        } else {
            this.color = `hsl(340, 100%, ${lightness}%)`; // Pink for females
        }
    }

    updateSpeed() {
        const baseSpeed = 4.0;
        this.normalMaxSpeed = baseSpeed * Math.pow(0.5, this.growthProgress) * this.speedVariation;
        this.chaseMaxSpeed = this.normalMaxSpeed * 1.5;
    }

    die() {
        this.isDead = true;
        this.morphing = true;
        this.morphProgress = 0;
    }

    checkBabies() {
        const currentTime = Date.now();
        if (this.gender === 'female') {
            // Female fish reproduction cooldown is 1 minute
            if (currentTime - this.lastReproductionTime >= 30000) {
                this.canReproduce = true;
            }
        } else if (this.gender === 'male') {
            // Male fish reproduction cooldown is 20 seconds
            if (currentTime - this.lastReproductionTime >= 10000) {
                this.canReproduce = true;
            }
        }
    }

    findPartner(allFishes) {
        let closestFish = null;
        let minDistance = Infinity;

        for (const fish of allFishes) {
            if (
                fish !== this &&
                fish.growthProgress >= 4 && fish.growthProgress < 6 &&
                !fish.isInIntimacy &&
                !this.isInIntimacy &&
                fish.gender !== this.gender &&
                fish.canReproduce && this.canReproduce
            ) {
                const dx = fish.x - this.x;
                const dy = fish.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDistance && distance < 200) {
                    closestFish = fish;
                    minDistance = distance;
                }
            }
        }

        if (closestFish) {
            this.partnerFish = closestFish;
            closestFish.partnerFish = this;
            this.isInIntimacy = true;
            closestFish.isInIntimacy = true;
        }
    }

    moveTowards(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            const accelerationFactor = 0.02;
            this.velocity.x += (dx / distance) * accelerationFactor;
            this.velocity.y += (dy / distance) * accelerationFactor;
        }
    }

    followParent() {
        const dx = this.parentFish.x - this.x;
        const dy = this.parentFish.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const desiredDistance = 50;
        const maxFollowSpeed = 0.05;

        if (distance > desiredDistance) {
            const acceleration = (distance - desiredDistance) * 0.0005;
            this.velocity.x += (dx / distance) * acceleration;
            this.velocity.y += (dy / distance) * acceleration;
        } else {
            // Introduce some wandering when close to parent
            this.velocity.x += (Math.random() - 0.5) * 0.005;
            this.velocity.y += (Math.random() - 0.5) * 0.005;
        }
    }

    update(food, allFishes) {
        if (this.isDead) {
            if (this.morphing) {
                this.morphProgress += 0.05;
                if (this.morphProgress >= 1) {
                    seeds.push(new Seed(this.x, this.y));
                    this.morphing = false;
                }
            }
            return false;
        }

        // Automatic growth over time
        const currentTime = Date.now();
        const timeElapsed = currentTime - this.lastGrowthTime;
        this.lastGrowthTime = currentTime;
        const timeElapsedSeconds = timeElapsed / 1000; // Convert milliseconds to seconds
        this.growthProgress += timeElapsedSeconds * this.growthRate;

        if (this.growthProgress >= 7) {
            this.die();
        } else {
            this.updateSize();
            this.updateSpeed();
            this.updateColor();
        }

        // Check reproduction cooldowns
        this.checkBabies();

        // Modify baby fish behavior
        if (
            this.parentFish &&
            this.growthProgress < 3 &&
            (!food || !food.active) &&
            !this.parentFish.isInIntimacy
        ) {
            this.followParent();
        } else {
            this.parentFish = null;
        }

        // Encourage fish to find partners more actively
        if (this.growthProgress >= 4 && this.growthProgress < 6 && this.canReproduce) {
            this.findPartner(allFishes);

            if (this.isInIntimacy && this.partnerFish) {
                const currentTime = Date.now();
                const requiredKisses = 3;

                if (!this.isKissing && this.canKiss) {
                    this.moveTowards(this.partnerFish.x, this.partnerFish.y);

                    if (Math.random() < 0.05) {
                        this.isKissing = true;
                        this.kissStartTime = currentTime;
                        this.canKiss = false;

                        if (this.x < this.partnerFish.x) {
                            this.isMirrored = false;
                            this.partnerFish.isMirrored = true;
                        } else {
                            this.isMirrored = true;
                            this.partnerFish.isMirrored = false;
                        }
                    } else {
                        // Swim together between kisses
                        this.swimTogether();
                    }
                } else if (this.isKissing) {
                    const kissElapsed = currentTime - this.kissStartTime;

                    if (kissElapsed >= 3000) {
                        this.isKissing = false;
                        this.intimacyCount++;
                        this.lastKissTime = currentTime;

                        // Reset mirroring after kiss
                        this.isMirrored = false;
                        if (this.partnerFish) {
                            this.partnerFish.isMirrored = false;
                        }

                        if (this.intimacyCount >= requiredKisses) {
                            // Create babies if the fish is female
                            if (this.gender === 'female' || this.partnerFish.gender === 'female') {
                                const femaleFish = this.gender === 'female' ? this : this.partnerFish;
                                const maleFish = this.gender === 'male' ? this : this.partnerFish;

                                femaleFish.canReproduce = false;
                                femaleFish.lastReproductionTime = currentTime;

                                maleFish.canReproduce = false;
                                maleFish.lastReproductionTime = currentTime;

                                const numBabies = Math.floor(Math.random() * 2) + 1;

                                for (let i = 0; i < numBabies; i++) {
                                    const baby = new Fish(femaleFish.x, femaleFish.y, 1, 0, this.generateBabyName());
                                    baby.parentFish = femaleFish;
                                    allFishes.push(baby);
                                    femaleFish.babies.push(baby);
                                }
                            }

                            // Reset intimacy
                            this.isInIntimacy = false;
                            this.intimacyCount = 0;
                            this.isMirrored = false;

                            if (this.partnerFish) {
                                this.partnerFish.isInIntimacy = false;
                                this.partnerFish.intimacyCount = 0;
                                this.partnerFish.isMirrored = false;
                            }
                        } else {
                            // Start swimming together for 3 seconds before next kiss
                            this.swimStartTime = currentTime;
                            this.isSwimmingTogether = true;
                        }
                    } else {
                        // Position fish so their mouths touch
                        const dx = this.partnerFish.x - this.x;
                        const dy = this.partnerFish.y - this.y;
                        const angleBetween = Math.atan2(dy, dx);

                        const totalWidth = this.size + this.partnerFish.size;
                        const offsetX = Math.cos(angleBetween) * (totalWidth / 2);
                        const offsetY = Math.sin(angleBetween) * (totalWidth / 2);

                        const midX = (this.x + this.partnerFish.x) / 2;
                        const midY = (this.y + this.partnerFish.y) / 2;

                        this.x = midX - offsetX / 2;
                        this.y = midY - offsetY / 2;

                        this.partnerFish.x = midX + offsetX / 2;
                        this.partnerFish.y = midY + offsetY / 2;

                        // Generate heart bubbles
                        if (Math.random() < 0.1) {
                            const mouthOffset = this.size / 2;
                            const mouthX = this.x + Math.cos(angleBetween) * mouthOffset;
                            const mouthY = this.y + Math.sin(angleBetween) * mouthOffset;
                            heartBubbles.push(new HeartBubble(mouthX, mouthY));
                        }
                    }
                } else if (this.isSwimmingTogether) {
                    const swimElapsed = currentTime - this.swimStartTime;
                    if (swimElapsed >= 3000) {
                        this.isSwimmingTogether = false;
                        this.canKiss = true;
                    } else {
                        this.swimTogether();
                    }
                } else if (!this.canKiss && currentTime - this.lastKissTime >= 3000) {
                    this.canKiss = true;
                }

                return false;
            }
        }

        // Regular movement and food chasing
        const isChasing = food && food.active && !this.isInIntimacy;
        const currentMaxSpeed = isChasing ? this.chaseMaxSpeed : this.normalMaxSpeed;

        if (isChasing) {
            this.targetX = food.x;
            this.targetY = food.y;
        } else if (!this.isEating && !this.isInIntimacy) {
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
                this.growthProgress += 0.2; // Accelerate growth by 20%
                
                if (this.growthProgress >= 7) {
                    this.die();
                } else {
                    this.updateSize();
                    this.updateSpeed();
                    this.updateColor();
                }

                setTimeout(() => {
                    this.isEating = false;
                }, 2000);
                return true;
            }
        }
        return false;
    }

    generateBabyName() {
        const parentNames = this.partnerFish ? [this.name, this.partnerFish.name] : [this.name];
        const babyName = parentNames.join('').slice(0, 3) + Math.floor(Math.random() * 100);
        return babyName;
    }

    swimTogether() {
        if (this.partnerFish) {
            const centerX = (this.x + this.partnerFish.x) / 2;
            const centerY = (this.y + this.partnerFish.y) / 2;

            this.cycleAngle += this.cycleSpeed;
            this.partnerFish.cycleAngle = this.cycleAngle + Math.PI;

            this.x = centerX + Math.cos(this.cycleAngle) * this.cycleRadius;
            this.y = centerY + Math.sin(this.cycleAngle) * this.cycleRadius;
            this.partnerFish.x = centerX + Math.cos(this.partnerFish.cycleAngle) * this.cycleRadius;
            this.partnerFish.y = centerY + Math.sin(this.partnerFish.cycleAngle) * this.cycleRadius;
        }
    }

    draw(ctx) {
        if (this.isDead) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(1 - this.morphProgress, 1 - this.morphProgress);
            ctx.beginPath();
            ctx.fillStyle = '#00FF00';
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        let angle;
        if (this.isKissing && this.partnerFish) {
            angle = Math.atan2(this.partnerFish.y - this.y, this.partnerFish.x - this.x);
            if (this.isMirrored) {
                angle += Math.PI;
            }
        } else {
            angle = Math.atan2(this.velocity.y, this.velocity.x);
        }
        ctx.rotate(angle);

        if (this.isMirrored) {
            ctx.scale(-1, 1); // Mirror horizontally
        }

        // Draw fish body
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail movement
        const tailWave = Math.sin(Date.now() * this.tailWagSpeed);

        // Draw tail with realistic shape
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.8, 0);
        ctx.quadraticCurveTo(
            -this.size * 1.2,
            this.size * 0.5 * tailWave,
            -this.size * 1.5,
            0
        );
        ctx.quadraticCurveTo(
            -this.size * 1.2,
            -this.size * 0.5 * tailWave,
            -this.size * 0.8,
            0
        );
        ctx.fillStyle = this.color;
        ctx.fill();

        // Draw eye
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.arc(this.size / 2, -this.size / 8, this.size / 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.arc(this.size / 2, -this.size / 8, this.size / 16, 0, Math.PI * 2);
        ctx.fill();

        // Remove gender symbols to eliminate the green circle

        // Draw kiss effect (pink heart)
        if (this.isKissing) {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 192, 203, 0.5)';
            const heartSize = this.size / 3;

            ctx.moveTo(this.size / 2, 0);
            ctx.bezierCurveTo(
                this.size / 2 + heartSize / 2, -heartSize / 2,
                this.size / 2 + heartSize, 0,
                this.size / 2, heartSize / 2
            );
            ctx.bezierCurveTo(
                this.size / 2 - heartSize, 0,
                this.size / 2 - heartSize / 2, -heartSize / 2,
                this.size / 2, 0
            );
            ctx.fill();
        }

        ctx.restore();
    }
}



class Food {
    constructor(x) {
        this.x = x;
        this.y = 0;
        this.size = 5;
        this.speed = 0.55;
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
    constructor(x, y, initialHeight = 0) {
        this.x = x;
        this.y = y;
        this.height = initialHeight;
        this.maxHeight = 100 + Math.random() * 50;
        this.segments = 10;
        this.segmentHeight = this.height / this.segments;
        this.movement = {
            primaryFreq: 0.001 + Math.random() * 0.0005,
            secondaryFreq: 0.0015 + Math.random() * 0.0005,
            phaseShift: Math.random() * Math.PI * 2,
            amplitude: 5 + Math.random() * 2
        };
        this.timeOffset = Math.random() * 10000;
        this.hovered = false;
        this.lastGrowthTime = Date.now();
    }

    update() {
        if (this.height < this.maxHeight) {
            const currentTime = Date.now();
            const timeDiff = currentTime - this.lastGrowthTime;
            const growthAmount = (timeDiff / 600000);
            if (growthAmount >= 1) {
                this.height += Math.floor(growthAmount);
                this.lastGrowthTime = currentTime;
                this.segmentHeight = this.height / this.segments;
            }
        }
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
        this.hovered = distance < 100;
        if (this.hovered) {
            this.movement.amplitude = 15;
        } else {
            this.movement.amplitude = 5 + Math.random() * 2;
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

const fishNames = ['Nemo', 'Dory', 'Marlin', 'Bubbles', 'Flounder', 'Guppy', 'Goldie'];
const fishes = fishNames.map((name, index) => {
    const initialGrowthProgress = Math.random() * (5 - 1) + 1; // Random float between 1 and 5
    const fish = new Fish(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        initialGrowthProgress,
        name
    );
    return fish;
});

// Ensure at least one male fish
if (!fishes.some(fish => fish.gender === 'male')) {
    const randomFish = fishes[Math.floor(Math.random() * fishes.length)];
    randomFish.gender = 'male';
}

const bubbles = Array(50).fill(null).map(() =>
    new Bubble(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    )
);

const plants = Array(30).fill(null).map(() =>
    new Plant(
        Math.random() * canvas.width,
        canvas.height,
        Math.random() * 100
    )
);

const seeds = [];
const heartBubbles = []; // For heart-shaped bubbles

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
        fishes.forEach(fish => {
            if (!fish.isDead) {
                fish.targetX = currentFood.x;
                fish.targetY = currentFood.y;
            }
        });
    }
});

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    plants.forEach(plant => {
        plant.update();
        plant.draw(ctx);
    });

    bubbles.forEach(bubble => {
        bubble.update();
        bubble.draw(ctx);
    });

    // Update and draw heart bubbles
    for (let i = heartBubbles.length - 1; i >= 0; i--) {
        if (heartBubbles[i].update()) {
            heartBubbles.splice(i, 1);
        } else {
            heartBubbles[i].draw(ctx);
        }
    }

    if (currentFood) {
        currentFood.update();
        currentFood.draw(ctx);
    }

    for (let i = seeds.length - 1; i >= 0; i--) {
        seeds[i].draw(ctx);
        if (seeds[i].update()) {
            seeds.splice(i, 1);
        }
    }

    for (let i = fishes.length - 1; i >= 0; i--) {
        const fish = fishes[i];
        if (fish.isDead && !fish.morphing) {
            fishes.splice(i, 1); // Remove dead fish
            continue;
        }
        if (currentFood && currentFood.active) {
            if (fish.update(currentFood, fishes)) {
                currentFood.active = false;
            }
        } else {
            fish.update(null, fishes);
        }
        fish.draw(ctx);
    }

    requestAnimationFrame(animate);
}

animate();