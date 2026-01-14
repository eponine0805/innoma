/**
 * Kanji Slasher MVP
 * No external libraries.
 */

// --- CONFIG & CONSTANTS ---
const CONFIG = {
    ScreenWidth: 1280,
    ScreenHeight: 720,
    FPS: 60,
    PlayerSpeed: 5,
    PlayerRadius: 20,
    BaseHP: 100,
    BaseAtk: 30,
    SlashCooldown: 30, // Frames (0.5s)
    SlashDuration: 10, // Frames visible
    SlashArc: Math.PI / 2, // 90 degrees
    SlashRange: 150,
    DamageInterval: 30, // Frames (0.5s) invulnerability

    // Enemy
    EnemySpawnRate: 60, // Frames (1s) - decreases per stage
    EnemySpeed: 2,
    EnemyRadius: 15,
    EnemyHP: 20,

    // Boss
    BossSpawnTime: [25, 35, 45], // Seconds per stage
    BossHP: [300, 800, 1500],
    BossRadius: 50,

    // Kanji Abilities
    Kanji: {
        '火': { type: 'projectile', name: 'Fire', color: '#e74c3c', cd: 40, damage: 105, speed: 10, size: 10 },
        '炎': { type: 'aoe', name: 'Flame', color: '#d35400', cd: 90, damage: 120, range: 200 },
        '水': { type: 'projectile', name: 'Water', color: '#3498db', cd: 15, damage: 45, speed: 12, size: 10 },
        '氷': { type: 'projectile', name: 'Ice', color: '#aec6cf', cd: 60, damage: 30, speed: 15, size: 10, slow: 0.5, slowTime: 120 },
        '土': { type: 'projectile', name: 'Earth', color: '#795548', cd: 600, damage: 100, speed: 8, size: 15, pierce: true },
        '金': { type: 'buff', name: 'Gold', color: '#f1c40f', cd: 600, duration: 300, mult: 4.0 },
        '鉄': { type: 'passive', name: 'Iron', color: '#95a5a6', mult: 2.0 },
        '毒': { type: 'aoe', name: 'Poison', color: '#9b59b6', cd: 90, damage: 0, range: 250, poison: true, duration: 300 }
    },

    Upgrade: {
        BaseCost: 100,
        Growth: 1.5
    }
};

// --- STATE MANAGEMENT ---
const STATE = {
    Screen: 'boot', // boot, title, kanji_select, stage_select, play, result
    Kanji: null, // Selected Char
    Money: 0,
    Levels: {
        Ability: 1,
        ATK: 1,
        HP: 1
    },
    // Runtime
    Stage: 0,
    MoneyAtStageStart: 0,
    Frame: 0,
    Time: 0, // Seconds
    Entities: [],
    Player: null,
    BossSpawned: false,
    BossDead: false,
    GameResult: null, // 'win' or 'lose'
    Input: {
        x: 0, y: 0, // Movement vector
        aimX: 0, aimY: 0, // Mouse pos
        lClick: false,
        rClick: false,
        lClickDown: false,
        rClickDown: false
    }
};

const UI = {
    layer: document.getElementById('ui-layer'),
    canvas: document.getElementById('gameCanvas'),
    ctx: document.getElementById('gameCanvas').getContext('2d'),
    shake: { x: 0, y: 0, time: 0, mag: 0 }
};

function screenShake(mag, duration) {
    UI.shake.mag = mag;
    UI.shake.time = duration;
}

// --- SOUND MANAGER ---
// --- SOUND MANAGER ---
const SoundManager = {
    tracks: {
        menu: new Audio('assets/gekka-no-shou.mp3'),
        stage1: new Audio('assets/hokora-uta.mp3'),
        stage2: new Audio('assets/yumehanabi.mp3'),
        stage3: new Audio('assets/kami-no-koe.mp3')
    },
    currentTrack: null,

    init: function () {
        for (let key in this.tracks) {
            this.tracks[key].loop = true;
            this.tracks[key].volume = 0.3;
        }
    },

    playBGM: function (type) {
        if (this.currentTrack === this.tracks[type] && !this.tracks[type].paused) return; // Already playing

        this.stopBGM();

        if (this.tracks[type]) {
            this.currentTrack = this.tracks[type];
            this.currentTrack.currentTime = 0;

            // Try to play
            const promise = this.currentTrack.play();
            if (promise !== undefined) {
                promise.catch(error => {
                    console.log("Autoplay prevented. Waiting for interaction.");
                    // Add one-time listener to start music on first input
                    const startAudio = () => {
                        if (this.currentTrack) this.currentTrack.play();
                        window.removeEventListener('click', startAudio);
                        window.removeEventListener('keydown', startAudio);
                        window.removeEventListener('touchstart', startAudio);
                    };
                    window.addEventListener('click', startAudio);
                    window.addEventListener('keydown', startAudio);
                    window.addEventListener('touchstart', startAudio);
                });
            }
        }
    },

    stopBGM: function () {
        if (this.currentTrack) {
            this.currentTrack.pause();
            // Don't null it, just pause
        }
    }
};

// --- ASSETS ---
const ASSETS = {
    player: new Image(),
    enemy: new Image(),
    boss: new Image(),
    bg1: new Image(),
    bg2: new Image(),
    bg3: new Image()
};

// Image Processing not needed for screen blending approach
ASSETS.player.src = 'assets/player.png';
ASSETS.enemy.src = 'assets/enemy.png';
ASSETS.boss.src = 'assets/boss.png';
ASSETS.bg1.src = 'assets/bg_stage1.png';
ASSETS.bg2.src = 'assets/bg_stage2.png';
ASSETS.bg3.src = 'assets/bg_stage3.png';

// --- INPUT HANDLING ---
const Keys = {};
window.addEventListener('keydown', e => { Keys[e.code] = true; if (e.code === 'Escape') togglePause(); });
window.addEventListener('keyup', e => Keys[e.code] = false);

UI.canvas.addEventListener('mousemove', e => {
    // Only update aim from mouse if not using touch recently?
    // Let's allow both.
    const rect = UI.canvas.getBoundingClientRect();
    const scaleX = UI.canvas.width / rect.width;
    const scaleY = UI.canvas.height / rect.height;
    STATE.Input.aimX = (e.clientX - rect.left) * scaleX;
    STATE.Input.aimY = (e.clientY - rect.top) * scaleY;
});

UI.canvas.addEventListener('mousedown', e => {
    if (e.button === 0) STATE.Input.lClick = true;
    if (e.button === 2) STATE.Input.rClick = true;
});
UI.canvas.addEventListener('mouseup', e => {
    if (e.button === 0) { STATE.Input.lClick = false; STATE.Input.lClickDown = false; }
    if (e.button === 2) { STATE.Input.rClick = false; STATE.Input.rClickDown = false; }
});
UI.canvas.addEventListener('contextmenu', e => e.preventDefault());

// --- MOBILE TOUCH CONTROLS ---
const Joy = {
    active: false,
    originX: 0, originY: 0,
    currentX: 0, currentY: 0,
    id: null
};

const jZone = document.getElementById('joystick-zone');
const jKnob = document.getElementById('joystick-knob');

if (jZone) { // Only bind if exists
    jZone.addEventListener('touchstart', e => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        Joy.id = touch.identifier;
        Joy.active = true;
        const rect = jZone.getBoundingClientRect();
        Joy.originX = rect.left + rect.width / 2;
        Joy.originY = rect.top + rect.height / 2;
        updateJoystick(touch.clientX, touch.clientY);
    }, { passive: false });

    jZone.addEventListener('touchmove', e => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === Joy.id) {
                updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                break;
            }
        }
    }, { passive: false });

    const endJoy = (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === Joy.id) {
                Joy.active = false;
                Joy.id = null;
                jKnob.style.transform = `translate(-50%, -50%)`;
                STATE.Input.x = 0; STATE.Input.y = 0; // Reset movement
                break;
            }
        }
    };
    jZone.addEventListener('touchend', endJoy);
    jZone.addEventListener('touchcancel', endJoy);
}

function updateJoystick(cx, cy) {
    const maxDist = 50;
    let dx = cx - Joy.originX;
    let dy = cy - Joy.originY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
    }

    jKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    // Normalize input -1 to 1
    STATE.Input.x = dx / maxDist;
    STATE.Input.y = dy / maxDist;
}

// Action Buttons
const btnAtk = document.getElementById('btn-attack');
const btnAbi = document.getElementById('btn-ability');

const bindBtn = (btn, inputKey) => {
    if (!btn) return;
    btn.addEventListener('touchstart', e => { e.preventDefault(); STATE.Input[inputKey] = true; });
    btn.addEventListener('touchend', e => { e.preventDefault(); STATE.Input[inputKey] = false; STATE.Input[inputKey + 'Down'] = false; });
};
bindBtn(btnAtk, 'lClick');
bindBtn(btnAbi, 'rClick');

// --- SAVE SYSTEM ---
function loadSave() {
    try {
        const data = localStorage.getItem('kanji_slasher_save');
        if (data) {
            const parsed = JSON.parse(data);
            STATE.Kanji = parsed.Kanji || null;
            STATE.Money = parsed.Money || 0;
            STATE.Levels = parsed.Levels || { Ability: 1, ATK: 1, HP: 1 };
        }
    } catch (e) {
        console.warn("Save load failed:", e);
        // alert("Save Error: " + e.message); // Optional: don't block start
    }
}
function saveGame() {
    const data = {
        Kanji: STATE.Kanji,
        Money: STATE.Money,
        Levels: STATE.Levels
    };
    localStorage.setItem('kanji_slasher_save', JSON.stringify(data));
}

// --- CLASSES ---
class Entity {
    constructor(x, y, r, color, type, text) {
        this.x = x; this.y = y; this.r = r; this.color = color;
        this.type = type || 'normal';
        this.text = text; // Optional text content
        this.dead = false;
        this.vx = 0; this.vy = 0;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        if (this.text) this.vy -= 0.5; // Text floats up
    }
    draw(ctx) {
        ctx.save();
        if (this.text) {
            // Text Particle
            ctx.fillStyle = this.color;
            ctx.font = "bold 20px Arial"; // Readable font
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 0;
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'black';
            ctx.strokeText(this.text, this.x, this.y);
            ctx.fillText(this.text, this.x, this.y);
        } else {
            // Normal Particle
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class Player extends Entity {
    constructor() {
        super(CONFIG.ScreenWidth / 2, CONFIG.ScreenHeight / 2, CONFIG.PlayerRadius, 'white');
        this.maxHP = CONFIG.BaseHP + (STATE.Levels.HP - 1) * 20;
        this.hp = this.maxHP;
        this.slashCD = 0;
        this.abilityCD = 0;
        this.invuln = 0;
        this.buffTime = 0; // Gold buff

        // Attack visual
        this.isSlashing = 0; // Frames remaining
        this.slashAngle = 0;
    }

    update() {
        // Move
        let dx = 0, dy = 0;
        if (Keys['KeyW']) dy -= 1;
        if (Keys['KeyS']) dy += 1;
        if (Keys['KeyA']) dx -= 1;
        if (Keys['KeyD']) dx += 1;

        // Combine with Joystick
        if (STATE.Input.x) dx += STATE.Input.x;
        if (STATE.Input.y) dy += STATE.Input.y;

        // Auto-Aim to movement on mobile (if joystick active)
        if (Joy.active && (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1)) {
            // Project aim out from player
            STATE.Input.aimX = this.x + dx * 100;
            STATE.Input.aimY = this.y + dy * 100;
        }

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            // Cap speed at max, but allow slower analog movement
            const spd = Math.min(len, 1) * CONFIG.PlayerSpeed;
            this.vx = (dx / len) * spd;
            this.vy = (dy / len) * spd;
        } else {
            this.vx = 0; this.vy = 0;
        }

        // Clamp
        this.x = Math.max(this.r, Math.min(CONFIG.ScreenWidth - this.r, this.x + this.vx));
        this.y = Math.max(this.r, Math.min(CONFIG.ScreenHeight - this.r, this.y + this.vy));

        // Cooldowns
        if (this.slashCD > 0) this.slashCD--;
        if (this.abilityCD > 0) this.abilityCD--;
        if (this.invuln > 0) this.invuln--;
        if (this.buffTime > 0) this.buffTime--;
        if (this.isSlashing > 0) this.isSlashing--;

        // Actions
        const aimAngle = Math.atan2(STATE.Input.aimY - this.y, STATE.Input.aimX - this.x);

        // Left Click: Slash
        if (STATE.Input.lClick && !STATE.Input.lClickDown && this.slashCD <= 0) {
            STATE.Input.lClickDown = true;
            this.performSlash(aimAngle);
        }

        // Right Click: Ability
        const k = CONFIG.Kanji[STATE.Kanji];
        if (STATE.Input.rClick && !STATE.Input.rClickDown && k.type !== 'passive') {
            STATE.Input.rClickDown = true;
            if (this.abilityCD <= 0) {
                this.performAbility(aimAngle, k);
            }
        }
    }

    performSlash(angle) {
        this.slashCD = CONFIG.SlashCooldown;
        this.isSlashing = CONFIG.SlashDuration;
        this.slashAngle = angle;

        // Stats
        let dmg = CONFIG.BaseAtk + (STATE.Levels.ATK - 1) * 2;
        let range = CONFIG.SlashRange;
        let arc = CONFIG.SlashArc;

        // Modifiers
        // Modifiers
        const k = CONFIG.Kanji[STATE.Kanji];
        if (k.name === 'Iron') {
            dmg *= k.mult;
            range *= 1.3;
            arc *= 1.2;
        }
        if (k.name === 'Gold' && this.buffTime > 0) {
            dmg *= k.mult;
            range *= 1.5;
            arc *= 1.4;
        }

        // Hit detection
        STATE.Entities.forEach(e => {
            if (e instanceof Enemy && !e.dead) {
                // Check distance
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < range + e.r) {
                    // Check angle
                    let angTo = Math.atan2(dy, dx);
                    // Normalize diff
                    let diff = angTo - angle;
                    while (diff > Math.PI) diff -= 2 * Math.PI;
                    while (diff < -Math.PI) diff += 2 * Math.PI;

                    // HIT CONDITION:
                    // 1. Within Arc
                    // 2. OR Very close (touching/overlapping) - covers the "can't hit when too close" issue
                    const isClose = dist < this.r + e.r + 10; // Point blank range

                    if (isClose || Math.abs(diff) < arc / 2) {
                        e.takeDamage(dmg);

                        // Hit Effects
                        if (k.name === 'Iron') {
                            // "Cool" Iron Effect: Sparks, no shake
                            for (let i = 0; i < 10; i++) {
                                const p = new Particle(e.x, e.y, Math.random() * 3 + 2, '#f1c40f', 'normal'); // Yellow sparks
                                p.vx *= 2; p.vy *= 2; // Fast sparks
                                p.life = 20;
                                STATE.Entities.push(p);
                            }
                            // Metallic Clang Visual (Grey burst)
                            spawnParticle(e.x, e.y, 15, '#95a5a6');
                        } else {
                            // Normal hit
                            spawnParticle(e.x, e.y, 5, 'white');
                            // screenShake(2, 5); // Removed by user request
                        }
                    }
                }
            }
        });
    }

    performAbility(angle, k) {
        this.abilityCD = k.cd;

        if (k.name === 'Gold') {
            this.buffTime = k.duration;
            return;
        }

        // Poison Logic
        if (k.name === 'Poison') {
            // New "Cooler" Visual: Toxic Cloud Expanding
            spawnShockwave(this.x, this.y, k.range, k.color);
            // Dense cloud of bubbles and smoke
            for (let i = 0; i < 40; i++) {
                const dist = Math.random() * k.range;
                const ang = Math.random() * Math.PI * 2;
                const px = this.x + Math.cos(ang) * dist;
                const py = this.y + Math.sin(ang) * dist;
                STATE.Entities.push(new Particle(px, py, Math.random() * 5 + 2, k.color, 'bubble'));
                if (i % 2 === 0) STATE.Entities.push(new Particle(px, py, Math.random() * 4 + 2, '#8e44ad', 'normal')); // Darker purple smoke
            }
            screenShake(3, 10); // Slight rumble for toxicity

            STATE.Entities.forEach(e => {
                if (e instanceof Enemy && !e.dead) {
                    const d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                    if (d < k.range + e.r) {
                        e.poisonTime = k.duration;
                        // No initial damage for Poison as requested
                    }
                }
            });
            return;
        }

        const dmg = k.damage + (STATE.Levels.Ability - 1) * 2;

        // Shake only for heavy abilities
        if (k.name !== 'Water' && k.name !== 'Fire' && k.name !== 'Ice') {
            screenShake(5, 10);
        }

        if (k.type === 'aoe') {
            // Enhanced AoE Visual: Multi-ring + flash
            createExplosion(this.x, this.y, k.range, k.color, 15, dmg, false);

            if (k.name === 'Flame') {
                // FIRE PILLAR EFFECT
                // Dense upward fire
                for (let i = 0; i < 50; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const r = Math.random() * k.range * 0.8;
                    const px = this.x + Math.cos(ang) * r;
                    const py = this.y + Math.sin(ang) * r * 0.5; // Flattened circle perspective

                    // Mix of colors
                    const c = Math.random() > 0.5 ? '#e74c3c' : (Math.random() > 0.5 ? '#f39c12' : '#f1c40f');
                    const p = new Particle(px, py, Math.random() * 4 + 3, c, 'fire');
                    p.vy -= Math.random() * 5 + 2; // Shoot up
                    p.vx *= 0.5; // Less horizontal spread
                    p.life = 60;
                    STATE.Entities.push(p);
                }
                // Second ring for impact
                setTimeout(() => spawnParticleRing(this.x, this.y, k.range, '#f39c12'), 200);
            } else {
                // Standard AoE (Poison is handled above)
                spawnParticleRing(this.x, this.y, k.range, k.color);
                setTimeout(() => spawnParticleRing(this.x, this.y, k.range * 0.7, 'white'), 100);
                spawnParticle(this.x, this.y, 30, k.color, 'normal');
            }

        } else if (k.type === 'projectile') {
            const p = new Projectile(this.x, this.y, angle, k.speed, k.size * 1.5, k.color, dmg);
            // ... match logic ...
            if (k.slow) p.slow = k.slow;
            if (k.slowTime) p.slowTime = k.slowTime;
            if (k.pierce) p.pierce = true;

            // Add trail visual logic to projectile update if wanted (omitted for MVP simplicity, Projectile uses draw which is simple)
            // But let's add Type to projectile for better collision FX
            if (k.name === 'Fire') p.fxType = 'fire';
            else if (k.name === 'Ice') p.fxType = 'ice';
            else if (k.name === 'Water') p.fxType = 'bubble';
            else if (k.name === 'Earth') p.fxType = 'rock';
            else p.fxType = 'normal';

            STATE.Entities.push(p);
        }
    }

    draw(ctx) {
        // Draw Slash
        if (this.isSlashing > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Swing Animation: Top-Right to Bottom-Left relative to aim
            // Aim is 0 rad. Top is -90 deg. Bottom is +90 deg.
            // Right-Up (approx -45) to Left-Down (approx +135)?
            // OR relative to facing: Start at -45 deg, End at +45 deg (Diagonal Cross)

            // Let's interpret "Right-Up to Left-Down" as a slash that starts from the Right side of the player and cuts Down-Left across the body?
            // Simple approach: Rotate from -60 deg to +60 deg relative to aim.

            // Dynamic Rotation
            // Start: aimAngle - 1.0 (Rightish)
            // End: aimAngle + 1.0 (Leftish)
            // Wait, standard slash is usually a swing.

            // Let's Swing from -Angle to +Angle
            const swingArc = CONFIG.SlashArc * 1.5;
            const progress = this.isSlashing / CONFIG.SlashDuration; // Progress 1.0 -> 0.0
            const currentRot = this.slashAngle - swingArc / 2 + (swingArc * (1 - progress));

            ctx.rotate(currentRot);

            // Sword-like Slash (Longer, narrower)
            const r = CONFIG.SlashRange * (this.buffTime > 0 ? 1.5 : 1);

            ctx.beginPath();
            ctx.moveTo(0, 0);

            // Varied shape based on type
            const isIron = CONFIG.Kanji[STATE.Kanji].name === 'Iron';

            if (isIron) {
                // Heavy Wide Blade
                ctx.arc(0, 0, r, -0.4, 0.4);
            } else {
                // Sharp Katana
                ctx.arc(0, 0, r, -0.2, 0.2);
            }
            ctx.closePath();

            // Trail Effect
            const grad = ctx.createRadialGradient(r * 0.5, 0, 0, r * 0.8, 0, r * 0.5);

            const isGoldActive = CONFIG.Kanji[STATE.Kanji].name === 'Gold' && this.buffTime > 0;

            if (isIron) {
                // Metallic Silver + Energy
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grad.addColorStop(0.3, 'rgba(149, 165, 166, 0.9)');
                grad.addColorStop(1, 'rgba(50, 50, 50, 0)');
                ctx.shadowColor = '#f1c40f'; // Spark glow
            } else if (isGoldActive) {
                // Golden Shine
                grad.addColorStop(0, 'rgba(255, 255, 200, 1)');
                grad.addColorStop(0.3, 'rgba(241, 196, 15, 0.9)'); // Gold
                grad.addColorStop(0.7, 'rgba(230, 126, 34, 0.5)'); // Orange edge
                grad.addColorStop(1, 'rgba(241, 196, 15, 0)');
                ctx.shadowColor = '#f1c40f';
            } else {
                // Sharper Blue/White
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grad.addColorStop(0.4, 'rgba(100, 200, 255, 0.8)');
                grad.addColorStop(1, 'rgba(0, 100, 255, 0)');
                ctx.shadowColor = 'cyan';
            }

            ctx.fillStyle = grad;
            ctx.shadowBlur = 15;
            ctx.fill();

            // Add inner streak for sharpness
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r, 0); ctx.stroke();

            ctx.restore();
        }



        // Player
        ctx.save();

        // Aura visual
        const k = CONFIG.Kanji[STATE.Kanji];
        if (k && k.type === 'aura') {
            // ... existing aura code ...
        }

        if (this.invuln > 0 && Math.floor(STATE.Frame / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Gold buff
        if (this.buffTime > 0) {
            ctx.shadowColor = 'gold';
            ctx.shadowBlur = 20;
        }

        // Draw Sprite
        // Rotate sprite loosely to aim? Or just flip X? 
        // Top down usually rotate.
        const aimAngle = Math.atan2(STATE.Input.aimY - this.y, STATE.Input.aimX - this.x);

        // Let's just draw upright, maybe flip if aiming left
        const isLeft = Math.abs(aimAngle) > Math.PI / 2;

        // ctx.translate(this.x, this.y); // Already at x,y? No.

        // Draw Image centered
        // We need to keep context clean
        ctx.translate(this.x, this.y);
        if (isLeft) ctx.scale(-1, 1);

        const size = this.r * 2.5; // Slightly larger than hitbox
        if (ASSETS.player.complete) {
            // Screen blend: Black becomes transparent
            ctx.globalCompositeOperation = 'screen';
            ctx.drawImage(ASSETS.player, -size / 2, -size / 2, size, size);
            ctx.globalCompositeOperation = 'source-over';
        } else {
            // Fallback
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();

        // Direction Indicator (optional now with sprite, but good for precision)
        // ... remove line stick? Or keep it?
        // Let's keep a subtle aim cursor instead of stick
    }
}

class Enemy extends Entity {
    constructor(x, y, isBoss) {
        super(x, y, isBoss ? CONFIG.BossRadius : CONFIG.EnemyRadius, isBoss ? '#c0392b' : '#7f8c8d');
        this.isBoss = isBoss;
        this.hp = isBoss ? CONFIG.BossHP[STATE.Stage] : CONFIG.EnemyHP;
        this.maxHp = this.hp;
        this.label = isBoss ? 'ONI' : 'Goblin';

        this.speed = CONFIG.EnemySpeed;

        // Debuffs
        this.slowTimer = 0;
        this.poisonTime = 0;
    }

    update(player) {
        if (this.slowTimer > 0) this.slowTimer--;

        // Poison Logic
        if (this.poisonTime > 0) {
            this.poisonTime--;
            if (this.poisonTime % 30 === 0) { // Every 0.5 seconds (30 frames)
                // % Damage (10% as requested)
                const dmg = Math.max(1, Math.floor(this.maxHp * 0.10) + (STATE.Levels.Ability || 0));
                this.takeDamage(dmg);

                // Extra purple visuals to prove it works
                const p = new Particle(this.x, this.y - 30, 0, '#9b59b6', 'text', Math.floor(dmg));
                p.vy = -1.5; p.life = 40;
                STATE.Entities.push(p);

                STATE.Entities.push(new Particle(this.x, this.y, 3, '#9b59b6')); // Purple particles
            }
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let spd = this.speed;
        if (this.slowTimer > 0) spd *= 0.5;

        if (dist > 0) {
            this.vx = (dx / dist) * spd;
            this.vy = (dy / dist) * spd;
        }

        super.update();

        // Collision with player
        if (dist < this.r + player.r) {
            if (player.invuln <= 0) {
                player.hp -= 10;
                player.invuln = CONFIG.DamageInterval;
                spawnParticle(player.x, player.y, 10, 'red');
            }
        }
    }

    takeDamage(amt) {
        this.hp -= amt;

        // Damage Number
        const p = new Particle(this.x, this.y - 20, 0, '#e74c3c', 'text', Math.floor(amt));
        p.vy = -1; // Float up
        p.life = 40;
        STATE.Entities.push(p);

        if (this.hp <= 0 && !this.dead) {
            this.dead = true;
            STATE.Money += this.isBoss ? 100 : 10;
            spawnParticle(this.x, this.y, 15, this.color);
            if (this.isBoss) {
                STATE.BossDead = true;
                setTimeout(() => {
                    winStage();
                }, 1000);
            }
        }
    }

    draw(ctx) {
        // Body
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.poisonTime > 0) {
            // Explicit glow behind
            ctx.fillStyle = 'rgba(155, 89, 182, 0.5)'; // Transparent purple
            ctx.shadowColor = '#9b59b6';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, this.r * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset for image
        }

        const img = this.isBoss ? ASSETS.boss : ASSETS.enemy;
        const size = this.r * 2.5;

        // Flip if moving left
        if (this.vx < 0) ctx.scale(-1, 1);

        if (img.complete) {
            ctx.globalCompositeOperation = 'screen';
            ctx.drawImage(img, -size / 2, -size / 2, size, size);
            ctx.globalCompositeOperation = 'source-over';
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();

        // Label (removed for visuals, messy)
        // ...

        // Label removed by user request
        // ctx.fillStyle = 'white';
        // ctx.fillText(this.label, this.x, this.y);

        // HP Bar for Boss
        if (this.isBoss) {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 40, this.y - 60, 80, 10);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x - 40, this.y - 60, 80 * (this.hp / this.maxHp), 10);

            // Ring
            ctx.strokeStyle = 'purple';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class Projectile extends Entity {
    constructor(x, y, angle, speed, size, color, dmg) {
        super(x, y, size, color);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.dmg = dmg;
        this.life = 100; // max range
    }
    update() {
        super.update();
        this.life--;
        if (this.life <= 0) this.dead = true;

        // Check hit
        for (let e of STATE.Entities) {
            if (e instanceof Enemy && !e.dead) {
                const dist = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                if (dist < this.r + e.r) {
                    e.takeDamage(this.dmg);
                    if (this.slow) e.slowTimer = this.slowTime;
                    if (!this.pierce) this.dead = true;

                    // FX
                    if (this.fxType === 'fire') {
                        // Fire burst
                        for (let i = 0; i < 10; i++) {
                            const p = new Particle(this.x, this.y, Math.random() * 5 + 3, Math.random() > 0.5 ? '#e74c3c' : '#f39c12', 'fire');
                            p.vy -= Math.random() * 2 + 1; // Rise
                            p.vx = (Math.random() - 0.5) * 4;
                            STATE.Entities.push(p);
                        }
                    } else if (this.fxType === 'ice') {
                        // Ice shatter
                        for (let i = 0; i < 8; i++) {
                            const p = new Particle(this.x, this.y, Math.random() * 4 + 2, '#aeddff', 'normal');
                            const a = Math.random() * Math.PI * 2;
                            const s = Math.random() * 2;
                            p.vx = Math.cos(a) * s;
                            p.vy = Math.sin(a) * s;
                            p.life = 40;
                            STATE.Entities.push(p);
                        }
                    }
                } else if (this.fxType === 'rock') {
                    // Earth Debris (Heavy)
                    for (let i = 0; i < 6; i++) {
                        const p = new Particle(this.x, this.y, Math.random() * 5 + 4, '#795548', 'normal');
                        const a = Math.random() * Math.PI * 2;
                        p.vx = Math.cos(a) * 3;
                        p.vy = Math.sin(a) * 3 - 2; // Upward burst then gravity
                        p.life = 60;
                        // Add gravity to these particles if possible?
                        // Particle class doesn't have gravity by default, simulate by vy+=0.2 in update?
                        // Let's just make them slower
                        STATE.Entities.push(p);
                    }
                    spawnParticle(this.x, this.y, 20, '#5d4037'); // Darker dust
                    screenShake(5, 10); // Heavy impact for Earth
                } else {
                    spawnParticle(this.x, this.y, 10, this.color, this.fxType || 'normal');
                }

                // screenShake(2, 5); // Removed shake on projectile hit for smoother feel

                break;
            }
        }
    }
}

class Particle extends Entity {
    constructor(x, y, size, color, type = 'normal') {
        super(x, y, size, color);
        this.type = type; // normal, fire, bubble, rock, poison
        this.life = 40 + Math.random() * 20;
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3 + 1;
        this.vx = Math.cos(ang) * spd;
        this.vy = Math.sin(ang) * spd;

        if (type === 'fire') {
            this.vy -= 1; // Float up
        }
    }
    update() {
        super.update();
        if (this.type === 'fire') {
            this.r *= 0.95; // Shrink
            this.y -= 0.5;
        } else if (this.type === 'bubble') {
            this.vx *= 0.95;
            this.vy -= 0.5; // Rise
        } else if (this.type === 'rock') {
            this.r *= 0.98;
        }

        this.life--;
        if (this.life <= 0 || this.r < 0.5) this.dead = true;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / 60;
        ctx.fillStyle = this.color;

        if (this.type === 'bubble') {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.stroke();
        } else if (this.type === 'rock') {
            ctx.fillRect(this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
        } else {
            // Normal / Fire
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }
}

function spawnParticle(x, y, count, color, type = 'normal') {
    for (let i = 0; i < count; i++) {
        STATE.Entities.push(new Particle(x, y, Math.random() * 3 + 2, color, type));
    }
}

function spawnParticleRing(x, y, r, color) {
    // Shockwave effect
    const wave = new Entity(x, y, 0, color);
    wave.dr = 10;
    wave.r = 0;
    wave.maxR = r;
    wave.life = 20;
    wave.draw = function (ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5 * (this.life / 20);
        ctx.globalAlpha = this.life / 20;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.stroke();
        ctx.restore();
    };
    wave.update = function () {
        this.r += (this.maxR - this.r) * 0.2;
        this.life--;
        if (this.life <= 0) this.dead = true;
    };
    STATE.Entities.push(wave);
}

function spawnShockwave(x, y, r, color) {
    spawnParticleRing(x, y, r, color);
}

function createExplosion(x, y, r, color, frameDuration, dmg, isEnemyAttack) {
    // Immediate AoE check
    STATE.Entities.forEach(e => {
        if (e instanceof Enemy && !e.dead) {
            const d = Math.sqrt((e.x - x) ** 2 + (e.y - y) ** 2);
            if (d < r + e.r) {
                e.takeDamage(dmg);
            }
        }
    });
    // Visual only (simple)
    // Real implementation would be an Entity that persists for 1 frame or acts as a particle emitter
}

// --- GAME LOOP ---
function update() {
    if (STATE.Screen !== 'play') return;
    STATE.Frame++;
    if (STATE.Frame % 60 === 0) STATE.Time++;

    // Spawn Enemy
    if (STATE.Frame % CONFIG.EnemySpawnRate === 0 && !STATE.BossSpawned) {
        const angle = Math.random() * Math.PI * 2;
        // Spawn on ring outside screen
        const R = 800;
        const ex = CONFIG.ScreenWidth / 2 + Math.cos(angle) * R;
        const ey = CONFIG.ScreenHeight / 2 + Math.sin(angle) * R;
        STATE.Entities.push(new Enemy(ex, ey, false));
    }

    // Spawn Boss
    if (!STATE.BossSpawned && STATE.Time >= CONFIG.BossSpawnTime[STATE.Stage]) {
        STATE.BossSpawned = true;
        const angle = Math.random() * Math.PI * 2;
        const ex = CONFIG.ScreenWidth / 2 + Math.cos(angle) * 600;
        const ey = CONFIG.ScreenHeight / 2 + Math.sin(angle) * 600;
        STATE.Entities.push(new Enemy(ex, ey, true));

        // Show Warning
        const div = document.createElement('div');
        div.className = 'boss-warning';
        div.innerText = '強敵出現';
        UI.layer.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    // Update Entities
    STATE.Player.update();

    for (let i = STATE.Entities.length - 1; i >= 0; i--) {
        const e = STATE.Entities[i];
        if (e instanceof Enemy) e.update(STATE.Player);
        else e.update();

        if (e.dead) STATE.Entities.splice(i, 1);
    }

    // Check Game Over
    if (STATE.Player.hp <= 0) {
        endGame(false);
    }
}

function draw() {
    const ctx = UI.ctx;
    ctx.save();

    // Screen Shake
    if (UI.shake.time > 0) {
        UI.shake.time--;
        const mag = UI.shake.mag;
        const sx = (Math.random() - 0.5) * mag * 2;
        const sy = (Math.random() - 0.5) * mag * 2;
        ctx.translate(sx, sy);
    }

    ctx.clearRect(0, 0, CONFIG.ScreenWidth, CONFIG.ScreenHeight);

    if (STATE.Screen === 'play') {
        // BG
        drawBackground(ctx, STATE.Stage);

        // Entities
        // Draw dead particles first? No, simple z-sort not needed for MVP
        STATE.Entities.forEach(e => e.draw(ctx));
        STATE.Player.draw(ctx);

        ctx.restore(); // Restore shake transform before HUD

        // HUD
        drawHUD();
    } else {
        ctx.restore();
    }
}

function drawBackground(ctx, stage) {
    // Draw BG Image
    let bg = ASSETS.bg1;
    if (stage === 1) bg = ASSETS.bg2;
    if (stage === 2) bg = ASSETS.bg3;

    if (bg.complete && bg.naturalWidth > 0) {
        // Draw to cover
        ctx.drawImage(bg, 0, 0, CONFIG.ScreenWidth, CONFIG.ScreenHeight);
        // Darken slightly for readability
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, CONFIG.ScreenWidth, CONFIG.ScreenHeight);
    } else {
        // Fallback
        ctx.fillStyle = stage === 0 ? '#2c3e50' : (stage === 1 ? '#1e3312' : '#4a0e0e');
        ctx.fillRect(0, 0, CONFIG.ScreenWidth, CONFIG.ScreenHeight);
    }

    // Sakura (Cherry Blossoms) - Flying Green Aura replacement
    ctx.fillStyle = '#ffb7b2'; // Pink
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 20; i++) {
        // Simple procedural wind movement
        const t = STATE.Frame * 0.5 + i * 100;
        const x = (t * 2) % (CONFIG.ScreenWidth + 50) - 25;
        const y = (Math.sin(t * 0.01) * 100 + t * 0.5) % CONFIG.ScreenHeight;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 0.02);
        // Petal shape
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.globalAlpha = 1.0;
}

function drawHUD() {
    const ctx = UI.ctx;
    const p = STATE.Player;

    // HP Bar
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 20, 300, 30);
    ctx.fillStyle = p.hp > p.maxHP * 0.3 ? '#e74c3c' : 'red';
    ctx.fillRect(20, 20, 300 * (p.hp / p.maxHP), 30);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(20, 20, 300, 30);

    // Text Info is in HMTL Overlay 'hud-top'
    const top = document.getElementById('hud-text');
    if (top) {
        let txt = `Stage: ${STATE.Stage + 1}   Money: ${STATE.Money}`;
        const k = CONFIG.Kanji[STATE.Kanji];

        // CD Indicator
        if (k.type !== 'passive') {
            const cdPct = p.abilityCD > 0 ? (p.abilityCD / k.cd) : 0;
            const ready = cdPct === 0 ? "発動可能" : Math.ceil(p.abilityCD / 60);
            const color = cdPct === 0 ? "#2ecc71" : "#e74c3c";
            txt += `   <span style="color:${color}">技: ${ready}</span>`;
        } else {
            txt += `   <span style="color:#95a5a6">技: 常時発動</span>`;
        }

        if (k.name === 'Gold' && p.buffTime > 0) {
            txt += ` <span class="hud-gold-timer">強化時間: ${(p.buffTime / 60).toFixed(1)}</span>`;
        }
        top.innerHTML = txt;
    }
}

// --- FLOW CONTROL ---

function loop() {
    try {
        update();
        draw();
        if (!STATE.Paused) requestAnimationFrame(loop);
    } catch (e) {
        console.error(e);
        alert("Game Loop Error: " + e.message + "\n" + e.stack);
        STATE.Paused = true;
    }
}

function init() {
    SoundManager.playBGM('menu');
    loadSave();
    if (!STATE.Kanji) {
        showScreen('kanji_select');
    } else {
        showScreen('title');
    }
    requestAnimationFrame(loop);
}

function showScreen(name) {
    STATE.Screen = name;
    UI.layer.innerHTML = ''; // Clear UI

    if (name === 'kanji_select') {
        const wrap = document.createElement('div');
        wrap.className = 'ui-screen';
<<<<<<< HEAD
=======
        wrap.innerHTML = `<h1>印を選択せよ</h1><p></p><div class="kanji-grid" id="kgrid"></div>`;
>>>>>>> f4cf72b (Update game files)
        UI.layer.appendChild(wrap);

        const grid = document.getElementById('kgrid');
        for (let k in CONFIG.Kanji) {
            const btn = document.createElement('button');
            btn.className = 'kanji-btn';
            btn.innerText = k;
            btn.title = CONFIG.Kanji[k].name + ': ' + CONFIG.Kanji[k].type;
            btn.style.color = CONFIG.Kanji[k].color;
            btn.onclick = () => {
                STATE.Kanji = k;
                saveGame();
                showScreen('title');
            };
            grid.appendChild(btn);
        }
    }

    else if (name === 'title') {
        const wrap = document.createElement('div');
        wrap.className = 'ui-screen';
        wrap.innerHTML = `
            <h1>封の魔 (Kanji Slasher)</h1>
            <p>選択: ${STATE.Kanji}</p>
            <p>現在の舞台: ${STATE.Stage + 1}</p>
            <button onclick="startGame()">出陣</button>
            <br><br>
            <small>WASD: 移動, クリック: 斬撃<br>右クリック: 印の力</small>
        `;
        UI.layer.appendChild(wrap);
    }

    else if (name === 'play') {
        const hud = document.createElement('div');
        hud.id = 'hud-text';
        hud.className = 'hud-top';
        UI.layer.appendChild(hud);
    }

    else if (name === 'result') {
        const wrap = document.createElement('div');
        wrap.className = 'ui-screen';
        const win = STATE.GameResult === 'win';
        wrap.innerHTML = `<h1>${win ? '強敵撃破' : '勝負あり'}</h1>`;

        if (win) {
            // Shop
            wrap.innerHTML += `
                <div class="shop">
                    <h3>能力強化 (所持金: ${STATE.Money})</h3>
                    <div class="stat-row">
                        <span>技レベル ${STATE.Levels.Ability}</span>
                        <button onclick="buyUpgrade('Ability')">強化: ${getCost('Ability')}</button>
                    </div>
                    <div class="stat-row">
                        <span>攻撃レベル ${STATE.Levels.ATK}</span>
                        <button onclick="buyUpgrade('ATK')">強化: ${getCost('ATK')}</button>
                    </div>
                    <div class="stat-row">
                        <span>体力レベル ${STATE.Levels.HP}</span>
                        <button onclick="buyUpgrade('HP')">強化: ${getCost('HP')}</button>
                    </div>
                </div>
                <button onclick="nextStage()" style="margin-top:20px; font-size:24px;">次の舞台へ</button>
            `;
        } else {
            // Game Over Options
            wrap.innerHTML += `
                <div style="margin-top:20px;">
                    <button onclick="retryStage()" style="font-size:20px;">再挑戦 (Retry)</button>
                    <button onclick="resetRun()" style="font-size:20px; background:#8e44ad;">印を選び直す</button>
                </div>
            `;
        }
        UI.layer.appendChild(wrap);
    }
}

function startGame() {
    STATE.Player = new Player();
    STATE.Entities = [];
    STATE.Frame = 0;
    STATE.Time = 0;
    STATE.BossSpawned = false;
    STATE.BossDead = false;
    UI.layer.innerHTML = '';

    // Play Stage BGM
    SoundManager.playBGM(STATE.Stage === 0 ? 'stage1' : (STATE.Stage === 1 ? 'stage2' : 'stage3'));

    showScreen('play');
}

function endGame(win) {
    STATE.GameResult = win ? 'win' : 'lose';
    STATE.Screen = 'result'; // Stops update loop logic
    SoundManager.playBGM('menu'); // Back to menu BGM
    showScreen('result');
    if (win) {
        STATE.MoneyAtStageStart = STATE.Money; // Checkpoint money
        saveGame();
    }
}

function winStage() {
    endGame(true);
}

function nextStage() {
    if (STATE.Stage < 2) {
        STATE.Stage++;
        STATE.MoneyAtStageStart = STATE.Money; // Save checkpoint
        startGame();
    } else {
        // All clear - Show Options
        STATE.Screen = 'result';
        UI.layer.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'ui-screen';
        wrap.innerHTML = `
            <h1 style="color:#f1c40f">天下無双 (ALL CLEARED!)</h1>
            <p>全ての強敵を打ち倒した！</p>
            <div style="margin-top:30px;">
                <button onclick="newGamePlus()" style="font-size:24px; display:block; margin:10px auto; width:300px;">強くてニューゲーム (能力引継)</button>
                <button onclick="resetRun()" style="font-size:18px; display:block; margin:10px auto; width:300px; background:#e74c3c;">最初から (完全リセット)</button>
            </div>
        `;
        UI.layer.appendChild(wrap);
    }
}

function getCost(type) {
    const lvl = STATE.Levels[type];
    return Math.floor(CONFIG.Upgrade.BaseCost * Math.pow(CONFIG.Upgrade.Growth, lvl - 1));
}

window.buyUpgrade = function (type) { // Global scope for HTML button
    const cost = getCost(type);
    if (STATE.Money >= cost) {
        STATE.Money -= cost;
        STATE.Levels[type]++;
        saveGame();
        showScreen('result'); // Refresh UI
    } else {
        alert("金が足りぬ！ (Not enough money!)");
    }
};

window.retryStage = function () {
    // Revert money to what we had at start of stage
    STATE.Money = STATE.MoneyAtStageStart;
    startGame();
};

window.newGamePlus = function () {
    // Keep Money and Levels
    STATE.Stage = 0;
    STATE.MoneyAtStageStart = STATE.Money;
    STATE.Kanji = null; // Let them pick a new Kanji? Or keep same? User said "return to Kanji select"

    saveGame();
    showScreen('kanji_select');
};

window.resetRun = function () {
    STATE.Kanji = null;
    // Wipe progress
    STATE.Money = 0;
    STATE.Levels = { Ability: 1, ATK: 1, HP: 1 };
    STATE.Stage = 0;
    STATE.MoneyAtStageStart = 0;

    saveGame();
    showScreen('kanji_select');
};

window.startGame = startGame;
window.nextStage = nextStage;

function togglePause() {
    // Basic pause
    alert("PAUSED");
    // Reset keys to prevent sticking
    for (let k in Keys) Keys[k] = false;
}

// Start
// Start
try {
    init();
} catch (e) {
    alert("Init Error: " + e.message + "\n" + e.stack);
}
