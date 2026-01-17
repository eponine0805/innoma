/**
 * Kanji Slasher MVP
 * No external libraries.
 */
window.onerror = function (msg, url, line, col, error) {
    alert("Error: " + msg + "\nLine: " + line);
};

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

    // =======================================================
    // CONFIG.Kanji - 33印（星=7ランダム流星 / 斬=最寄り単体横一閃 / CD延長で再調整）
    // FPS=60 前提
    // =======================================================
    Kanji: {
        // --------------------------
        // 既存8印
        // --------------------------
        '火': {
            type: 'projectile', name: 'Fire', color: '#e74c3c',
            cd: 60, damage: 100, speed: 10, size: 10,
            burn: { rate: 0.20, duration: 180, boss_mult: 0.5 },
            scaling: { dmg: 0.08 },
            fx: { trail: 'fire_trail', hit: 'fire_burst', glow: true }
        },
        '炎': {
            type: 'aoe', name: 'Flame', color: '#d35400',
            cd: 180, damage: 80, range: 200, duration: 150, tick: 30,
            scaling: { dmg: 0.08, range: 0.03 },
            fx: { ring: 'flame_ring', particles: 'fire_pillar', ground: 'burn_mark' }
        },
        '水': {
            type: 'projectile', name: 'Water', color: '#3498db',
            cd: 24, damage: 45, speed: 12, size: 10,
            knockback: 5, scaling: { dmg: 0.06 },
            fx: { trail: 'water_droplet', hit: 'splash', ripple: true }
        },
        '氷': {
            type: 'projectile', name: 'Ice', color: '#aec6cf',
            cd: 90, damage: 30, speed: 15, size: 10,
            slow: 0.5, slowTime: 120, boss_mult: 0.7,
            scaling: { dmg: 0.06, dur: 0.05 },
            fx: { trail: 'ice_crystal', hit: 'frost_shatter', freeze_aura: true }
        },
        '土': {
            type: 'projectile', name: 'Earth', color: '#795548',
            cd: 240, damage: 180, speed: 8, size: 15,
            pierce: 1, scaling: { dmg: 0.08 },
            fx: { trail: 'rock_debris', hit: 'ground_crack', shake: 5 }
        },
        '金': {
            type: 'buff', name: 'Gold', color: '#f1c40f',
            cd: 1080, duration: 240, mult: 4.0, stack: false,
            scaling: { dur: 0.05 },
            fx: { aura: 'golden_particles', slash: 'gold_trail', flash: true }
        },
        '鉄': {
            type: 'passive', name: 'Iron', color: '#95a5a6',
            mult: 2.0, scaling: { mult: 0.05 },
            fx: { aura: 'metal_gleam', slash: 'silver_trail', sparks: true }
        },
        '毒': {
            type: 'aoe', name: 'Poison', color: '#9b59b6',
            cd: 210, damage: 0, range: 250,
            poison: { rate: 0.15, duration: 240, boss_mult: 0.5 }, tick: 30,
            scaling: { dur: 0.05, range: 0.03 },
            fx: { cloud: 'toxic_mist', bubbles: true, corruption: 'purple_veins' }
        },

        // --------------------------
        // 弾系（3）
        // --------------------------
        '風': {
            type: 'projectile', name: 'Wind', color: '#b0e0e6',
            cd: 36, damage: 35, speed: 18, size: 8,
            pierce: -1, maxHitsPerShot: 8, scaling: { dmg: 0.06 },
            fx: { trail: 'wind_blade', distortion: true, afterimage: 3 }
        },
        '雷': {
            type: 'projectile', name: 'Thunder', color: '#9370db',
            cd: 120, damage: 50, speed: 12, size: 10,
            chain: { count: 3, range: 120, boss_mult: 0.6 },
            scaling: { dmg: 0.07 },
            fx: { trail: 'lightning_spark', chain: 'arc_lightning', crackle: true }
        },
        '光': {
            type: 'projectile', name: 'Light', color: '#fffacd',
            cd: 210, damage: 120, speed: 20, size: 5,
            pierce: -1, laser: true, maxHitsPerShot: 10,
            scaling: { dmg: 0.08 },
            fx: { beam: 'light_ray', lens_flare: true, particles: 'light_motes' }
        },

        // --------------------------
        // 範囲系（6）
        // --------------------------
        '地': {
            type: 'aoe_cone', name: 'Ground', color: '#8b4513',
            cd: 150, damage: 90, range: 180, arc: 120,
            stun: 30, boss_mult: 0.5,
            scaling: { dmg: 0.08, range: 0.03 },
            fx: { crack: 'ground_fissure', debris: 'rock_shards', rumble: true }
        },
        '山': {
            type: 'aoe_delayed', name: 'Mountain', color: '#8d6e63',
            cd: 360, damage: 220, range: 150, delay: 60,
            scaling: { dmg: 0.08 },
            fx: { shadow: 'falling_shadow', impact: 'dust_explosion', shake: 8 }
        },
        '海': {
            type: 'aoe', name: 'Ocean', color: '#4682b4',
            cd: 210, damage: 40, range: 220, knockback: 15,
            scaling: { range: 0.03 },
            fx: { wave: 'water_ring', spray: 'ocean_mist', foam: true }
        },
        '森': {
            type: 'aoe', name: 'Forest', color: '#228b22',
            cd: 240, damage: 20, range: 180, root: 90, boss_mult: 0.6,
            scaling: { dur: 0.05, range: 0.03 },
            fx: { vines: 'creeping_roots', leaves: 'green_swirl', growth: true }
        },
        '林': {
            type: 'aoe_zone', name: 'Woods', color: '#006400',
            cd: 360, damage: 30, range: 160, duration: 360, tick: 30,
            scaling: { dur: 0.05, range: 0.03 },
            fx: { zone: 'tree_shadow', leaves: 'falling_petals', ambient: 'forest_glow' }
        },
        '星': {
            type: 'aoe_random_meteors', name: 'Star', color: '#f1c40f',
            cd: 1680, damage: 95, radius: 110, count: 30, // 4x Cooldown, 30 Meteors
            random: 'screen', delay: 45, interval: 6, // Faster interval for chaos
            max_hits_per_enemy: 2, boss_mult: 0.6,
            scaling: { dmg: 0.06, range: 0.02 },
            fx: { warning: 'star_marker', trail: 'star_fall', impact: 'cosmic_burst', twinkle: true, screen_flash: true, shake: 6 }
        },

        // --------------------------
        // 特殊（4）
        // --------------------------
        '破': {
            type: 'debuff', name: 'Break', color: '#8b0000',
            cd: 480, duration: 240, vulnerable: 1.25, boss_mult: 0.5, stack: false,
            scaling: { dur: 0.05 },
            fx: { mark: 'crack_emblem', shatter: 'fracture_lines', pulse: 'red' }
        },
        '斬': {
            type: 'special_lock_slash', name: 'Slash', color: '#c0c0c0',
            cd: 90, radius: 220, target: 'nearest',
            damage_mult: 2.2, hit_count: 1, boss_mult: 1.0, instant: true,
            scaling: { dmg: 0.06, cd: 0.00 },
            fx: { pre_dim: true, slash_line: 'white_ichisen', ink_edge: true, cut_afterimage: true, no_shake: true }
        },
        '武': {
            type: 'buff', name: 'Warrior', color: '#dc143c',
            cd: 600, duration: 300, extra_hits: 2, stack: false, // Active Buff: 3 hits total
            scaling: { dur: 0.05 },
            fx: { aura: 'crimson_god', trail: 'triple_phantom', impact: 'shockwave' }
        },
        '闘': {
            type: 'passive', name: 'Fight', color: '#e74c3c',
            berserk: { max_mult: 3.0, hp_threshold: 0.35 }, damage_taken_mult: 1.25, // Buffed Berserk
            scaling: {},
            fx: { aura: 'burning_spirit', intensity: 'hp_based', pulse: true }
        },

        // --------------------------
        // バフ（6）
        // --------------------------
        '強': {
            type: 'buff', name: 'Power', color: '#ff4500',
            cd: 600, duration: 300, atk_mult: 2.0, def_mult: 0.5, stack: false, // 2x Atk, 50% Dmg Taken
            scaling: { dur: 0.05 },
            fx: { activation: 'energy_eruption', aura: 'golden_aura', glow: 'intense' }
        },
        '速': {
            type: 'buff', name: 'Speed', color: '#00bfff',
            cd: 420, duration: 240, speed_mult: 1.0, atk_speed_mult: 3.0, stack: false, // Atk Speed x3
            scaling: { dur: 0.05 },
            fx: { aura: 'blue_streak', afterimage: 5, wind: 'speed_lines' }
        },
        '軽': {
            type: 'buff', name: 'Lightness', color: '#f0e68c',
            cd: 420, duration: 240, speed_mult: 3.0, hitbox_mult: 0.8, iframe_mult: 1.10, stack: false, // Move Speed x3
            scaling: { dur: 0.05 },
            fx: { aura: 'feather_particles', float: true, shimmer: 'white' }
        },
        '守': {
            type: 'buff', name: 'Guard', color: '#4169e1',
            cd: 420, duration: 240, def_mult: 0.25, stack: false, // Taken Dmg x1/4
            scaling: { dur: 0.05 },
            fx: { barrier: 'hex_shield', pulse: 'blue', solid: true }
        },
        '生': {
            type: 'buff', name: 'Life', color: '#32cd32',
            cd: 540, duration: 240, regen: 0.05, stack: false, // 5% per second
            scaling: { dur: 0.05 },
            fx: { particles: 'green_orbs', absorb: true, glow: 'soft_green' }
        },
        '全': {
            type: 'buff', name: 'All', color: '#ffffff',
            cd: 600, duration: 240, atk_mult: 1.3, speed_mult: 1.3, atk_speed_mult: 1.3, def_mult: 0.66, stack: false,
            scaling: { dur: 0.05 },
            fx: { aura: 'rainbow_veil', shimmer: true, flow: 'gentle' }
        },

        // --------------------------
        // デバフ（6）
        // --------------------------
        '弱': {
            type: 'debuff', name: 'Weak', color: '#696969',
            cd: 360, duration: 240, enemy_atk_mult: 0.5, boss_mult: 0.5, stack: false,
            scaling: { dur: 0.05 },
            fx: { aura: 'gray_shroud', wither: true, smoke: 'dark' }
        },
        '遅': {
            type: 'debuff', name: 'Slow', color: '#4682b4',
            cd: 300, duration: 600, slow: 0.5, boss_mult: 0.7, stack: false, // 10s, 50% Speed
            scaling: { dur: 0.05 },
            fx: { ripple: 'blue_wave', anchor: 'foot_bind', drag: true }
        },
        '重': {
            type: 'debuff', name: 'Heavy', color: '#2f4f4f',
            cd: 360, duration: 999999, slow: 0.7, boss_mult: 0.5, stack: false, // Permanent, 30% Slow (0.7 mult)
            scaling: { dur: 0.05 },
            fx: { gravity: 'black_ring', sink: true, distortion: 'downward' }
        },
        '病': {
            type: 'debuff', name: 'Disease', color: '#556b2f',
            cd: 420, duration: 999999, rate: 0.02, growth: 0.01, max_rate: 0.20, stack: true, // 2% start, +1%/sec, Max 20%
            scaling: { dur: 0.05 },
            fx: { spots: 'corruption_marks', spread: true, bubbles: 'decay' }
        },
        '危': {
            type: 'debuff', name: 'Danger', color: '#ff4500',
            cd: 300, duration: 600, vulnerable: 2.0, stack: false, // 10s, +100% Damage
            scaling: { dur: 0.05 },
            fx: { mark: 'crosshair', blink: true }
        },
        '止': {
            type: 'debuff', name: 'Stop', color: '#00ffff',
            cd: 1800, duration: 600, boss_stop: true, boss_slow: 0.1, stack: false, // 10s Stop, 30s CD, Stops Boss
            scaling: { dur: 0.05 },
            fx: { freeze: 'ice_crystals', tint: 'cyan' }
        }
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
    ScreenFlash: 0, // Frames to flash screen
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
    canvas: document.getElementById('game-canvas'),
    ctx: document.getElementById('game-canvas').getContext('2d'),
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

// --- TOUCH CONTROLS (Game Canvas) ---
UI.canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = UI.canvas.getBoundingClientRect();
    const scaleX = UI.canvas.width / rect.width;
    const scaleY = UI.canvas.height / rect.height;
    STATE.Input.aimX = (touch.clientX - rect.left) * scaleX;
    STATE.Input.aimY = (touch.clientY - rect.top) * scaleY;
    STATE.Input.lClick = true; // Tap = Attack
}, { passive: false });

UI.canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = UI.canvas.getBoundingClientRect();
    const scaleX = UI.canvas.width / rect.width;
    const scaleY = UI.canvas.height / rect.height;
    STATE.Input.aimX = (touch.clientX - rect.left) * scaleX;
    STATE.Input.aimY = (touch.clientY - rect.top) * scaleY;
}, { passive: false });

UI.canvas.addEventListener('touchend', e => {
    e.preventDefault();
    STATE.Input.lClick = false;
    STATE.Input.lClickDown = false;
}, { passive: false });

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

        // Buffs - Extended for 33 Kanji
        this.buffTime = 0; // Gold (金)
        this.powerTime = 0; // Power (強)
        this.speedTime = 0; // Speed (速)
        this.agilityTime = 0; // Agility (軽)
        this.guardTime = 0; // Guard (守)
        this.lifeTime = 0; // Life (生)
        this.allStatsTime = 0; // All (全)
        this.warriorTime = 0; // Warrior (武) - NEW Active Buff

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
            let maxSpd = CONFIG.PlayerSpeed;
            if (this.agilityTime > 0) maxSpd *= CONFIG.Kanji['軽'].speed_mult; // Lightness Buff (Move Speed x3)
            if (this.allStatsTime > 0) maxSpd *= CONFIG.Kanji['全'].speed_mult; // All Buff (Speed x1.3)

            const spd = Math.min(len, 1) * maxSpd;
            this.vx = (dx / len) * spd;
            this.vy = (dy / len) * spd;
        } else {
            this.vx = 0; this.vy = 0;
        }

        // Clamp
        this.x = Math.max(this.r, Math.min(CONFIG.ScreenWidth - this.r, this.x + this.vx));
        this.y = Math.max(this.r, Math.min(CONFIG.ScreenHeight - this.r, this.y + this.vy));

        // Cooldowns & Buffs
        if (this.slashCD > 0) this.slashCD--;
        if (this.abilityCD > 0) this.abilityCD--;
        if (this.invuln > 0) this.invuln--;
        if (this.buffTime > 0) this.buffTime--;
        if (this.powerTime > 0) this.powerTime--;
        if (this.speedTime > 0) this.speedTime--;
        if (this.agilityTime > 0) this.agilityTime--;
        if (this.guardTime > 0) this.guardTime--;
        if (this.lifeTime > 0) this.lifeTime--;
        if (this.allStatsTime > 0) this.allStatsTime--;
        if (this.warriorTime > 0) this.warriorTime--;
        if (this.isSlashing > 0) this.isSlashing--;

        // Life regen (生)
        if (this.lifeTime > 0 && STATE.Frame % 60 === 0) {
            const k = CONFIG.Kanji['生'];
            const heal = Math.floor(this.maxHP * k.regen);
            this.hp = Math.min(this.hp + heal, this.maxHP);

            // Healing particle
            const p = new Particle(this.x, this.y - 20, 0, '#32cd32', 'text', '+' + heal);
            p.vy = -1;
            p.life = 40;
            STATE.Entities.push(p);
        }

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
        let cd = CONFIG.SlashCooldown;
        if (this.speedTime > 0) cd /= CONFIG.Kanji['速'].atk_speed_mult; // Speed Buff (Atk Speed x3)
        if (this.allStatsTime > 0) cd /= CONFIG.Kanji['全'].atk_speed_mult; // All Buff (Atk Speed x1.3)
        this.slashCD = Math.floor(cd);
        this.isSlashing = CONFIG.SlashDuration;
        this.slashAngle = angle;

        // Stats
        let dmg = CONFIG.BaseAtk + (STATE.Levels.ATK - 1) * 2;
        let range = CONFIG.SlashRange;
        let arc = CONFIG.SlashArc;

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
        // Power Buff (Attack x2)
        if (this.powerTime > 0) {
            const kp = CONFIG.Kanji['強'];
            dmg *= kp.atk_mult;
        }
        // All Buff (Attack x1.3)
        if (this.allStatsTime > 0) {
            dmg *= CONFIG.Kanji['全'].atk_mult;
        }

        // Warrior Buff (3 Hits)
        let hitCount = 1;
        if (this.warriorTime > 0) {
            const kw = CONFIG.Kanji['武'];
            hitCount = 3; // kw.extra_hits + 1
        }

        // Hit detection
        // Hit detection
        STATE.Entities.forEach(e => {
            if (e instanceof Enemy && !e.dead) {
                // Check distance
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < range + e.r) {
                    // Start Fight Logic
                    if (k.name === 'Fight') {
                        const pct = this.hp / this.maxHP;
                        // Linear scaling: 1.0 at max HP -> 3.0 at 0 HP
                        // Formula: 1 + (max_mult - 1) * (1 - pct)
                        // User wanted "gradually increases", not sudden jump
                        // But originally it was threshold based. Let's make it threshold-start but progressive?
                        // User said: "Instead of increasing gradually, it jumps to 3x".
                        // Wait, "攻撃が徐々に上がるのではなくいきなり3倍になってしまってるので調整して"
                        // -> "It jumps to 3x INSTEAD OF rising gradually." -> They WANT smooth rising.
                        // So let's scale it smoothly from 1.0 to 3.0 inversely to HP.
                        const bonus = (k.berserk.max_mult - 1.0) * (1.0 - pct);
                        dmg *= (1.0 + bonus);
                    }
                    // End Fight Logic

                    // Check angle
                    let angTo = Math.atan2(dy, dx);
                    // ... (rest of logic)
                    let diff = angTo - angle;
                    while (diff > Math.PI) diff -= 2 * Math.PI;
                    while (diff < -Math.PI) diff += 2 * Math.PI;
                    const isClose = dist < this.r + e.r + 10;

                    if (isClose || Math.abs(diff) < arc / 2) {
                        // WARRIOR: Multiple Hits logic
                        for (let h = 0; h < hitCount; h++) {
                            const offsetX = (Math.random() - 0.5) * 30;
                            const offsetY = (Math.random() - 0.5) * 30;
                            e.takeDamage(dmg);

                            // Visuals per hit (standard impact)
                            spawnParticle(e.x + offsetX, e.y + offsetY, 5, 'white');

                            // Single COOL Slash Visual for Warrior
                            // Only spawn on the first extra hit? (Wait, extra_hits is now 1, so this loop runs once)
                            // Warrior X-Slash (Black & White Cross)
                            if (this.warriorTime > 0) {
                                // Slash 1: Black (Diagonal /)
                                const p1 = new Particle(e.x + offsetX, e.y + offsetY, 30, 'black', 'normal');
                                p1.life = 15;
                                p1.ang = angle - Math.PI / 4;
                                p1.draw = function (ctx) {
                                    ctx.save();
                                    ctx.translate(this.x, this.y);
                                    ctx.rotate(this.ang);
                                    ctx.strokeStyle = 'black';
                                    ctx.lineWidth = 5;
                                    const len = 50 * (this.life / 15);
                                    ctx.beginPath();
                                    ctx.moveTo(-len, 0); ctx.lineTo(len, 0);
                                    ctx.stroke();
                                    ctx.restore();
                                };
                                STATE.Entities.push(p1);

                                // Slash 2: White (Diagonal \)
                                const p2 = new Particle(e.x + offsetX, e.y + offsetY, 30, 'white', 'normal');
                                p2.life = 15;
                                p2.ang = angle + Math.PI / 4;
                                p2.draw = function (ctx) {
                                    ctx.save();
                                    ctx.translate(this.x, this.y);
                                    ctx.rotate(this.ang);
                                    ctx.strokeStyle = 'white';
                                    ctx.lineWidth = 3;
                                    const len = 50 * (this.life / 15);
                                    ctx.beginPath();
                                    ctx.moveTo(-len, 0); ctx.lineTo(len, 0);
                                    ctx.stroke();
                                    ctx.restore();
                                };
                                STATE.Entities.push(p2);
                            }
                        }
                    }
                }
            }
        });
    }

    performAbility(angle, k) {
        this.abilityCD = k.cd;

        // === BUFF TYPES ===
        if (k.type === 'buff') {
            if (k.name === 'Gold') {
                this.buffTime = k.duration;
                spawnParticle(this.x, this.y, 20, k.color);
                screenShake(3, 10);
            } else if (k.name === 'Power') {
                this.powerTime = k.duration;
                spawnParticle(this.x, this.y, 15, k.color);
            } else if (k.name === 'Speed') {
                this.speedTime = k.duration;
                spawnParticle(this.x, this.y, 15, k.color);
            } else if (k.name === 'Lightness') {
                this.agilityTime = k.duration;
                spawnParticle(this.x, this.y, 15, k.color);
            } else if (k.name === 'Guard') {
                this.guardTime = k.duration;
                spawnParticle(this.x, this.y, 15, k.color);
            } else if (k.name === 'Life') {
                this.lifeTime = k.duration;
                spawnParticle(this.x, this.y, 15, '#32cd32');
            } else if (k.name === 'All') {
                this.allStatsTime = k.duration;
                spawnParticle(this.x, this.y, 20, k.color);
            } else if (k.name === 'Warrior') {
                this.warriorTime = k.duration;
                spawnParticle(this.x, this.y, 25, k.color);
                screenShake(5, 10);
            }
            return;
        }

        // === DEBUFF TYPES ===
        // === DEBUFF TYPES ===
        if (k.type === 'debuff') {
            // No shockwave for Disease, Stop, or Danger (Danger has custom)
            if (k.name !== 'Disease' && k.name !== 'Stop' && k.name !== 'Danger') {
                spawnShockwave(this.x, this.y, k.range || 200, k.color);
            }
            if (k.name !== 'Stop') {
                spawnParticle(this.x, this.y, 20, k.color);
            }

            // Disease specific activation visual (Miasma Burst)
            if (k.name === 'Disease') {
                for (let i = 0; i < 40; i++) {
                    const dist = Math.random() * 120;
                    const ang = Math.random() * Math.PI * 2;
                    const px = this.x + Math.cos(ang) * dist;
                    const py = this.y + Math.sin(ang) * dist;

                    // Darker, heavier colors (Black & Dark Green only)
                    const color = ['#1a1a1a', '#0a0a0a', '#102010', '#051505'][Math.floor(Math.random() * 4)];
                    const p = new Particle(px, py, Math.random() * 5 + 3, color, 'normal');
                    p.life = 60;
                    p.vx *= 0.2; // Slow movement
                    p.vy *= 0.2;
                    STATE.Entities.push(p);
                }
            }

            // Danger Activation Visual (Spike Burst) - Outside loop to ensure it plays once per cast
            if (k.name === 'Danger') {
                // Red Alert Pulse - Intense Burst
                spawnShockwave(this.x, this.y, 400, '#ff4500'); // Larger

                // Explosion of "Warning" Spikes
                for (let i = 0; i < 20; i++) {
                    const ang = (i / 20) * Math.PI * 2;
                    // Spike Lines
                    const p = new Particle(this.x, this.y, 4, 'red', 'normal');
                    p.vx = Math.cos(ang) * 15;
                    p.vy = Math.sin(ang) * 15;
                    p.life = 25;
                    // Custom draw for spikes
                    p.ang = ang;
                    p.draw = function (ctx) {
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.ang);
                        ctx.fillStyle = '#ff4500';
                        ctx.beginPath();
                        const len = 40 * (this.life / 25);
                        ctx.moveTo(0, -2);
                        ctx.lineTo(len, 0);
                        ctx.lineTo(0, 2);
                        ctx.fill();
                        ctx.restore();
                    }
                    STATE.Entities.push(p);
                }
            }


            // Stop Activation Visual (Screen Flash) - 0.5s Duration
            if (k.name === 'Stop') {
                STATE.ScreenFlash = 30; // 0.5s at 60fps
            }

            STATE.Entities.forEach(e => {
                if (e instanceof Enemy && !e.dead) {
                    const d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                    const range = k.range || 200;
                    if (d < range + e.r) {
                        if (k.name === 'Break') {
                            e.vulnerableTime = k.duration;
                            e.vulnerableMult = k.vulnerable;
                        } else if (k.name === 'Danger') {


                            e.vulnerableTime = k.duration;
                            e.vulnerableMult = k.vulnerable;
                        } else if (k.name === 'Weak') {
                            e.weakTime = k.duration;
                            e.weakMult = k.enemy_atk_mult;
                        } else if (k.name === 'Slow') {
                            e.slowTimer = k.duration;
                            e.slowAmount = k.slow;
                        } else if (k.name === 'Heavy') {
                            e.heavyTime = k.duration;
                            e.heavyAmount = k.slow;
                        } else if (k.name === 'Disease') {
                            e.diseaseTime = k.duration;
                            if (k.stack) e.diseaseStacks++;
                        } else if (k.name === 'Stop') {
                            // Trigger Screen Flash when hitting an enemy? 
                            // Or just once? performAbility is called once. 
                            // But this is inside loop for each enemy. 
                            // We should set flash once outside. But fine setting it repeatedly (last one wins).
                            // Actually performAbility is called once. Wait, this code is inside `STATE.Entities.forEach`.
                            // So it sets flash if it hits an enemy?
                            // Logic: Stop hits ALL enemies if range is huge?
                            // Config Stop range: default 200? No, Stop is usually screen wide?
                            // Stop config doesn't specify range, defaults to 200 in line 861.
                            // The user said "Global Stop". Config needs high range or special logic.
                            // Let's force Stop to affect ALL enemies regardless of range, or increase range to 9999.
                            // Since I'm editing logic, I'll update logic to ignore range for Stop.
                        }
                    }
                }

                // Specific check for Stop (Global)
                if (k.name === 'Stop') {
                    // Flash already set outside loop
                    // Apply to all valid enemies regardless of range logic above if needed?
                    // Current logic above uses `d < range`. 
                    // If I want global, I should remove range check for Stop.
                    // But I'll stick to fixing syntax first. 
                    // Let's assume range is handled or I'll patch it here.
                    if (e instanceof Enemy && !e.dead) {
                        if (e.isBoss && !k.boss_stop) {
                            e.slowTimer = k.duration;
                            e.slowAmount = k.boss_slow;
                        } else {
                            e.stopTime = k.duration;
                        }
                    }
                }
            });
            return;
        }

        // === AOE TYPES ===
        if (k.type === 'aoe' || k.type === 'aoe_cone' || k.type === 'aoe_delayed' || k.type === 'aoe_zone' || k.type === 'aoe_random') {
            const dmg = k.damage + (STATE.Levels.Ability - 1) * 2;

            // Poison (special case - no damage)
            if (k.name === 'Poison') {
                spawnShockwave(this.x, this.y, k.range, k.color);
                for (let i = 0; i < 40; i++) {
                    const dist = Math.random() * k.range;
                    const ang = Math.random() * Math.PI * 2;
                    const px = this.x + Math.cos(ang) * dist;
                    const py = this.y + Math.sin(ang) * dist;
                    STATE.Entities.push(new Particle(px, py, Math.random() * 5 + 2, k.color, 'bubble'));
                }
                screenShake(3, 10);

                STATE.Entities.forEach(e => {
                    if (e instanceof Enemy && !e.dead) {
                        const d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < k.range + e.r) {
                            e.poisonTime = k.poison.duration;
                        }
                    }
                });
                return;
            }

            // Flame (special visuals)
            if (k.name === 'Flame') {
                createExplosion(this.x, this.y, k.range, k.color, 15, dmg, false);
                for (let i = 0; i < 50; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const r = Math.random() * k.range * 0.8;
                    const px = this.x + Math.cos(ang) * r;
                    const py = this.y + Math.sin(ang) * r * 0.5;
                    const c = Math.random() > 0.5 ? '#e74c3c' : (Math.random() > 0.5 ? '#f39c12' : '#f1c40f');
                    const p = new Particle(px, py, Math.random() * 4 + 3, c, 'fire');
                    p.vy -= Math.random() * 5 + 2;
                    p.vx *= 0.5;
                    p.life = 60;
                    STATE.Entities.push(p);
                }
                setTimeout(() => spawnParticleRing(this.x, this.y, k.range, '#f39c12'), 200);
            } else if (k.type === 'aoe_cone') {
                // Ground (cone AoE)
                spawnParticleRing(this.x, this.y, k.range, k.color);
                screenShake(5, 10);
            } else if (k.type === 'aoe_delayed') {
                // Mountain (delayed落下)
                const targetX = this.x + Math.cos(angle) * 200;
                const targetY = this.y + Math.sin(angle) * 200;
                setTimeout(() => {
                    createExplosion(targetX, targetY, k.range, k.color, 15, dmg, false);
                    spawnParticle(targetX, targetY, 30, k.color);
                    screenShake(8, 15);
                }, k.delay * 16.67);
                return;
            } else if (k.type === 'aoe_random') {
                // Star (random meteors)
                for (let i = 0; i < k.count; i++) {
                    setTimeout(() => {
                        const rx = Math.random() * CONFIG.ScreenWidth;
                        const ry = Math.random() * CONFIG.ScreenHeight;
                        createExplosion(rx, ry, k.radius, k.color, 10, dmg, false);
                        spawnParticle(rx, ry, 15, k.color);
                        screenShake(3, 5);
                    }, k.delay * 16.67 + i * k.interval * 16.67);
                }
                return;
            } else {
                // Standard AoE
                spawnParticleRing(this.x, this.y, k.range, k.color);
                setTimeout(() => spawnParticleRing(this.x, this.y, k.range * 0.7, 'white'), 100);
                spawnParticle(this.x, this.y, 30, k.color);
            }

            // Apply damage/effects
            STATE.Entities.forEach(e => {
                if (e instanceof Enemy && !e.dead) {
                    const dx = e.x - this.x;
                    const dy = e.y - this.y;
                    const d = Math.sqrt(dx * dx + dy * dy);

                    let inRange = false;
                    if (k.type === 'aoe_cone') {
                        // Check cone
                        const angTo = Math.atan2(dy, dx);
                        let diff = angTo - angle;
                        while (diff > Math.PI) diff -= 2 * Math.PI;
                        while (diff < -Math.PI) diff += 2 * Math.PI;
                        inRange = d < k.range + e.r && Math.abs(diff) < (k.arc * Math.PI / 180) / 2;
                    } else {
                        inRange = d < k.range + e.r;
                    }

                    if (inRange) {
                        e.takeDamage(dmg);

                        // Special effects
                        if (k.stun) e.stunTime = k.stun;
                        if (k.root) e.rootTime = k.root;
                        if (k.knockback) {
                            const kbAngle = Math.atan2(dy, dx);
                            e.vx += Math.cos(kbAngle) * k.knockback;
                            e.vy += Math.sin(kbAngle) * k.knockback;
                        }
                    }
                }
            });
            return;
        }

        // === SPECIAL ABILITIES ===
        if (k.type === 'ability') {
            if (k.name === 'Slash') {
                // Find nearest enemy
                let nearest = null;
                let minDist = Infinity;
                STATE.Entities.forEach(e => {
                    if (e instanceof Enemy && !e.dead) {
                        const d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < minDist && d < k.range) {
                            minDist = d;
                            nearest = e;
                        }
                    }
                });

                if (nearest) {
                    const targetAngle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
                    const dmg = k.damage + (STATE.Levels.Ability - 1) * 2;
                    const p = new Projectile(this.x, this.y, targetAngle, k.wave_speed, k.wave_size, k.color, dmg);
                    p.fxType = 'slash';
                    p.life = 30; // Short range
                    STATE.Entities.push(p);

                    // Visual effect
                    spawnParticle(this.x, this.y, 10, k.color);
                    screenShake(3, 8);
                } else {
                    // No target in range - still consume CD but show feedback
                    spawnParticle(this.x, this.y, 5, '#888');
                }
                return;
            }
        }

        // === PROJECTILE TYPES ===
        if (k.type === 'projectile') {
            const dmg = k.damage + (STATE.Levels.Ability - 1) * 2;
            const p = new Projectile(this.x, this.y, angle, k.speed, k.size * 1.5, k.color, dmg);

            // Properties
            if (k.slow) p.slow = k.slow;
            if (k.slowTime) p.slowTime = k.slowTime;
            if (k.pierce !== undefined) p.pierce = k.pierce === -1 ? 999 : k.pierce;
            if (k.maxHitsPerShot) p.maxHits = k.maxHitsPerShot;
            if (k.chain) p.chain = k.chain;
            if (k.laser) p.laser = true;
            if (k.burn) p.burn = k.burn;

            // FX type
            if (k.name === 'Fire') p.fxType = 'fire';
            else if (k.name === 'Ice') p.fxType = 'ice';
            else if (k.name === 'Water') p.fxType = 'bubble';
            else if (k.name === 'Earth') p.fxType = 'rock';
            else if (k.name === 'Wind') p.fxType = 'wind';
            else if (k.name === 'Thunder') p.fxType = 'lightning';
            else if (k.name === 'Light') p.fxType = 'light';
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


        // --- NEW AURAS ---
        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Fight (Berserk Aura) - Progressive, non-circular
        // 1. Fight (Berserk Aura) - Progressive, non-circular
        // FIX: Only show if 'Fight' is actually the selected Kanji
        if (STATE.Kanji === '闘') { // Check if Fight kanji is selected (passive)
            const hpRatio = this.hp / this.maxHP;
            const intensity = 1.0 - hpRatio; // 0.0 (Full HP) to 1.0 (Dead)

            // Always faint aura, gets stronger
            const baseAlpha = 0.2 + (intensity * 0.5); // 0.2 -> 0.7
            const blurSize = 10 + (intensity * 30); // 10 -> 40

            ctx.shadowBlur = blurSize;
            ctx.shadowColor = `rgba(231, 76, 60, ${baseAlpha})`;

            const grd = ctx.createRadialGradient(0, 0, this.r * 0.8, 0, 0, this.r * 2.0 + (intensity * 20));
            grd.addColorStop(0, `rgba(231, 76, 60, ${0.1 + intensity * 0.4})`);
            grd.addColorStop(1, 'rgba(231, 76, 60, 0)');

            // Helper for Fire-like Aura (Injected here for context access)
            const drawFireAura = (radius, colorBase, intensity) => {
                ctx.beginPath();
                const time = STATE.Frame * 0.2;
                const points = 20;
                for (let i = 0; i <= points; i++) {
                    const ang = (i / points) * Math.PI * 2;
                    // Fire-like jagged distortion
                    const noise = Math.sin(ang * 5 + time) * 0.5 + Math.cos(ang * 7 - time * 1.5) * 0.5;
                    const rOffset = noise * (radius * 0.15);
                    const r = radius + rOffset + (Math.random() * 3);
                    const px = Math.cos(ang) * r;
                    const py = Math.sin(ang) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.shadowBlur = 30 + intensity * 30;
                ctx.shadowColor = colorBase;
                ctx.fillStyle = colorBase.replace(')', ', 0.2)').replace('rgb', 'rgba');
                ctx.fill();
            };

            drawFireAura(this.r * 2.2, `rgb(231, 76, 60)`, intensity * 2);
        }

        // 2. Warrior (武) - Fire Aura
        if (this.warriorTime > 0) {
            const drawFireAura = (radius, colorBase, intensity) => {
                ctx.beginPath();
                const time = STATE.Frame * 0.2;
                const points = 20;
                for (let i = 0; i <= points; i++) {
                    const ang = (i / points) * Math.PI * 2;
                    const noise = Math.sin(ang * 5 + time) * 0.5 + Math.cos(ang * 7 - time * 1.5) * 0.5;
                    const rOffset = noise * (radius * 0.15);
                    const r = radius + rOffset + (Math.random() * 3);
                    const px = Math.cos(ang) * r;
                    const py = Math.sin(ang) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.shadowBlur = 30 + intensity * 30;
                ctx.shadowColor = colorBase;
                ctx.fillStyle = colorBase.replace(')', ', 0.2)').replace('rgb', 'rgba');
                ctx.fill();
            };
            drawFireAura(this.r * 1.5, `rgb(220, 20, 60)`, 0.5);
        }

        // 3. Power (強) - Fire Aura
        if (this.powerTime > 0) {
            const drawFireAura = (radius, colorBase, intensity) => {
                ctx.beginPath();
                const time = STATE.Frame * 0.2;
                const points = 20;
                for (let i = 0; i <= points; i++) {
                    const ang = (i / points) * Math.PI * 2;
                    const noise = Math.sin(ang * 5 + time) * 0.5 + Math.cos(ang * 7 - time * 1.5) * 0.5;
                    const rOffset = noise * (radius * 0.15);
                    const r = radius + rOffset + (Math.random() * 3);
                    const px = Math.cos(ang) * r;
                    const py = Math.sin(ang) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.shadowBlur = 30 + intensity * 30;
                ctx.shadowColor = colorBase;
                ctx.fillStyle = colorBase.replace(')', ', 0.2)').replace('rgb', 'rgba');
                ctx.fill();
            };
            drawFireAura(this.r * 1.8, `rgb(255, 69, 0)`, 0.8);
        }

        // 4. Speed (速) - Lightning Aura
        if (this.speedTime > 0) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'cyan';
            ctx.strokeStyle = '#00bfff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const ticks = 8;
            for (let i = 0; i < ticks; i++) {
                if (Math.random() > 0.3) continue; // Flicker
                const ang = (i / ticks) * Math.PI * 2 + STATE.Frame * 0.05;
                const rIn = this.r * 1.2;
                const rOut = this.r * 1.8;
                const cx = Math.cos(ang);
                const cy = Math.sin(ang);
                // Jagged bolt
                ctx.moveTo(cx * rIn, cy * rIn);
                ctx.lineTo(cx * (rIn + 10) + (Math.random() - 0.5) * 10, cy * (rIn + 10) + (Math.random() - 0.5) * 10);
                ctx.lineTo(cx * rOut, cy * rOut);
            }
            ctx.stroke();
        }

        // 5. Lightness (軽) - Wind Aura
        if (this.agilityTime > 0) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#f0e68c';
            // Outer Ring
            ctx.strokeStyle = `rgba(240, 230, 140, 0.8)`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            const start1 = (STATE.Frame * 0.1) % (Math.PI * 2);
            ctx.arc(0, 0, this.r * 1.6, start1, start1 + Math.PI);
            ctx.stroke();

            // Inner Ring (Counter-rotate)
            ctx.strokeStyle = `rgba(255, 255, 255, 0.8)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const start2 = (-STATE.Frame * 0.15) % (Math.PI * 2);
            ctx.arc(0, 0, this.r * 1.3, start2, start2 + Math.PI * 1.5);
            ctx.stroke();
        }

        // 6. Guard (守) - Hex Shield
        if (this.guardTime > 0) {
            ctx.save();
            ctx.rotate(STATE.Frame * 0.02);
            ctx.strokeStyle = '#4169e1';
            ctx.fillStyle = 'rgba(65, 105, 225, 0.15)';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'blue';

            ctx.beginPath();
            const sides = 6;
            const r = this.r * 2.0;
            for (let i = 0; i <= sides; i++) {
                const ang = (i / sides) * Math.PI * 2;
                const px = Math.cos(ang) * r;
                const py = Math.sin(ang) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inner Hex (Pulse)
            const pulse = 1.0 + Math.sin(STATE.Frame * 0.1) * 0.05;
            ctx.beginPath();
            const r2 = this.r * 1.8 * pulse;
            for (let i = 0; i <= sides; i++) {
                const ang = (i / sides) * Math.PI * 2;
                const px = Math.cos(ang) * r2;
                const py = Math.sin(ang) * r2;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = 'rgba(100, 149, 237, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        }


        // 7. Life (生) - Healing Aura
        if (this.lifeTime > 0) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#32cd32';
            ctx.strokeStyle = 'rgba(50, 205, 50, 0.5)';
            ctx.lineWidth = 2;

            // Rotating Leaves/Orbs
            const count = 4;
            for (let i = 0; i < count; i++) {
                const ang = (STATE.Frame * 0.02) + (i / count) * Math.PI * 2;
                const r = this.r * 1.6;
                const px = Math.cos(ang) * r;
                const py = Math.sin(ang) * r;

                ctx.fillStyle = '#98fb98';
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 8. All (全) - Avatar Aura
        if (this.allStatsTime > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const hue = (STATE.Frame * 5) % 360;
            ctx.shadowBlur = 20;
            ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

            // Rainbow shockwave rings
            ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            const r = this.r * (1.5 + Math.sin(STATE.Frame * 0.2) * 0.1);
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();

            // Inner radiance
            ctx.fillStyle = `hsl(${hue + 180}, 80%, 60%)`;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.arc(0, 0, this.r * 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Timer Bar removed per user request


        ctx.restore();


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

        // Debuffs - Extended for 33 Kanji
        this.slowTimer = 0;
        this.slowAmount = 1.0; // Multiplier
        this.poisonTime = 0;
        this.rootTime = 0; // 森 - Cannot move
        this.stunTime = 0; // 地 - Cannot move or attack
        this.stopTime = 0; // 止 - Complete freeze
        this.vulnerableTime = 0; // 破/危 - Take more damage
        this.vulnerableMult = 1.0;
        this.weakTime = 0; // 弱 - Deal less damage
        this.weakMult = 1.0;
        this.diseaseTime = 0; // 病 - Scaling DoT
        this.diseaseStacks = 0;
        this.burnTime = 0; // 火 - Burn DoT
        this.heavyTime = 0; // 重 - Permanent Slow
        this.heavyAmount = 1.0;
    }

    update(player) {
        // === Debuff Timers ===
        if (this.slowTimer > 0) this.slowTimer--;
        if (this.rootTime > 0) this.rootTime--;
        if (this.stunTime > 0) this.stunTime--;
        if (this.stopTime > 0) this.stopTime--;
        if (this.vulnerableTime > 0) this.vulnerableTime--;
        if (this.weakTime > 0) this.weakTime--;
        if (this.burnTime > 0) this.burnTime--;
        if (this.heavyTime > 0) this.heavyTime--; // Usually perm, but just in case

        // Reset multipliers when debuffs expire
        if (this.vulnerableTime <= 0) this.vulnerableMult = 1.0;
        if (this.weakTime <= 0) this.weakMult = 1.0;
        if (this.slowTimer <= 0) this.slowAmount = 1.0;
        if (this.heavyTime <= 0) this.heavyAmount = 1.0;

        // === DoT Effects ===
        // Poison (毒)
        if (this.poisonTime > 0) {
            this.poisonTime--;
            if (this.poisonTime % 60 === 0) { // Every 1 second
                const k = CONFIG.Kanji['毒'];
                let rate = k.poison.rate;
                if (this.isBoss) rate *= k.poison.boss_mult;
                const dmg = Math.max(1, Math.floor(this.maxHp * rate));
                this.takeDamage(dmg);

                const p = new Particle(this.x, this.y - 30, 0, '#9b59b6', 'text', Math.floor(dmg));
                p.vy = -1.5; p.life = 40;
                STATE.Entities.push(p);
                STATE.Entities.push(new Particle(this.x, this.y, 3, '#9b59b6'));
            }
        }

        // Burn (火)
        if (this.burnTime > 0) {
            this.burnTime--;
            if (this.burnTime % 60 === 0) {
                const k = CONFIG.Kanji['火'];
                let rate = k.burn.rate;
                if (this.isBoss) rate *= k.burn.boss_mult;
                const dmg = Math.max(1, Math.floor(this.maxHp * rate));
                this.takeDamage(dmg);

                STATE.Entities.push(new Particle(this.x, this.y, 3, '#e74c3c', 'fire'));
            }
        }

        // Disease (病) - Auto-scaling DoT
        if (this.diseaseTime > 0) {
            this.diseaseTime--;
            if (this.diseaseTime % 60 === 0) { // Every 1 second (60 frames)
                const k = CONFIG.Kanji['病'];

                // Calculate current rate: Base + (Growth * Stacks)
                // Stacks represent "ticks passed"
                let currentRate = k.rate + (k.growth * this.diseaseStacks);

                // Cap rate
                if (currentRate > k.max_rate) currentRate = k.max_rate;

                const dmg = Math.max(1, Math.floor(this.maxHp * currentRate));
                this.takeDamage(dmg);

                const p = new Particle(this.x, this.y - 30, 0, '#556b2f', 'text', Math.floor(dmg));
                p.vy = -1.5; p.life = 40;
                STATE.Entities.push(p);

                // Increment scaling stack for next tick
                this.diseaseStacks++;
            }
        } else {
            this.diseaseStacks = 0;
        }

        // === Movement Logic ===
        // Stop (止) - Complete freeze
        if (this.stopTime > 0) {
            this.vx = 0;
            this.vy = 0;
            return; // Skip all other updates
        }

        // Stun (地) - Cannot move
        if (this.stunTime > 0) {
            this.vx = 0;
            this.vy = 0;
            return;
        }

        // Root (森) - Cannot move
        if (this.rootTime > 0) {
            this.vx = 0;
            this.vy = 0;
            // Can still attack, so don't return
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Calculate speed with all modifiers
        let spd = this.speed;
        if (this.slowTimer > 0) spd *= this.slowAmount; // Slow debuff
        if (this.heavyTime > 0) spd *= this.heavyAmount; // Heavy debuff

        // Boss resistance to slow
        if (this.isBoss && this.slowAmount < 1.0) {
            spd = this.speed * (1.0 - (1.0 - this.slowAmount) * 0.5);
        }

        // Movement (if not rooted)
        if (this.rootTime <= 0 && dist > 0) {
            this.vx = (dx / dist) * spd;
            this.vy = (dy / dist) * spd;
        }

        super.update();

        // Collision with player
        if (dist < this.r + player.r) {
            if (player.invuln <= 0) {
                let damage = 10;
                damage *= this.weakMult; // Weak debuff reduces enemy damage

                // Player Modifiers
                const k = CONFIG.Kanji[STATE.Kanji];

                // Fight Passive Penalty
                if (k.name === 'Fight') {
                    damage *= k.damage_taken_mult;
                }

                // Power Buff Defense (50% reduction)
                if (player.powerTime > 0) {
                    damage *= CONFIG.Kanji['強'].def_mult;
                }

                // Guard Buff Defense
                if (player.guardTime > 0) {
                    damage *= CONFIG.Kanji['守'].def_mult;
                }

                // All Buff Defense
                if (player.allStatsTime > 0) {
                    damage *= CONFIG.Kanji['全'].def_mult;
                }

                player.hp -= damage;
                player.invuln = CONFIG.DamageInterval;
                spawnParticle(player.x, player.y, 10, 'red');
                screenShake(2, 5);
            }
        }
    }

    takeDamage(amt) {
        // Apply vulnerable debuff (破/危)
        amt *= this.vulnerableMult;

        this.hp -= amt;

        // Damage Number
        spawnFloatingText(this.x, this.y - 20, Math.floor(amt), '#ffffff', 24);

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

        // Disease (病) - Dark Toxic Sludge
        if (this.diseaseTime > 0) {
            // Pitch Black/Dark Green Pulse
            ctx.fillStyle = 'rgba(5, 15, 5, 0.85)';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 40;
            ctx.beginPath();
            ctx.arc(0, 0, this.r * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Sludge Droplets / Creeping particles
            const time = STATE.Frame * 0.05;
            for (let i = 0; i < 8; i++) {
                const ang = (time + i * 0.8);
                const r = this.r * (1.1 + Math.sin(ang * 4) * 0.1); // Closer to body
                const px = Math.cos(ang) * r;
                const py = Math.sin(ang) * r;

                // Dark Toxic Colors (Black & Dark Green only)
                const col = i % 2 === 0 ? '#102510' : '#050505'; // Dark Green & Pitch Black
                ctx.fillStyle = col;
                ctx.beginPath();
                // Dripping shape? Ellipse
                ctx.ellipse(px, py, 4, 6 + Math.sin(STATE.Frame * 0.2 + i) * 2, ang, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.shadowBlur = 0;
        }

        if (this.weakTime > 0) {
            // Gray Weaken Effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#555';
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
            ctx.lineWidth = 2;

            /* Downward Arrows Ring */
            ctx.beginPath();
            const r = this.r * 1.4;
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();

            // Small "Down" Indicators
            ctx.fillStyle = '#ccc';
            for (let i = 0; i < 3; i++) {
                const ang = (STATE.Frame * 0.05) + (i / 3) * Math.PI * 2;
                const px = Math.cos(ang) * r;
                const py = Math.sin(ang) * r;
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Disease (病) - Plague Miasma
        if (this.diseaseTime > 0) {
            ctx.fillStyle = 'rgba(85, 107, 47, 0.5)';
            for (let i = 0; i < 5; i++) {
                const ang = (STATE.Frame * 0.05 + i * 1.5);
                const r = this.r * (1.1 + Math.sin(ang * 3) * 0.2);
                const px = Math.cos(ang) * r;
                const py = Math.sin(ang) * r;
                ctx.beginPath(); ctx.arc(px, py, 4 + Math.sin(STATE.Frame * 0.1) * 2, 0, Math.PI * 2); ctx.fill();
            }
        }

        // Slow (遅) - Time Distortion
        if (this.slowTimer > 0) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#4682b4';
            ctx.strokeStyle = 'rgba(70, 130, 180, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const r = this.r * (0.8 + (STATE.Frame % 40) / 40 * 0.8);
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Heavt (重) - Gravity Crush
        if (this.heavyTime > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            // Dark circle below
            ctx.beginPath();
            ctx.ellipse(0, this.r * 0.8, this.r * 1.2, this.r * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Downward pressure lines
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            const offset = (STATE.Frame % 30) / 30 * this.r;
            ctx.beginPath();
            ctx.moveTo(-this.r, -this.r + offset); ctx.lineTo(-this.r, 0 + offset);
            ctx.moveTo(this.r, -this.r + offset); ctx.lineTo(this.r, 0 + offset);
            ctx.stroke();
        }

        // Danger (危) - Hazard Marks (Simplified)
        if (this.vulnerableTime > 0) {
            const blink = (STATE.Frame % 20 < 10);
            if (blink) {
                ctx.strokeStyle = '#ff4500'; // Red-Orange
                ctx.lineWidth = 4;

                // Simple intense pulse (No crosshair/text)
                const r = this.r * 1.3;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.stroke();

                // Inner glow
                ctx.fillStyle = 'rgba(255, 69, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Stop (止) - Black Chains / Mist
        if (this.stopTime > 0) {
            // Dark Mist
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, this.r * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Chains (Lines wrapping around)
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                const y = (STATE.Frame * 2 + i * 20) % (this.r * 2) - this.r;
                ctx.moveTo(-this.r * 1.2, y);
                ctx.bezierCurveTo(-this.r * 0.5, y + 15, this.r * 0.5, y + 15, this.r * 1.2, y);
            }
            ctx.stroke();

            ctx.shadowBlur = 0;
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
        this.hitCount = 0; // Track hits for maxHits
        this.hitEnemies = new Set(); // Track which enemies were hit (for pierce)
    }
    update() {
        super.update();
        this.life--;
        if (this.life <= 0) this.dead = true;

        // Check maxHits limit
        if (this.maxHits && this.hitCount >= this.maxHits) {
            this.dead = true;
            return;
        }

        // Check hit
        for (let e of STATE.Entities) {
            if (e instanceof Enemy && !e.dead) {
                // Skip if already hit (for pierce)
                if (this.pierce && this.hitEnemies.has(e)) continue;

                const dist = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                if (dist < this.r + e.r) {
                    // Apply damage
                    e.takeDamage(this.dmg);
                    this.hitCount++;
                    if (this.pierce) this.hitEnemies.add(e);

                    // Apply slow
                    if (this.slow && this.slowTime) {
                        e.slowTimer = this.slowTime;
                        e.slowAmount = this.slow;
                    }

                    // Apply burn
                    if (this.burn) {
                        e.burnTime = this.burn.duration;
                    }

                    // Chain lightning
                    if (this.chain && this.chain.count > 0) {
                        const chainTargets = [];
                        STATE.Entities.forEach(other => {
                            if (other instanceof Enemy && !other.dead && other !== e) {
                                const d = Math.sqrt((other.x - e.x) ** 2 + (other.y - e.y) ** 2);
                                if (d < this.chain.range) {
                                    chainTargets.push({ enemy: other, dist: d });
                                }
                            }
                        });

                        // Sort by distance and chain to closest
                        chainTargets.sort((a, b) => a.dist - b.dist);
                        const chainCount = Math.min(this.chain.count, chainTargets.length);
                        for (let i = 0; i < chainCount; i++) {
                            const target = chainTargets[i].enemy;
                            let chainDmg = this.dmg * 0.7; // Chain damage reduced
                            if (target.isBoss && this.chain.boss_mult) {
                                chainDmg *= this.chain.boss_mult;
                            }
                            target.takeDamage(chainDmg);

                            // Visual: lightning arc
                            spawnParticle(target.x, target.y, 5, '#9370db', 'normal');
                        }
                    }

                    // Kill projectile if not piercing
                    if (!this.pierce) {
                        this.dead = true;
                    }

                    // Visual FX
                    if (this.fxType === 'fire') {
                        for (let i = 0; i < 10; i++) {
                            const p = new Particle(this.x, this.y, Math.random() * 5 + 3, Math.random() > 0.5 ? '#e74c3c' : '#f39c12', 'fire');
                            p.vy -= Math.random() * 2 + 1;
                            p.vx = (Math.random() - 0.5) * 4;
                            STATE.Entities.push(p);
                        }
                    } else if (this.fxType === 'ice') {
                        for (let i = 0; i < 8; i++) {
                            const p = new Particle(this.x, this.y, Math.random() * 4 + 2, '#aeddff', 'normal');
                            const a = Math.random() * Math.PI * 2;
                            const s = Math.random() * 2;
                            p.vx = Math.cos(a) * s;
                            p.vy = Math.sin(a) * s;
                            p.life = 40;
                            STATE.Entities.push(p);
                        }
                    } else if (this.fxType === 'rock') {
                        for (let i = 0; i < 6; i++) {
                            const p = new Particle(this.x, this.y, Math.random() * 5 + 4, '#795548', 'normal');
                            const a = Math.random() * Math.PI * 2;
                            p.vx = Math.cos(a) * 3;
                            p.vy = Math.sin(a) * 3 - 2;
                            p.life = 60;
                            STATE.Entities.push(p);
                        }
                        spawnParticle(this.x, this.y, 20, '#5d4037');
                        screenShake(5, 10);
                    } else if (this.fxType === 'wind') {
                        spawnParticle(this.x, this.y, 5, '#b0e0e6', 'normal');
                    } else if (this.fxType === 'lightning') {
                        spawnParticle(this.x, this.y, 8, '#9370db', 'normal');
                    } else if (this.fxType === 'light') {
                        spawnParticle(this.x, this.y, 10, '#fffacd', 'normal');
                    } else if (this.fxType === 'slash') {
                        // White cutting slash effect
                        for (let i = 0; i < 12; i++) {
                            const p = new Particle(this.x, this.y, Math.random() * 4 + 2, '#ffffff', 'normal');
                            const a = Math.random() * Math.PI * 2;
                            p.vx = Math.cos(a) * 4;
                            p.vy = Math.sin(a) * 4;
                            p.life = 30;
                            STATE.Entities.push(p);
                        }
                        spawnParticle(this.x, this.y, 8, '#c0c0c0', 'normal');
                    } else {
                        spawnParticle(this.x, this.y, 10, this.color, this.fxType || 'normal');
                    }

                    // Only break if not piercing
                    if (!this.pierce) break;
                }
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
    if (STATE.Screen !== 'game') return;
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

    if (STATE.Screen === 'game') {
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

// --- FLOATING TEXT ---
class FloatingText {
    constructor(x, y, text, color, size = 20) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.life = 60; // 1 second
        this.vy = -1; // Float up
        this.alpha = 1.0;
        this.dead = false;
    }

    update() {
        this.y += this.vy;
        this.life--;
        if (this.life < 20) this.alpha = this.life / 20;
        if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.font = `bold ${this.size}px sans-serif`;
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

function spawnFloatingText(x, y, text, color, size) {
    STATE.Entities.push(new FloatingText(x, y, text, color, size));
}

// ... existing particle code ...

function drawHUD() {
    const ctx = UI.ctx;
    const p = STATE.Player;

    // HP Bar - Moved down slightly to make room for top info if needed, or kept at top.
    // Let's keep HP bar at top-left (20, 20) but move the HTML text to avoid it.

    // Draw Bar
    const barX = 20;
    const barY = 20;
    const barW = 300;
    const barH = 30;

    // Background
    ctx.fillStyle = '#222';
    ctx.fillRect(barX, barY, barW, barH);

    // Fill
    const fillPct = Math.max(0, p.hp / p.maxHP);
    ctx.fillStyle = fillPct > 0.3 ? '#e74c3c' : 'red';
    ctx.fillRect(barX, barY, barW * fillPct, barH);

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    // HP Text (Numerical) - Centered on bar
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(`${Math.ceil(p.hp)} / ${p.maxHP}`, barX + barW / 2, barY + barH / 2);
    ctx.textAlign = 'start'; // Reset
    ctx.textBaseline = 'alphabetic'; // Reset

    // Text Info (Layout Fix)
    // We will position the HTML overlay element specifically to avoid the bar.
    // HP Bar is at Y=20..50. Let's put text BELOW it.
    const top = document.getElementById('hud-text');
    if (top) {
        // Force position to be below HP bar
        top.style.top = '60px';
        top.style.left = '20px';

        let txt = `Stage: ${STATE.Stage + 1}   <span style="color:#f1c40f">Money: ${STATE.Money}</span>`;
        const k = CONFIG.Kanji[STATE.Kanji];

        // CD Indicator
        if (k.type !== 'passive') {
            const cdPct = p.abilityCD > 0 ? (p.abilityCD / k.cd) : 0;
            // Show CD in seconds roughly
            const readyStr = cdPct === 0 ? "READY" : (p.abilityCD / 60).toFixed(1) + "s";
            const color = cdPct === 0 ? "#2ecc71" : "#e74c3c";
            txt += `   <span style="color:${color}; margin-left: 15px;">技: ${readyStr}</span>`;
        } else {
            txt += `   <span style="color:#95a5a6; margin-left: 15px;">技: 常時(Passive)</span>`;
        }

        if (k.name === 'Gold' && p.buffTime > 0) {
            txt += ` <span class="hud-gold-timer" style="color:gold; margin-left:10px;">強化: ${(p.buffTime / 60).toFixed(1)}s</span>`;
        }

        // Warrior Timer
        if (p.warriorTime > 0) {
            txt += ` <span style="color:#dc143c; margin-left:10px;">武: ${(p.warriorTime / 60).toFixed(1)}s</span>`;
        }

        // Power Timer
        if (p.powerTime > 0) {
            txt += ` <span style="color:#ff4500; margin-left:10px;">強: ${(p.powerTime / 60).toFixed(1)}s</span>`;
        }

        // Speed Timer (速)
        if (p.speedTime > 0) {
            txt += ` <span style="color:#00bfff; margin-left:10px;">速: ${(p.speedTime / 60).toFixed(1)}s</span>`;
        }

        // Lightness Timer (軽)
        if (p.agilityTime > 0) {
            txt += ` <span style="color:#f0e68c; margin-left:10px;">軽: ${(p.agilityTime / 60).toFixed(1)}s</span>`;
        }

        // Guard Timer (守)
        if (p.guardTime > 0) {
            txt += ` <span style="color:#4169e1; margin-left:10px;">守: ${(p.guardTime / 60).toFixed(1)}s</span>`;
        }

        // Life Timer (生)
        if (p.lifeTime > 0) {
            txt += ` <span style="color:#32cd32; margin-left:10px;">生: ${(p.lifeTime / 60).toFixed(1)}s</span>`;
        }

        // All Timer (全)
        if (p.allStatsTime > 0) {
            txt += ` <span style="color:#ffffff; margin-left:10px; text-shadow: 0 0 5px cyan;">全: ${(p.allStatsTime / 60).toFixed(1)}s</span>`;
        }

        // Active Buffs generic display
        if (p.buffTime > 0 && k.name !== 'Gold') {
            txt += ` <span style="color:#00bfff; margin-left:10px;">効果中: ${(p.buffTime / 60).toFixed(1)}s</span>`;
        }

        top.innerHTML = txt;
    }
}

// --- FLOW CONTROL ---



// ===== INITIALIZATION & UI =====

function init() {
    console.log("--- Initializing APOCALYPSE ---");
    // alert("Debug: Init called"); // Too annoying if loop? No, init called once.

    // Initialize Recognizer
    if (typeof HandwritingRecognizer !== 'undefined') {
        try {
            window.Recognizer = new HandwritingRecognizer();
            window.Recognizer.init(Object.keys(CONFIG.Kanji));
            console.log('Recognizer initialized successfully');
        } catch (e) {
            console.error('Recognizer init failed:', e);
        }
    } else {
        console.error('HandwritingRecognizer class not found');
    }

    SoundManager.playBGM('menu');
    loadSave();

    // Bind UI events
    bindUIEvents();

    if (!STATE.Kanji) {
        showScreen('kanji_select');
    } else {
        showScreen('title');
    }

    // Start game loop
    if (!STATE.LoopStarted) {
        STATE.LoopStarted = true;
        requestAnimationFrame(loop);
    }
}



function populateKanjiList() {
    const container = document.getElementById('list-selection-container');
    if (!container) {
        console.error("list-selection-container not found!");
        return;
    }
    container.innerHTML = '';
    const keys = Object.keys(CONFIG.Kanji);
    console.log("Populating Kanji List with", keys.length, "items:", keys);

    keys.forEach(k => {
        const data = CONFIG.Kanji[k];
        const btn = document.createElement('button');
        btn.className = 'kanji-btn';
        btn.style.margin = '5px';
        btn.style.padding = '10px';
        btn.style.fontSize = '24px';
        btn.style.background = '#333';
        btn.style.border = '1px solid ' + data.color;
        btn.style.color = data.color;
        btn.innerText = k;
        btn.title = data.name + ' (' + data.type + ')';

        btn.onclick = () => {
            STATE.Kanji = k;
            saveGame();
            console.log('Selected:', k, '(' + data.name + ')');
            showScreen('title');
        };
        container.appendChild(btn);
    });

    console.log("Kanji list populated successfully");
}

function bindUIEvents() {
    // Title
    const btnStart = document.getElementById('btn-start');
    if (btnStart) btnStart.onclick = () => {
        if (!STATE.Kanji) {
            alert('印を選択してください！');
            showScreen('kanji_select');
        } else {
            startGame();
        }
    };

    const btnReselect = document.getElementById('btn-title-reselect');
    if (btnReselect) btnReselect.onclick = () => showScreen('kanji_select');

    // Kanji Select Side Panel
    const btnOpen = document.getElementById('btn-open-list');
    const btnClose = document.getElementById('btn-close-list');
    const panel = document.getElementById('seal-side-panel');
    if (btnOpen && panel) btnOpen.onclick = () => panel.classList.add('open');
    if (btnClose && panel) btnClose.onclick = () => panel.classList.remove('open');

    // Handwriting
    const pad = document.getElementById('writing-pad');
    if (pad) {
        const ctx = pad.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, pad.width, pad.height);
        ctx.lineWidth = 15;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';

        let isDrawing = false;
        let lastPos = { x: 0, y: 0 };
        let lastTime = 0;
        let autoCommitTimer = null;
        let bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
        let strokeCount = 0; // Track strokes
        const COMMIT_DELAY = 1500;

        const getPos = (e) => {
            const rect = pad.getBoundingClientRect();
            let clientX, clientY;

            // Handle mouse events
            if (e.clientX !== undefined) {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            // Handle touch events (use touches first, then changedTouches for touchend)
            else if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }
            else if (e.changedTouches && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            }
            else {
                // Fallback to lastPos if no valid coordinates
                return lastPos;
            }

            return {
                x: (clientX - rect.left) * (pad.width / rect.width),
                y: (clientY - rect.top) * (pad.height / rect.height)
            };
        };

        const updateBounds = (x, y) => {
            if (x < bounds.minX) bounds.minX = x;
            if (x > bounds.maxX) bounds.maxX = x;
            if (y < bounds.minY) bounds.minY = y;
            if (y > bounds.maxY) bounds.maxY = y;
        };

        const resetBounds = () => {
            bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
            strokeCount = 0;
        };

        const updateStatus = (text, color) => {
            const rn = document.getElementById('result-name');
            if (rn) {
                rn.innerText = text;
                rn.style.color = color;
            }
        };

        const performRecognition = () => {
            if (!window.Recognizer) return;

            pad.dataset.locked = 'true';
            updateStatus('認識中...', '#e74c3c');

            // Pass strokeCount to recognizer
            const res = window.Recognizer.recognize(pad, strokeCount);
            if (!res) {
                pad.dataset.locked = 'false';
                return;
            }

            console.log("Recognized:", res.char, "Score:", res.score, "Strokes:", strokeCount);

            // Calculate Overlay Position & Size strictly matching Canvas
            const padRect = pad.getBoundingClientRect();

            // 1. Fade Out Ink (Overlay White) - Use FIXED positioning for mobile compatibility
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = padRect.top + 'px';
            overlay.style.left = padRect.left + 'px';
            overlay.style.width = padRect.width + 'px';
            overlay.style.height = padRect.height + 'px';
            overlay.style.backgroundColor = 'white';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 1.2s ease-out';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '1000';
            document.body.appendChild(overlay);

            // 2. Fade In Character (Centered on Input)
            const charDisplay = document.createElement('div');
            charDisplay.innerText = res.char;
            charDisplay.style.position = 'fixed';

            // Calculate center in viewport coordinates
            let centerX = padRect.left + padRect.width / 2;
            let centerY = padRect.top + padRect.height / 2;

            if (bounds.minX !== Infinity) {
                const cx = (bounds.minX + bounds.maxX) / 2;
                const cy = (bounds.minY + bounds.maxY) / 2;
                // Ratio
                const rX = cx / pad.width;
                const rY = cy / pad.height;
                centerX = padRect.left + rX * padRect.width;
                centerY = padRect.top + rY * padRect.height;
            }

            charDisplay.style.top = centerY + 'px';
            charDisplay.style.left = centerX + 'px';
            charDisplay.style.transform = 'translate(-50%, -50%) scale(0.6)';
            charDisplay.style.fontFamily = "'Yuji Syuku', serif";
            charDisplay.style.fontSize = '180px';
            charDisplay.style.color = '#1a1a1a';
            charDisplay.style.opacity = '0';
            charDisplay.style.transition = 'opacity 1.5s ease-in, transform 1.5s cubic-bezier(0.22, 1, 0.36, 1)';
            charDisplay.style.pointerEvents = 'none';
            charDisplay.style.textShadow = '0 0 20px rgba(0,0,0,0.1)';
            charDisplay.style.zIndex = '1001';
            charDisplay.style.whiteSpace = 'nowrap';
            document.body.appendChild(charDisplay);

            // Trigger Animations
            requestAnimationFrame(() => {
                overlay.style.opacity = '1.0'; // Fully cover ink
                charDisplay.style.opacity = '1';
                charDisplay.style.transform = 'translate(-50%, -50%) scale(1.0)';
            });

            // 3. Confirm & Transition
            setTimeout(() => {
                // Set State & Go Back
                STATE.Kanji = res.char;
                updateStatus(CONFIG.Kanji[res.char]?.name || 'Unknown', '#2ecc71');

                // Show result in UI (for consistency, though we transition soon)
                const rc = document.getElementById('result-char');
                if (rc) rc.innerText = res.char;

                const bc = document.getElementById('btn-confirm-start');
                if (bc) bc.style.display = 'block';

                // Clear Canvas logic happens in background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, pad.width, pad.height);
                resetBounds();

                // Cleanup DOM
                overlay.remove();
                charDisplay.remove();
                pad.dataset.locked = 'false';

                // We do NOT auto-start here in the old logic, but Game_new.js did `saveGame(); showScreen('title');`
                // However, user flow in Game.js seems to be: Recognize -> Show confirm button -> Click confirm -> Start.
                // The new logic in Game_new.js was auto-transition.
                // Reverting to manual confirm if the user wants to verify result?
                // Wait, Game_new.js code at lines 2198-2199: `saveGame(); showScreen('title');`
                // It skipped the "Confirm" button step.
                // The user complained about "floating stuff gone".
                // I should mirror Game_new.js behavior? 
                // But the user screenshot shows "Recognized: Earth" and "Start with this seal" button.
                // If I auto-transition, they won't see that screen.
                // Let's keep the *visual* effect but NOT auto-transition, or check if Game_new.js had a different flow.
                // Game_new.js 2199 calls `showScreen('title')`. 
                // `showScreen('title')` IS the screen with "Start Battle" and "Change Seal".
                // But `kanji_select_screen` (where drawing happens) is separate.
                // So yes, it auto-transitions back to Title Screen.

                saveGame();
                showScreen('title');

            }, 2000);
        };

        const start = (e) => {
            if (pad.dataset.locked === 'true') return;
            // Cancel pending commit
            if (autoCommitTimer) {
                clearTimeout(autoCommitTimer);
                autoCommitTimer = null;
                updateStatus('入力中...', '#333');
            }

            isDrawing = true;
            // Don't increment stroke here, increment on end?
            // game_new.js incremented on end. game.js increased on start.
            // visual logic used `move` with velocity width.

            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            lastPos = pos;
            lastTime = Date.now();
            updateBounds(pos.x, pos.y);

            // Draw dot
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
            ctx.fill();
        };

        const move = (e) => {
            if (!isDrawing) return;
            if (e.type.startsWith('touch')) e.preventDefault();

            const pos = getPos(e);
            const now = Date.now();
            const dt = now - lastTime;
            const dist = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);

            updateBounds(pos.x, pos.y);

            const velocity = dt > 0 ? dist / dt : 0;
            let width = 18 - (velocity * 6);
            if (width < 6) width = 6;
            if (width > 18) width = 18;

            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(lastPos.x, lastPos.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();

            lastPos = pos;
            lastTime = now;
        };

        const end = () => {
            if (!isDrawing) return;
            isDrawing = false;
            strokeCount++;

            updateStatus('認識待機中...', '#e67e22');
            autoCommitTimer = setTimeout(performRecognition, COMMIT_DELAY);
        };

        pad.addEventListener('mousedown', start);
        pad.addEventListener('mousemove', move);
        pad.addEventListener('mouseup', end);
        pad.addEventListener('mouseleave', end);
        pad.addEventListener('touchstart', (e) => { e.preventDefault(); start(e); }, { passive: false });
        pad.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); }, { passive: false });
        pad.addEventListener('touchend', end);

        // Manual Buttons removed

        const btnConf = document.getElementById('btn-confirm-start');
        if (btnConf) btnConf.onclick = () => {
            saveGame();
            startGame();
        };
    }

    // Shop / Result Buttons
    const bindClick = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    };
    bindClick('btn-up-ability', () => window.buyUpgrade('Ability'));
    bindClick('btn-up-atk', () => window.buyUpgrade('ATK'));
    bindClick('btn-up-hp', () => window.buyUpgrade('HP'));
    bindClick('btn-next-stage', () => window.nextStage());
    bindClick('btn-retry', () => window.retryStage());
    bindClick('btn-reset', () => window.resetRun());
    bindClick('btn-ng-plus', () => window.newGamePlus());
    bindClick('btn-full-reset', () => window.resetRun());
}

// --- SCREEN MANAGEMENT ---
function showScreen(name) {
    STATE.Screen = name;

    // 1. Hide ALL screens first
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; // Force hide
    });

    // 2. Show Target Screen
    const map = {
        'kanji_select': 'kanji-select-screen',
        'game': 'game-screen',
        'result': 'result-screen',
        'title': 'title-screen'
    };
    const id = map[name] || (name + '-screen');
    const target = document.getElementById(id);

    if (target) {
        target.classList.add('active');
        target.style.display = 'flex'; // Or block for game

        if (name === 'title') {
            // console.log("Showing Title Screen");
            const disp = document.getElementById('title-kanji-display');
            if (disp) {
                if (STATE.Kanji && CONFIG.Kanji[STATE.Kanji]) {
                    const k = CONFIG.Kanji[STATE.Kanji];
                    disp.innerHTML = `選択中: <span style="font-size:32px; font-weight:bold;">${STATE.Kanji}</span> (${k.name})`;
                    disp.style.display = 'block';
                } else {
                    disp.style.display = 'none';
                }
            }
        }

        // Special case for game screen which needs block, others flex
        if (name === 'game') {
            target.style.display = 'block';
            resize(); // Force resize when showing game

            // Show HUD
            const hud = document.getElementById('hud');
            if (hud) hud.style.display = 'block';
        } else if (name === 'result') {
            target.style.display = 'block'; // Result needs block for scroll
            const hud = document.getElementById('hud');
            if (hud) hud.style.display = 'none';

            // --- RESULT UI SETUP ---
            const win = STATE.GameResult === 'win';
            const shop = document.getElementById('shop-container');
            const over = document.getElementById('game-over-container');
            const clear = document.getElementById('all-clear-container');
            const title = document.getElementById('result-title');

            if (shop) shop.style.display = 'none';
            if (over) over.style.display = 'none';
            if (clear) clear.style.display = 'none';
            if (title) title.innerText = "結果";

            if (win) {
                if (shop) {
                    shop.style.display = 'block';

                    // Detailed Stats
                    const kanji = CONFIG.Kanji[STATE.Kanji];
                    const kName = document.getElementById('res-kanji-name');
                    if (kName) kName.innerText = kanji ? (STATE.Kanji + " (" + kanji.name + ")") : STATE.Kanji;

                    const rStage = document.getElementById('res-stage');
                    // STATE.Stage is current index (0-2), display as 1-3
                    // If Game Result is win, we might have just finished stage X.
                    // If we are at result screen after winning stage 0, STATE.Stage might still be 0 until nextStage?
                    // nextStage increments it. So here it is usually correct.
                    if (rStage) rStage.innerText = "第 " + (STATE.Stage + 1) + " 戦場";

                    const rDur = document.getElementById('res-duration');
                    if (rDur && kanji) {
                        let text = "---";
                        // Calculate based on level scaling
                        const lvl = STATE.Levels.Ability;

                        if (kanji.duration) {
                            let dur = kanji.duration;
                            if (kanji.scaling && kanji.scaling.dur) {
                                dur = Math.floor(dur * (1 + kanji.scaling.dur * (lvl - 1)));
                            }
                            text = (dur / 60).toFixed(1) + "秒";
                        } else if (kanji.type === 'projectile') {
                            text = "瞬間 (Instant)";
                        } else if (kanji.type.startsWith('passive')) {
                            text = "常時 (Passive)";
                        } else if (kanji.poison && kanji.poison.duration) {
                            let dur = kanji.poison.duration;
                            // dot scaling usually doesn't affect duration but check logic
                            if (kanji.scaling && kanji.scaling.dur) dur = Math.floor(dur * (1 + kanji.scaling.dur * (lvl - 1)));
                            text = (dur / 60).toFixed(1) + "秒 (Dot)";
                        }

                        rDur.innerText = text;
                    }

                    // Money
                    const sm = document.getElementById('shop-money');
                    if (sm) sm.innerText = STATE.Money;

                    // Levels & stats
                    const la = document.getElementById('lvl-ability');
                    if (la) la.innerText = STATE.Levels.Ability;

                    const lk = document.getElementById('lvl-atk');
                    if (lk) lk.innerText = STATE.Levels.ATK;
                    // Calc Damage
                    const damage = Math.floor(10 * Math.pow(1.2, STATE.Levels.ATK - 1));
                    const vk = document.getElementById('val-atk');
                    if (vk) vk.innerText = `(${damage})`;

                    const lh = document.getElementById('lvl-hp');
                    if (lh) lh.innerText = STATE.Levels.HP;
                    const hp = Math.floor(100 * Math.pow(1.2, STATE.Levels.HP - 1));
                    const vh = document.getElementById('val-hp');
                    if (vh) vh.innerText = `(${hp})`;

                    // Buttons
                    const bAbi = document.getElementById('btn-up-ability');
                    if (bAbi) bAbi.innerText = '強化: ' + getCost('Ability');
                    const bAtk = document.getElementById('btn-up-atk');
                    if (bAtk) bAtk.innerText = '強化: ' + getCost('ATK');
                    const bHp = document.getElementById('btn-up-hp');
                    if (bHp) bHp.innerText = '強化: ' + getCost('HP');

                    // Update Next Stage Button
                    const btnNext = document.getElementById('btn-next-stage');
                    if (btnNext) {
                        // Start from Stage 0. If we just won Stage 2 (index 2), we are done?
                        // Game logic: Stage=0 -> Win -> Screen -> Next -> Stage=1...
                        // Loop is: Stage 0, Stage 1, Stage 2. 
                        // If we just won Stage 2, `winStage` was called.
                        // STATE.Stage is currently 2.
                        if (STATE.Stage >= 2) {
                            btnNext.innerText = "天下無双へ";
                            btnNext.className = "btn primary"; // Ensure class
                        } else {
                            btnNext.innerText = "次の戦場へ";
                            btnNext.className = "btn primary";
                        }
                    }
                }
            } else {
                if (over) over.style.display = 'block';
            }
        } else {
            const hud = document.getElementById('hud');
            if (hud) hud.style.display = 'none';
        }

        // Special Setup for Kanji Select
        if (name === 'kanji_select') {
            populateKanjiList();
            // Reset Result display
            const rc = document.getElementById('result-char');
            const rn = document.getElementById('result-name');
            if (rc) rc.innerText = '?';
            if (rn) rn.innerText = '---';
            const bc = document.getElementById('btn-confirm-start');
            if (bc) bc.style.display = 'none';
        }
    }
}

// --- GAME LOOP ---
// --- GAME LOOP ---
function loop() {
    // requestAnimationFrame(loop); // Move to end to better handle errors? 
    // Actually better to keep at top so it keeps running, but if error repeats, it floods.
    // Let's put at bottom if success.

    try {
        const now = Date.now();
        if (!STATE.LastTime) STATE.LastTime = now;
        const dt = (now - STATE.LastTime) / 1000;
        STATE.LastTime = now;

        // Use 'game' state (consistent with showScreen logic)
        if (STATE.Screen === 'game') {
            if (!STATE.GameOver) {
                update(dt);
                draw();

                // Screen Flash Logic (Gray)
                if (STATE.ScreenFlash > 0) {
                    const ctx = UI.ctx;
                    ctx.save();
                    // Fade out over 30 frames (0.5s)
                    ctx.fillStyle = `rgba(100, 100, 100, ${(STATE.ScreenFlash / 30) * 0.8})`;
                    ctx.fillRect(0, 0, UI.canvas.width, UI.canvas.height);
                    ctx.restore();
                    STATE.ScreenFlash--;
                }
            } else {
                // Game Over Logic if needed
            }
        }

        if (!STATE.Paused) requestAnimationFrame(loop);

    } catch (e) {
        console.error("Loop Error:", e);
        alert("Loop Error: " + e.message + "\n" + e.stack);
        STATE.Paused = true;
    }
}

function startGame() {
    STATE.Player = new Player();
    STATE.Entities = [];
    STATE.Frame = 0;
    STATE.Time = 0;
    STATE.BossSpawned = false;
    STATE.BossDead = false;
    STATE.GameOver = false; // Ensure False
    STATE.Paused = false;   // Ensure False

    // Clear UI layer
    UI.layer.innerHTML = '';

    // CLEANUP: Remove any lingering handwriting overlays
    const overlays = document.querySelectorAll('#handwriting-ui > div');
    overlays.forEach(el => {
        // Keep result-display-area and manual controls if any
        if (el.id !== 'result-display-area' && !el.classList.contains('hw-controls') && el.id !== 'writing-pad') {
            // It's likely an overlay div
            if (el.style.position === 'absolute' && el.style.backgroundColor === 'white') {
                el.remove();
            }
            // Remove the charDisplay too (has innerText)
            if (el.style.position === 'absolute' && el.innerText.length > 0 && el.id !== 'hud-text') {
                el.remove();
            }
        }
    });

    // Explicitly hide side panel
    const panel = document.getElementById('seal-side-panel');
    if (panel) panel.classList.remove('open');

    // Play Stage BGM
    try {
        SoundManager.playBGM(STATE.Stage === 0 ? 'stage1' : (STATE.Stage === 1 ? 'stage2' : 'stage3'));
    } catch (e) { console.warn("BGM Start Failed", e); }

    showScreen('game'); // Use 'game' not 'play' as ID is game-screen
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
        // We can just switch the displayed container in the result screen
        endGame(true); // Call endGame to set result screen and save money
        const shop = document.getElementById('shop-container');
        const clear = document.getElementById('all-clear-container');
        if (shop) shop.style.display = 'none';
        if (clear) clear.style.display = 'block';

        const title = document.getElementById('result-title');
        if (title) title.innerText = ""; // Hide "Result" title for All Clear
    }
}

// --- RESIZE LOGIC ---
function resize() {
    if (UI && UI.canvas) {
        UI.canvas.width = window.innerWidth;
        UI.canvas.height = window.innerHeight;

        // Update Game Logic Bounds
        CONFIG.ScreenWidth = window.innerWidth;
        CONFIG.ScreenHeight = window.innerHeight;
    }
}
window.addEventListener('resize', resize);
resize(); // Initial resize

function retryStage() {
    STATE.Money = STATE.MoneyAtStageStart; // Reset money to start of stage
    startGame();
}

function newGamePlus() {
    // Keep money, Keep levels, Reset Stage, Reset Kanji
    STATE.Stage = 0;
    STATE.MoneyAtStageStart = STATE.Money;
    STATE.Kanji = null;

    // Clear UI layer?
    UI.layer.innerHTML = '';

    saveGame();
    showScreen('kanji_select'); // ID matches
}

function resetRun() {
    // Clear everything
    localStorage.removeItem('kanji_slasher_save');
    STATE.Kanji = null;
    STATE.Money = 0;
    STATE.Levels = { Ability: 1, ATK: 1, HP: 1 };
    STATE.Stage = 0;
    STATE.MoneyAtStageStart = 0;

    UI.layer.innerHTML = '';

    saveGame();
    showScreen('kanji_select');
}

function buyUpgrade(type) {
    const cost = getCost(type);
    if (STATE.Money >= cost) {
        STATE.Money -= cost;
        STATE.Levels[type]++;

        // Refill HP if buying HP upgrade? Optional, but typical.
        if (type === 'HP') {
            // Recalculate max HP? It's calc'd in Player constructor.
            // But if we upgrade in shop (result screen), Player object might be null or old.
            // When we start next stage, Player is recreated with new levels.
        }

        saveGame();
        showScreen('result'); // ID matches result-screen
    } else {
        alert("お金が足りません！");
    }
}

// Global functions for HTML buttons
window.buyUpgrade = buyUpgrade;
window.startGame = startGame;
window.nextStage = nextStage;
window.retryStage = retryStage;
window.newGamePlus = newGamePlus;
window.resetRun = resetRun;
window.resize = resize; // Expose resize just in case

// Start Init
window.addEventListener('DOMContentLoaded', init);

function getCost(type) {
    const lvl = STATE.Levels[type];
    return Math.floor(CONFIG.Upgrade.BaseCost * Math.pow(CONFIG.Upgrade.Growth, lvl - 1));
}

// ==========================================
// V10 PHASE 1: HELPER FUNCTIONS
// ==========================================

function setShadow(ctx, color, blur) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
}

function resetShadow(ctx) {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
}

function spawnAuraPixel(x, y, color, type) {
    STATE.Entities.push(new Particle(x, y, Math.random() * 3 + 2, color, type || 'normal'));
}

function drawStarShape(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

// ==========================================
// V10 PHASE 2: FIRE, FLAME, WATER EFFECTS
// ==========================================

// Override Projectile.draw for custom visuals
const _originalProjectileDraw = Projectile.prototype.draw;
Projectile.prototype.draw = function (ctx) {
    const t = STATE.Frame;

    // FIRE: Realistic flickering flame
    if (this.fxType === 'fire') {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Multiple flame layers for realism
        for (let i = 0; i < 5; i++) {
            const flicker = Math.sin(t * 0.3 + i * 0.5) * 0.3 + 0.7;
            const size = this.r * (1.5 - i * 0.2) * flicker;
            const offset = Math.sin(t * 0.5 + i) * 3;

            // Gradient from yellow core to red edge
            const gradient = ctx.createRadialGradient(offset, -i * 3, 0, offset, -i * 3, size);
            gradient.addColorStop(0, i === 0 ? '#fff' : '#ffeb3b');
            gradient.addColorStop(0.3, '#ff9800');
            gradient.addColorStop(0.6, '#f44336');
            gradient.addColorStop(1, 'rgba(255, 87, 34, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            // Flame shape (teardrop-ish)
            ctx.moveTo(offset, -size * 1.5 - i * 2);
            ctx.bezierCurveTo(
                offset + size, -size * 0.5,
                offset + size * 0.5, size * 0.5,
                offset, size * 0.3
            );
            ctx.bezierCurveTo(
                offset - size * 0.5, size * 0.5,
                offset - size, -size * 0.5,
                offset, -size * 1.5 - i * 2
            );
            ctx.fill();
        }

        // Ember particles trail
        if (t % 3 === 0) {
            const ember = new Particle(
                this.x + (Math.random() - 0.5) * 10,
                this.y + (Math.random() - 0.5) * 10,
                Math.random() * 3 + 1,
                Math.random() > 0.5 ? '#ff9800' : '#f44336',
                'fire'
            );
            ember.vy = -Math.random() * 2 - 1;
            ember.vx = (Math.random() - 0.5) * 2;
            ember.life = 20;
            STATE.Entities.push(ember);
        }

        ctx.restore();
        return;
    }

    // WATER: Flowing stream effect
    if (this.fxType === 'water') {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));

        // Main water stream body
        const streamLength = 25;
        const gradient = ctx.createLinearGradient(-streamLength, 0, streamLength, 0);
        gradient.addColorStop(0, 'rgba(52, 152, 219, 0.3)');
        gradient.addColorStop(0.3, 'rgba(52, 152, 219, 0.8)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(52, 152, 219, 0.8)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Wavy stream shape
        const wave = Math.sin(t * 0.4) * 2;
        ctx.moveTo(-streamLength, wave);
        ctx.quadraticCurveTo(-streamLength / 2, -this.r + wave, 0, wave * 0.5);
        ctx.quadraticCurveTo(streamLength / 2, this.r + wave, streamLength, 0);
        ctx.quadraticCurveTo(streamLength / 2, -this.r + wave, 0, wave * 0.5);
        ctx.quadraticCurveTo(-streamLength / 2, this.r + wave, -streamLength, wave);
        ctx.fill();

        // White highlights
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, wave * 0.5);
        ctx.lineTo(10, wave * 0.3);
        ctx.stroke();

        // Trailing water droplets
        if (t % 4 === 0) {
            const drop = new Particle(
                this.x - this.vx * 0.5 + (Math.random() - 0.5) * 8,
                this.y - this.vy * 0.5 + (Math.random() - 0.5) * 8,
                Math.random() * 2 + 1,
                '#3498db',
                'bubble'
            );
            drop.life = 15;
            STATE.Entities.push(drop);
        }

        ctx.restore();
        return;
    }

    // ICE: Sharp crystal arrow
    if (this.fxType === 'ice') {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));

        const len = 20;
        const width = 6;

        // Ice arrow body with gradient
        const iceGrad = ctx.createLinearGradient(-len, 0, len, 0);
        iceGrad.addColorStop(0, 'rgba(200, 230, 255, 0.4)');
        iceGrad.addColorStop(0.3, 'rgba(150, 200, 255, 0.8)');
        iceGrad.addColorStop(0.6, 'rgba(220, 240, 255, 1)');
        iceGrad.addColorStop(1, 'rgba(255, 255, 255, 1)');

        ctx.fillStyle = iceGrad;
        ctx.beginPath();
        // Arrow shape
        ctx.moveTo(len + 8, 0); // Sharp tip
        ctx.lineTo(len - 5, -width);
        ctx.lineTo(-len, -width * 0.5);
        ctx.lineTo(-len - 5, 0);
        ctx.lineTo(-len, width * 0.5);
        ctx.lineTo(len - 5, width);
        ctx.closePath();
        ctx.fill();

        // White highlight line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-len + 5, 0);
        ctx.lineTo(len, 0);
        ctx.stroke();

        // Frost glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#aef';
        ctx.strokeStyle = 'rgba(174, 221, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ice crystal trail
        if (t % 3 === 0) {
            const crystal = new Particle(
                this.x - this.vx * 0.3 + (Math.random() - 0.5) * 6,
                this.y - this.vy * 0.3 + (Math.random() - 0.5) * 6,
                Math.random() * 3 + 1,
                '#cef',
                'normal'
            );
            crystal.life = 12;
            crystal.vx = -this.vx * 0.1;
            crystal.vy = -this.vy * 0.1;
            STATE.Entities.push(crystal);
        }

        ctx.restore();
        return;
    }

    // EARTH: MASSIVE powerful rock projectile
    if (this.fxType === 'rock') {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));

        // Much bigger size
        const len = 45;
        const width = 22;

        // Heavy rock with 3D shading
        const rockGrad = ctx.createLinearGradient(-len, -width, len, width);
        rockGrad.addColorStop(0, '#3e2723');
        rockGrad.addColorStop(0.2, '#5d4037');
        rockGrad.addColorStop(0.5, '#795548');
        rockGrad.addColorStop(0.8, '#6d4c41');
        rockGrad.addColorStop(1, '#4e342e');

        // Shadow for depth
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        ctx.fillStyle = rockGrad;
        ctx.beginPath();
        // Massive bullet shape
        ctx.moveTo(len + 15, 0); // Sharp pointed front
        ctx.quadraticCurveTo(len + 5, -width * 0.8, len - 10, -width);
        ctx.lineTo(-len * 0.3, -width * 0.9);
        ctx.quadraticCurveTo(-len, -width * 0.6, -len - 8, 0);
        ctx.quadraticCurveTo(-len, width * 0.6, -len * 0.3, width * 0.9);
        ctx.lineTo(len - 10, width);
        ctx.quadraticCurveTo(len + 5, width * 0.8, len + 15, 0);
        ctx.fill();

        // Reset shadow for details
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Cracks and texture
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Main crack
        ctx.moveTo(-len * 0.2, -width * 0.6);
        ctx.lineTo(len * 0.3, -width * 0.2);
        ctx.lineTo(len * 0.1, width * 0.3);
        // Secondary cracks  
        ctx.moveTo(-len * 0.5, width * 0.2);
        ctx.lineTo(-len * 0.1, width * 0.5);
        ctx.moveTo(len * 0.2, -width * 0.4);
        ctx.lineTo(len * 0.5, -width * 0.1);
        ctx.stroke();

        // Highlight edge
        ctx.strokeStyle = 'rgba(189, 154, 122, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(len, -width * 0.3);
        ctx.lineTo(len + 12, 0);
        ctx.lineTo(len, width * 0.3);
        ctx.stroke();

        // Heavy dust trail
        if (t % 2 === 0) {
            for (let i = 0; i < 4; i++) {
                const dust = new Particle(
                    this.x - this.vx * 0.8 + (Math.random() - 0.5) * 25,
                    this.y - this.vy * 0.8 + (Math.random() - 0.5) * 25,
                    Math.random() * 8 + 4,
                    ['#a1887f', '#8d6e63', '#bcaaa4', '#d7ccc8'][Math.floor(Math.random() * 4)],
                    'rock'
                );
                dust.life = 25;
                dust.vx = -this.vx * 0.3 + (Math.random() - 0.5) * 3;
                dust.vy = -this.vy * 0.3 + (Math.random() - 0.5) * 3;
                STATE.Entities.push(dust);
            }
        }

        ctx.restore();
        return;
    }

    // WIND: Kamaitachi style spinning blade
    if (this.fxType === 'wind') {
        ctx.save();
        ctx.translate(this.x, this.y);

        const spin = STATE.Frame * 0.4; // Spinning rotation
        const size = 18;

        // Multiple spinning slash marks
        for (let blade = 0; blade < 3; blade++) {
            const angle = spin + (blade * Math.PI * 2 / 3);

            ctx.save();
            ctx.rotate(angle);

            // Curved slash shape
            const slashGrad = ctx.createLinearGradient(-size, 0, size, 0);
            slashGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            slashGrad.addColorStop(0.3, 'rgba(200, 230, 255, 0.7)');
            slashGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
            slashGrad.addColorStop(0.7, 'rgba(200, 230, 255, 0.7)');
            slashGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.strokeStyle = slashGrad;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            // Curved slash arc
            ctx.beginPath();
            ctx.arc(0, -size * 0.8, size, Math.PI * 0.3, Math.PI * 0.7);
            ctx.stroke();

            // Sharp tip glow
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(size * 0.5, -size * 0.3, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // Central vortex
        ctx.strokeStyle = 'rgba(200, 230, 255, 0.4)';
        ctx.lineWidth = 1;
        for (let ring = 0; ring < 3; ring++) {
            ctx.beginPath();
            ctx.arc(0, 0, 5 + ring * 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Trailing wind slashes
        if (t % 3 === 0) {
            const slash = new Particle(
                this.x - this.vx * 0.3,
                this.y - this.vy * 0.3,
                Math.random() * 3 + 2,
                'rgba(200, 230, 255, 0.6)',
                'normal'
            );
            slash.life = 10;
            slash.vx = -this.vx * 0.2 + (Math.random() - 0.5) * 3;
            slash.vy = -this.vy * 0.2 + (Math.random() - 0.5) * 3;
            STATE.Entities.push(slash);
        }

        ctx.restore();
        return;
    }

    // Default: use original draw
    if (_originalProjectileDraw) {
        _originalProjectileDraw.call(this, ctx);
    } else {
        // Fallback
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
};

// Enhanced hit effects for Fire and Water
const _originalProjectileUpdate = Projectile.prototype.update;
Projectile.prototype.update = function () {
    const oldDead = this.dead;
    _originalProjectileUpdate.call(this);

    // On-hit effects (when projectile just died from hitting something)
    if (!oldDead && this.dead && this.hitCount > 0) {
        // FIRE: Burst into flames on hit
        if (this.fxType === 'fire') {
            for (let i = 0; i < 15; i++) {
                const p = new Particle(
                    this.x + (Math.random() - 0.5) * 20,
                    this.y + (Math.random() - 0.5) * 20,
                    Math.random() * 6 + 3,
                    ['#ff5722', '#ff9800', '#ffeb3b', '#fff'][Math.floor(Math.random() * 4)],
                    'fire'
                );
                p.vy = -Math.random() * 4 - 2;
                p.vx = (Math.random() - 0.5) * 6;
                p.life = 30 + Math.random() * 20;
                STATE.Entities.push(p);
            }
        }

        // WATER: Splash with bubbles
        if (this.fxType === 'water') {
            // Water splash ring
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const speed = 3 + Math.random() * 2;
                const drop = new Particle(
                    this.x,
                    this.y,
                    Math.random() * 4 + 2,
                    '#3498db',
                    'bubble'
                );
                drop.vx = Math.cos(angle) * speed;
                drop.vy = Math.sin(angle) * speed - 2;
                drop.life = 25;
                STATE.Entities.push(drop);
            }
            // Center splash
            for (let i = 0; i < 6; i++) {
                const bubble = new Particle(
                    this.x + (Math.random() - 0.5) * 15,
                    this.y + (Math.random() - 0.5) * 15,
                    Math.random() * 5 + 3,
                    'rgba(255, 255, 255, 0.7)',
                    'bubble'
                );
                bubble.vy = -Math.random() * 3 - 1;
                bubble.life = 20;
                STATE.Entities.push(bubble);
            }
        }

        // ICE: Blood splatter + freeze effect
        if (this.fxType === 'ice') {
            // Blood splatter
            for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 4;
                const blood = new Particle(
                    this.x,
                    this.y,
                    Math.random() * 4 + 2,
                    ['#8b0000', '#a00', '#c00', '#900'][Math.floor(Math.random() * 4)],
                    'normal'
                );
                blood.vx = Math.cos(angle) * speed;
                blood.vy = Math.sin(angle) * speed;
                blood.life = 25 + Math.random() * 15;
                STATE.Entities.push(blood);
            }
            // Ice shatter
            for (let i = 0; i < 6; i++) {
                const shard = new Particle(
                    this.x + (Math.random() - 0.5) * 10,
                    this.y + (Math.random() - 0.5) * 10,
                    Math.random() * 3 + 1,
                    '#cef',
                    'normal'
                );
                const a = Math.random() * Math.PI * 2;
                shard.vx = Math.cos(a) * 3;
                shard.vy = Math.sin(a) * 3;
                shard.life = 15;
                STATE.Entities.push(shard);
            }
        }

        // EARTH: Ground impact
        if (this.fxType === 'rock') {
            screenShake(6, 12);
            // Debris explosion
            for (let i = 0; i < 10; i++) {
                const debris = new Particle(
                    this.x + (Math.random() - 0.5) * 20,
                    this.y + (Math.random() - 0.5) * 20,
                    Math.random() * 6 + 3,
                    ['#795548', '#5d4037', '#8d6e63'][Math.floor(Math.random() * 3)],
                    'rock'
                );
                const a = Math.random() * Math.PI * 2;
                debris.vx = Math.cos(a) * 4;
                debris.vy = Math.sin(a) * 4 - 2;
                debris.life = 30;
                STATE.Entities.push(debris);
            }
        }
    }
};

// FLAME (炎): Pure particle-based realistic fire
// This is triggered when performing the Flame ability
const _originalPerformAbility = Player.prototype.performAbility;
Player.prototype.performAbility = function (angle, k) {
    // FLAME: Pure particle flames
    if (k.name === 'Flame') {
        this.abilityCD = k.cd;
        const range = k.range || 200;
        const px = this.x, py = this.y;
        const damage = k.damage;

        // Screen shake
        screenShake(5, 12);

        // Instant damage to all enemies in range
        STATE.Entities.forEach(e => {
            if (e instanceof Enemy && !e.dead) {
                const dist = Math.hypot(e.x - px, e.y - py);
                if (dist < range) {
                    e.takeDamage(damage);
                    e.burnTime = 180;
                }
            }
        });

        // Create invisible flame spawner (no visible shapes)
        const flameSpawner = new Entity(px, py, range, 'transparent');
        flameSpawner.life = 40;
        flameSpawner.totalLife = 40;

        flameSpawner.update = function () {
            this.life--;
            const intensity = this.life / this.totalLife;

            // Spawn LOTS of fire particles across the area
            const numParticles = Math.floor(15 * intensity) + 5;
            for (let i = 0; i < numParticles; i++) {
                const a = Math.random() * Math.PI * 2;
                const d = Math.random() * this.r;

                // Particle size based on position (bigger near center)
                const centerDist = d / this.r;
                const size = (1 - centerDist * 0.5) * (Math.random() * 8 + 4);

                // Color gradient: white/yellow center, orange/red edges
                const colors = centerDist < 0.3
                    ? ['#fff', '#fffde7', '#ffeb3b', '#ffc107']
                    : centerDist < 0.6
                        ? ['#ffc107', '#ff9800', '#ff5722']
                        : ['#ff5722', '#f44336', '#d32f2f', '#b71c1c'];
                const color = colors[Math.floor(Math.random() * colors.length)];

                const flame = new Particle(
                    this.x + Math.cos(a) * d,
                    this.y + Math.sin(a) * d,
                    size,
                    color,
                    'fire'
                );

                // Natural upward movement with slight randomness
                flame.vy = -Math.random() * 5 - 3;
                flame.vx = (Math.random() - 0.5) * 3;
                flame.life = 12 + Math.random() * 15;
                STATE.Entities.push(flame);
            }

            if (this.life <= 0) this.dead = true;
        };

        // Simple ground glow (no shapes, just soft light)
        flameSpawner.draw = function (ctx) {
            const alpha = Math.min(1, this.life / 10);
            if (alpha <= 0) return;

            ctx.save();

            // Soft orange glow on ground
            const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 0.8);
            glow.addColorStop(0, `rgba(255, 150, 50, ${0.3 * alpha})`);
            glow.addColorStop(0.5, `rgba(255, 80, 0, ${0.15 * alpha})`);
            glow.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * 0.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        };

        STATE.Entities.push(flameSpawner);
        return;
    }

    // POISON: Toxic bubble wave (no circle outline)
    if (k.name === 'Poison') {
        this.abilityCD = k.cd;
        const range = k.range || 180;
        const px = this.x, py = this.y;
        const damage = k.damage;

        // Apply poison to enemies in range
        STATE.Entities.forEach(e => {
            if (e instanceof Enemy && !e.dead) {
                const dist = Math.hypot(e.x - px, e.y - py);
                if (dist < range) {
                    e.poisonTime = k.dot?.duration || 300;
                    e.poisonDmg = k.dot?.damage || 2;
                }
            }
        });

        // Toxic bubble spawner
        const toxicZone = new Entity(px, py, range, 'transparent');
        toxicZone.life = 35;
        toxicZone.totalLife = 35;

        toxicZone.update = function () {
            this.life--;
            const intensity = this.life / this.totalLife;

            // Spawn toxic bubbles
            const numBubbles = Math.floor(8 * intensity) + 3;
            for (let i = 0; i < numBubbles; i++) {
                const a = Math.random() * Math.PI * 2;
                const d = Math.random() * this.r;

                const bubble = new Particle(
                    this.x + Math.cos(a) * d,
                    this.y + Math.sin(a) * d,
                    Math.random() * 6 + 3,
                    ['#9c27b0', '#7b1fa2', '#6a1b9a', '#4a148c', '#8e24aa'][Math.floor(Math.random() * 5)],
                    'bubble'
                );
                bubble.vy = -Math.random() * 3 - 1;
                bubble.vx = (Math.random() - 0.5) * 2;
                bubble.life = 20 + Math.random() * 15;
                STATE.Entities.push(bubble);
            }

            // Dripping toxic effect
            if (STATE.Frame % 3 === 0) {
                for (let i = 0; i < 3; i++) {
                    const drip = new Particle(
                        this.x + (Math.random() - 0.5) * this.r * 1.5,
                        this.y + (Math.random() - 0.5) * this.r * 1.5,
                        Math.random() * 4 + 2,
                        '#4a148c',
                        'normal'
                    );
                    drip.vy = Math.random() * 2 + 1;
                    drip.life = 15;
                    STATE.Entities.push(drip);
                }
            }

            if (this.life <= 0) this.dead = true;
        };

        toxicZone.draw = function (ctx) {
            const alpha = Math.min(1, this.life / 10);
            if (alpha <= 0) return;

            ctx.save();

            // Toxic fog glow (no outline)
            const toxicGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
            toxicGlow.addColorStop(0, `rgba(156, 39, 176, ${0.25 * alpha})`);
            toxicGlow.addColorStop(0.5, `rgba(106, 27, 154, ${0.15 * alpha})`);
            toxicGlow.addColorStop(1, 'rgba(74, 20, 140, 0)');
            ctx.fillStyle = toxicGlow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        };

        STATE.Entities.push(toxicZone);
        return;
    }

    // THUNDER: White plasma chain (max 2 chains, close range)
    if (k.name === 'Thunder') {
        this.abilityCD = k.cd;
        const range = 180; // Initial range from player
        const chainRange = 150; // Chain range between enemies
        const px = this.x, py = this.y;
        const damage = k.damage;

        // Find enemies in range, sorted by distance
        const targets = [];
        STATE.Entities.forEach(e => {
            if (e instanceof Enemy && !e.dead) {
                const dist = Math.hypot(e.x - px, e.y - py);
                if (dist < range) {
                    targets.push({ enemy: e, dist: dist });
                }
            }
        });
        targets.sort((a, b) => a.dist - b.dist);

        // Chain through enemies (max 2 chains = 3 enemies)
        const hitEnemies = [];
        const hitSet = new Set(); // Track hit enemies properly
        let lastX = px, lastY = py;

        // First target from player
        if (targets.length > 0) {
            const target = targets[0].enemy;
            hitEnemies.push({ x: target.x, y: target.y, fromX: px, fromY: py });
            hitSet.add(target);
            target.takeDamage(damage);
            lastX = target.x;
            lastY = target.y;

            // Chain to nearby enemies (max 2 more)
            for (let chain = 0; chain < 2; chain++) {
                let closest = null;
                let closestDist = chainRange;

                STATE.Entities.forEach(e => {
                    if (e instanceof Enemy && !e.dead && !hitSet.has(e)) {
                        const dist = Math.hypot(e.x - lastX, e.y - lastY);
                        if (dist < closestDist) {
                            closest = e;
                            closestDist = dist;
                        }
                    }
                });

                if (closest) {
                    hitEnemies.push({ x: closest.x, y: closest.y, fromX: lastX, fromY: lastY });
                    hitSet.add(closest);
                    closest.takeDamage(damage * 0.6);
                    lastX = closest.x;
                    lastY = closest.y;
                } else {
                    break;
                }
            }
        }

        // Create plasma visual
        if (hitEnemies.length > 0) {
            const plasmaFX = new Entity(px, py, 0, '#fff');
            plasmaFX.life = 18;
            plasmaFX.arcs = hitEnemies;

            plasmaFX.update = function () {
                this.life--;
                if (this.life <= 0) this.dead = true;
            };

            plasmaFX.draw = function (ctx) {
                const alpha = this.life / 18;

                ctx.save();
                ctx.globalAlpha = alpha;

                // Helper function to draw branching lightning
                const drawLightningBolt = (fromX, fromY, toX, toY, thickness, branches) => {
                    const dx = toX - fromX;
                    const dy = toY - fromY;
                    const dist = Math.hypot(dx, dy);
                    const segments = Math.max(5, Math.floor(dist / 15));

                    // Build path points
                    const points = [{ x: fromX, y: fromY }];
                    for (let s = 1; s < segments; s++) {
                        const t = s / segments;
                        const jitter = 12 * (1 - t * 0.5); // Less jitter near end
                        points.push({
                            x: fromX + dx * t + (Math.random() - 0.5) * jitter,
                            y: fromY + dy * t + (Math.random() - 0.5) * jitter
                        });
                    }
                    points.push({ x: toX, y: toY });

                    // Draw main bolt (thin white line)
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = thickness;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = 'rgba(200, 220, 255, 0.8)';
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';

                    ctx.beginPath();
                    ctx.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < points.length; i++) {
                        ctx.lineTo(points[i].x, points[i].y);
                    }
                    ctx.stroke();

                    // Draw branches (even thinner)
                    if (branches > 0) {
                        for (let i = 1; i < points.length - 1; i++) {
                            if (Math.random() < 0.4) { // 40% chance per segment
                                const branchAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI * 0.8;
                                const branchLen = 15 + Math.random() * 20;
                                const branchEndX = points[i].x + Math.cos(branchAngle) * branchLen;
                                const branchEndY = points[i].y + Math.sin(branchAngle) * branchLen;

                                // Sub-branch (thinner, no further branching)
                                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                                ctx.lineWidth = thickness * 0.5;
                                ctx.beginPath();
                                ctx.moveTo(points[i].x, points[i].y);
                                const midX = (points[i].x + branchEndX) / 2 + (Math.random() - 0.5) * 8;
                                const midY = (points[i].y + branchEndY) / 2 + (Math.random() - 0.5) * 8;
                                ctx.lineTo(midX, midY);
                                ctx.lineTo(branchEndX, branchEndY);
                                ctx.stroke();
                            }
                        }
                    }
                };

                this.arcs.forEach((arc) => {
                    // Main lightning bolt (thin)
                    drawLightningBolt(arc.fromX, arc.fromY, arc.x, arc.y, 2, 2);

                    // Secondary parallel bolt (very thin, offset)
                    const offsetX = (Math.random() - 0.5) * 6;
                    const offsetY = (Math.random() - 0.5) * 6;
                    drawLightningBolt(arc.fromX + offsetX, arc.fromY + offsetY, arc.x + offsetX, arc.y + offsetY, 1, 0);

                    // Small impact spark
                    if (this.life > 15) {
                        for (let p = 0; p < 2; p++) {
                            const spark = new Particle(
                                arc.x + (Math.random() - 0.5) * 10,
                                arc.y + (Math.random() - 0.5) * 10,
                                Math.random() * 1.5 + 0.5,
                                '#fff',
                                'normal'
                            );
                            spark.life = 5;
                            const a = Math.random() * Math.PI * 2;
                            spark.vx = Math.cos(a) * 3;
                            spark.vy = Math.sin(a) * 3;
                            STATE.Entities.push(spark);
                        }
                    }
                });

                ctx.restore();
            };

            STATE.Entities.push(plasmaFX);
            screenShake(4, 10);
        } else {
            // WHIFF: No enemy nearby - small spark discharge
            const whiffFX = new Entity(px, py, 0, '#fff');
            whiffFX.life = 12;

            whiffFX.update = function () {
                this.life--;
                if (this.life <= 0) this.dead = true;
            };

            whiffFX.draw = function (ctx) {
                const alpha = this.life / 12;

                ctx.save();
                ctx.globalAlpha = alpha;

                // Small random sparks around player
                for (let i = 0; i < 4; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const len = 20 + Math.random() * 15;
                    const endX = this.x + Math.cos(angle) * len;
                    const endY = this.y + Math.sin(angle) * len;

                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#adf';

                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    // Short jagged path
                    const midX = this.x + Math.cos(angle) * len * 0.5 + (Math.random() - 0.5) * 10;
                    const midY = this.y + Math.sin(angle) * len * 0.5 + (Math.random() - 0.5) * 10;
                    ctx.lineTo(midX, midY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }

                // Central spark
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 5 * alpha, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            };

            STATE.Entities.push(whiffFX);
        }

        return;
    }

    // LIGHT: Instant laser beam to screen edge
    if (k.name === 'Light') {
        this.abilityCD = k.cd;
        const px = this.x, py = this.y;
        const damage = k.damage;

        // Calculate beam direction
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const maxDist = 2000;
        const endX = px + cos * maxDist;
        const endY = py + sin * maxDist;

        // Damage all enemies in beam path
        const beamWidth = 35;
        STATE.Entities.forEach(e => {
            if (e instanceof Enemy && !e.dead) {
                const dx = e.x - px;
                const dy = e.y - py;
                const proj = dx * cos + dy * sin;
                if (proj > 0) {
                    const perpDist = Math.abs(dx * sin - dy * cos);
                    if (perpDist < beamWidth) {
                        e.takeDamage(damage);
                    }
                }
            }
        });

        // Create laser entity
        const laserFX = new Entity(px, py, 10, '#ffd700');
        laserFX.life = 12;
        laserFX.cos = cos;
        laserFX.sin = sin;
        laserFX.endX = endX;
        laserFX.endY = endY;
        laserFX.startX = px;
        laserFX.startY = py;

        laserFX.update = function () {
            this.life--;
            if (this.life <= 0) this.dead = true;
        };

        laserFX.draw = function (ctx) {
            const alpha = this.life / 12;
            const t = (12 - this.life) / 12;

            ctx.save();

            // Outer glow (widest, faint)
            ctx.globalAlpha = alpha * 0.4;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 25 + t * 20;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.startX, this.startY);
            ctx.lineTo(this.endX, this.endY);
            ctx.stroke();

            // Middle glow
            ctx.globalAlpha = alpha * 0.7;
            ctx.strokeStyle = '#ffeb3b';
            ctx.lineWidth = 12 + t * 10;
            ctx.beginPath();
            ctx.moveTo(this.startX, this.startY);
            ctx.lineTo(this.endX, this.endY);
            ctx.stroke();

            // Core beam (brightest, thinnest)
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(this.startX, this.startY);
            ctx.lineTo(this.endX, this.endY);
            ctx.stroke();

            ctx.restore();
        };

        STATE.Entities.push(laserFX);
        screenShake(4, 8);
        return;
    }

    // GROUND: Earthquake AoE
    if (k.name === 'Ground') {
        this.abilityCD = k.cd;
        const range = k.range || 200;
        const px = this.x, py = this.y;
        const damage = k.damage;

        screenShake(10, 30);

        STATE.Entities.forEach(e => {
            if (e instanceof Enemy && !e.dead) {
                const dist = Math.hypot(e.x - px, e.y - py);
                if (dist < range) {
                    e.takeDamage(damage);
                }
            }
        });

        const quakeFX = new Entity(px, py, range, '#8B4513');
        quakeFX.life = 45;
        quakeFX.totalLife = 45;

        quakeFX.update = function () {
            this.life--;
            if (this.life > 10) {
                for (let i = 0; i < 5; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const d = Math.random() * this.r;
                    const debris = new Particle(
                        this.x + Math.cos(a) * d,
                        this.y + Math.sin(a) * d,
                        Math.random() * 8 + 4,
                        ['#8B4513', '#654321', '#A0522D'][Math.floor(Math.random() * 3)],
                        'rock'
                    );
                    debris.vy = -Math.random() * 6 - 3;
                    debris.vx = (Math.random() - 0.5) * 4;
                    debris.life = 25;
                    STATE.Entities.push(debris);
                }
            }
            if (this.life <= 0) this.dead = true;
        };

        quakeFX.draw = function (ctx) {
            const alpha = Math.min(1, this.life / 10);
            const progress = 1 - (this.life / this.totalLife);

            ctx.save();

            for (let ring = 0; ring < 3; ring++) {
                const ringRadius = this.r * (0.3 + progress * 0.7 + ring * 0.2);
                ctx.strokeStyle = `rgba(139, 69, 19, ${alpha * 0.6 * (1 - ring * 0.3)})`;
                ctx.lineWidth = 5 - ring;
                ctx.beginPath();
                ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.strokeStyle = `rgba(60, 40, 20, ${alpha})`;
            ctx.lineWidth = 3;
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const len = this.r * (0.5 + progress * 0.5);
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + Math.cos(a) * len, this.y + Math.sin(a) * len);
                ctx.stroke();
            }

            ctx.restore();
        };

        STATE.Entities.push(quakeFX);
        return;
    }
    // MOUNTAIN: Shadow warning then crushing impact
    if (k.name === 'Mountain') {
        this.abilityCD = k.cd;
        const damage = k.damage;
        const range = k.range || 150;

        // Target in front of player
        const targetDist = 120;
        const targetX = this.x + Math.cos(angle) * targetDist;
        const targetY = this.y + Math.sin(angle) * targetDist;

        // Create shadow/impact entity with phases
        const impactFX = new Entity(targetX, targetY, range, '#5d4037');
        impactFX.life = 65; // 25 shadow + 40 impact
        impactFX.totalLife = 65;
        impactFX.range = range;
        impactFX.targetX = targetX;
        impactFX.targetY = targetY;
        impactFX.damage = damage;
        impactFX.impactTriggered = false;
        impactFX.shadowPhase = true;

        impactFX.update = function () {
            this.life--;

            // SHADOW PHASE (first 25 frames): Shadow grows
            if (this.life > 40) {
                this.shadowPhase = true;
                // Shadow warning visual only, no damage yet
            }

            // IMPACT PHASE (frame 40): Trigger damage and effects
            if (this.life === 40 && !this.impactTriggered) {
                this.impactTriggered = true;
                this.shadowPhase = false;

                // Heavy screen shake on impact
                screenShake(20, 35);

                // Damage enemies in impact zone NOW
                STATE.Entities.forEach(e => {
                    if (e instanceof Enemy && !e.dead) {
                        const dist = Math.hypot(e.x - this.targetX, e.y - this.targetY);
                        if (dist < this.range) {
                            e.takeDamage(this.damage);
                        }
                    }
                });

                // Debris explosion on impact
                for (let i = 0; i < 15; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 10 + 6;
                    const debris = new Particle(
                        this.x + (Math.random() - 0.5) * 40,
                        this.y + (Math.random() - 0.5) * 40,
                        Math.random() * 12 + 6,
                        ['#5d4037', '#795548', '#8d6e63', '#4e342e'][Math.floor(Math.random() * 4)],
                        'rock'
                    );
                    debris.vx = Math.cos(a) * speed;
                    debris.vy = Math.sin(a) * speed - 4;
                    debris.life = 35;
                    STATE.Entities.push(debris);
                }
            }

            // POST-IMPACT: Dust cloud
            if (this.life <= 40 && this.life > 15 && STATE.Frame % 2 === 0) {
                for (let i = 0; i < 3; i++) {
                    const dust = new Particle(
                        this.x + (Math.random() - 0.5) * this.range,
                        this.y + (Math.random() - 0.5) * this.range,
                        Math.random() * 6 + 3,
                        '#bcaaa4',
                        'normal'
                    );
                    dust.vy = -Math.random() * 2 - 1;
                    dust.life = 15;
                    STATE.Entities.push(dust);
                }
            }

            if (this.life <= 0) this.dead = true;
        };

        impactFX.draw = function (ctx) {
            ctx.save();

            // SHADOW PHASE: Growing dark shadow
            if (this.life > 40) {
                const shadowProgress = 1 - (this.life - 40) / 25; // 0 to 1
                const shadowSize = this.range * (0.3 + shadowProgress * 0.7);

                // Pulsing shadow
                const pulse = 1 + Math.sin(this.life * 0.3) * 0.1;

                // Dark ominous shadow
                const shadowGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, shadowSize * pulse);
                shadowGrad.addColorStop(0, `rgba(20, 15, 10, ${0.7 * shadowProgress})`);
                shadowGrad.addColorStop(0.5, `rgba(40, 30, 25, ${0.5 * shadowProgress})`);
                shadowGrad.addColorStop(1, 'rgba(60, 45, 35, 0)');
                ctx.fillStyle = shadowGrad;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, shadowSize * pulse, shadowSize * 0.5 * pulse, 0, 0, Math.PI * 2);
                ctx.fill();

                // Warning ring
                ctx.strokeStyle = `rgba(100, 70, 50, ${shadowProgress * 0.6})`;
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.range * shadowProgress, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // IMPACT PHASE: Shockwave and cracks
            if (this.life <= 40) {
                const impactProgress = 1 - (this.life / 40);
                const alpha = this.life > 10 ? 1 : this.life / 10;

                // Flash on impact start
                if (this.life > 35) {
                    const flashAlpha = (this.life - 35) / 5;
                    ctx.fillStyle = `rgba(255, 250, 240, ${flashAlpha * 0.8})`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.range * flashAlpha, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Shockwave rings
                for (let ring = 0; ring < 4; ring++) {
                    const ringProgress = Math.min(1, impactProgress * 2 + ring * 0.1);
                    const ringRadius = this.range * ringProgress * (1 + ring * 0.3);
                    const ringAlpha = alpha * (1 - ringProgress) * (1 - ring * 0.2);

                    if (ringAlpha > 0) {
                        ctx.strokeStyle = `rgba(93, 64, 55, ${ringAlpha})`;
                        ctx.lineWidth = 8 - ring * 1.5;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }

                // Impact crater
                if (this.life > 20) {
                    const craterGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.range * 0.5);
                    craterGrad.addColorStop(0, `rgba(30, 20, 15, ${alpha * 0.6})`);
                    craterGrad.addColorStop(1, 'rgba(60, 45, 35, 0)');
                    ctx.fillStyle = craterGrad;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.range * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Radiating cracks
                ctx.strokeStyle = `rgba(40, 30, 25, ${alpha * 0.7})`;
                ctx.lineWidth = 3;
                for (let i = 0; i < 10; i++) {
                    const a = (i / 10) * Math.PI * 2;
                    const len = this.range * impactProgress * 1.3;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + Math.cos(a) * len, this.y + Math.sin(a) * len);
                    ctx.stroke();
                }
            }

            ctx.restore();
        };

        STATE.Entities.push(impactFX);
        return;
    }

    // OCEAN: Realistic waves with depth and motion
    if (k.name === 'Ocean') {
        this.abilityCD = k.cd;
        const range = k.range || 220;
        const px = this.x, py = this.y;
        const damage = k.damage;
        const kb = k.knockback || 15;

        // Damage and knockback
        STATE.Entities.forEach(e => {
            if (e instanceof Enemy && !e.dead) {
                const dx = e.x - px;
                const dy = e.y - py;
                const dist = Math.hypot(dx, dy);
                if (dist < range) {
                    e.takeDamage(damage);
                    if (dist > 0) {
                        e.x += (dx / dist) * kb;
                        e.y += (dy / dist) * kb;
                    }
                }
            }
        });

        // Screen shake for impact
        screenShake(5, 12);

        const waveFX = new Entity(px, py, range, '#4682b4');
        waveFX.life = 55;
        waveFX.totalLife = 55;
        waveFX.range = range;

        waveFX.update = function () {
            this.life--;

            // Spray particles
            if (this.life > 35) {
                for (let i = 0; i < 5; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const progress = 1 - this.life / this.totalLife;
                    const d = this.range * progress + Math.random() * 20;
                    const spray = new Particle(
                        this.x + Math.cos(a) * d,
                        this.y + Math.sin(a) * d,
                        Math.random() * 3 + 1,
                        Math.random() > 0.3 ? '#87ceeb' : '#fff',
                        'normal'
                    );
                    spray.vx = Math.cos(a) * 2;
                    spray.vy = -Math.random() * 4 - 2;
                    spray.life = 12;
                    STATE.Entities.push(spray);
                }
            }

            if (this.life <= 0) this.dead = true;
        };

        waveFX.draw = function (ctx) {
            const progress = 1 - (this.life / this.totalLife);
            const alpha = this.life > 12 ? 1 : this.life / 12;

            ctx.save();

            // Deep water base layer
            const waterGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.range * progress);
            waterGrad.addColorStop(0, `rgba(25, 65, 120, ${alpha * 0.4})`);
            waterGrad.addColorStop(0.6, `rgba(70, 130, 180, ${alpha * 0.25})`);
            waterGrad.addColorStop(1, 'rgba(135, 206, 235, 0)');
            ctx.fillStyle = waterGrad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range * progress, 0, Math.PI * 2);
            ctx.fill();

            // Multiple wave crests (curved lines with thickness)
            for (let wave = 0; wave < 5; wave++) {
                const waveDelay = wave * 0.12;
                const waveProgress = Math.max(0, Math.min(1, (progress - waveDelay) * 1.4));
                if (waveProgress <= 0) continue;

                const waveRadius = this.range * waveProgress;
                const waveAlpha = alpha * (1 - waveProgress * 0.8);

                // Wave crest - white foam on top
                ctx.strokeStyle = `rgba(255, 255, 255, ${waveAlpha * 0.9})`;
                ctx.lineWidth = 4 - wave * 0.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, waveRadius, 0, Math.PI * 2);
                ctx.stroke();

                // Wave body - translucent blue
                ctx.strokeStyle = `rgba(100, 180, 220, ${waveAlpha * 0.5})`;
                ctx.lineWidth = 12 - wave * 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, waveRadius * 0.92, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Foam clusters along wave fronts
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
            for (let i = 0; i < 20; i++) {
                const a = (i / 20) * Math.PI * 2 + Math.sin(this.life * 0.1 + i) * 0.2;
                const d = this.range * progress * (0.85 + Math.sin(i * 2.3) * 0.1);
                const size = 2 + Math.sin(i * 1.7) * 1.5;
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(a) * d, this.y + Math.sin(a) * d, size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Central splash burst
            if (this.life > 45) {
                const burstAlpha = (this.life - 45) / 10;
                ctx.fillStyle = `rgba(255, 255, 255, ${burstAlpha * 0.7})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 30 * burstAlpha, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        };

        STATE.Entities.push(waveFX);
        return;
    }

    // FOREST: Tree shadows + roots wrap around enemies
    if (k.name === 'Forest') {
        this.abilityCD = k.cd;
        const range = k.range || 180;
        const px = this.x, py = this.y;
        const damage = k.damage;
        const rootDur = k.root || 90;

        const forestFX = new Entity(px, py, range, '#228b22');
        forestFX.life = 360;
        forestFX.totalLife = 360;
        forestFX.range = range;
        forestFX.damage = damage;
        forestFX.rootDur = rootDur;
        forestFX.damageDone = false;
        forestFX.enemyRoots = []; // Track enemies with roots
        forestFX.tickTimer = 0;
        forestFX.tickRate = 60; // Damage every 60 frames

        forestFX.update = function () {
            this.life--;
            this.tickTimer++;

            // Initial damage and root (at start)
            if (this.life === 355 && !this.damageDone) {
                this.damageDone = true;
                STATE.Entities.forEach(e => {
                    if (e instanceof Enemy && !e.dead) {
                        const dist = Math.hypot(e.x - this.x, e.y - this.y);
                        if (dist < this.range) {
                            e.takeDamage(this.damage);
                            e.slowTimer = Math.max(e.slowTimer || 0, this.rootDur);
                            e.slowMult = 0.3;
                            this.enemyRoots.push({ x: e.x, y: e.y, enemy: e });
                        }
                    }
                });
            }

            // Continuous tick damage (every 60 frames)
            if (this.tickTimer >= this.tickRate) {
                this.tickTimer = 0;
                STATE.Entities.forEach(e => {
                    if (e instanceof Enemy && !e.dead) {
                        const dist = Math.hypot(e.x - this.x, e.y - this.y);
                        if (dist < this.range) {
                            e.takeDamage(this.damage * 0.5); // Half damage per tick
                            e.slowTimer = Math.max(e.slowTimer || 0, 60);
                            e.slowMult = 0.3;
                            // Add new enemies to root tracking
                            if (!this.enemyRoots.find(r => r.enemy === e)) {
                                this.enemyRoots.push({ x: e.x, y: e.y, enemy: e });
                            }
                        }
                    }
                });
            }

            // Update enemy positions for root tracking
            this.enemyRoots = this.enemyRoots.filter(r => r.enemy && !r.enemy.dead);
            this.enemyRoots.forEach(r => {
                r.x = r.enemy.x;
                r.y = r.enemy.y;
            });

            if (this.life <= 0) this.dead = true;
        };

        forestFX.draw = function (ctx) {
            const progress = 1 - (this.life / this.totalLife);
            const alpha = this.life > 10 ? 1 : this.life / 10;

            ctx.save();

            // Dark forest shadow
            const shadowGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.range);
            shadowGrad.addColorStop(0, `rgba(15, 35, 15, ${alpha * 0.6})`);
            shadowGrad.addColorStop(0.6, `rgba(25, 50, 25, ${alpha * 0.4})`);
            shadowGrad.addColorStop(1, 'rgba(34, 70, 34, 0)');
            ctx.fillStyle = shadowGrad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range * Math.min(1, progress * 1.5), 0, Math.PI * 2);
            ctx.fill();

            // Tree shadows
            ctx.fillStyle = `rgba(15, 30, 15, ${alpha * 0.7})`;
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2 + 0.2;
                const treeD = this.range * 0.65;
                const treeX = this.x + Math.cos(a) * treeD;
                const treeY = this.y + Math.sin(a) * treeD;
                const treeH = 45 + Math.sin(i * 1.5) * 15;

                ctx.beginPath();
                ctx.moveTo(treeX, treeY);
                ctx.lineTo(treeX - 15, treeY + treeH * 0.25);
                ctx.lineTo(treeX, treeY - treeH);
                ctx.lineTo(treeX + 15, treeY + treeH * 0.25);
                ctx.closePath();
                ctx.fill();
            }

            // ROOTS WRAPPING AROUND ENEMIES
            ctx.strokeStyle = `rgba(45, 80, 22, ${alpha * 0.9})`;
            ctx.lineWidth = 3;
            this.enemyRoots.forEach(target => {
                // Draw multiple root tendrils from center to enemy, wrapping around them
                for (let r = 0; r < 4; r++) {
                    const offset = (r / 4) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);

                    // Curvy path to enemy
                    const dx = target.x - this.x;
                    const dy = target.y - this.y;
                    const dist = Math.hypot(dx, dy);
                    const cp1x = this.x + dx * 0.3 + Math.cos(offset) * 30;
                    const cp1y = this.y + dy * 0.3 + Math.sin(offset) * 30;
                    const cp2x = this.x + dx * 0.7 + Math.cos(offset + 1) * 20;
                    const cp2y = this.y + dy * 0.7 + Math.sin(offset + 1) * 20;
                    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, target.x, target.y);
                    ctx.stroke();
                }

                // Root coil around enemy
                ctx.strokeStyle = `rgba(35, 65, 18, ${alpha})`;
                ctx.lineWidth = 2;
                for (let c = 0; c < 3; c++) {
                    const coilR = 12 + c * 4;
                    ctx.beginPath();
                    ctx.arc(target.x, target.y, coilR, c * 0.5, Math.PI * 1.5 + c * 0.5);
                    ctx.stroke();
                }
            });

            ctx.restore();
        };

        STATE.Entities.push(forestFX);
        return;
    }

    // WOODS: Dark persistent zone with continuous DoT
    if (k.name === 'Woods') {
        this.abilityCD = k.cd;
        const range = k.range || 160;
        const px = this.x, py = this.y;
        const damage = k.damage;
        const duration = k.duration || 360;
        const tickRate = k.tick || 30;

        const woodsFX = new Entity(px, py, range, '#006400');
        woodsFX.life = duration;
        woodsFX.totalLife = duration;
        woodsFX.range = range;
        woodsFX.damage = damage;
        woodsFX.tickRate = tickRate;
        woodsFX.tickTimer = 0;

        woodsFX.update = function () {
            this.life--;
            this.tickTimer++;

            if (this.tickTimer >= this.tickRate) {
                this.tickTimer = 0;
                STATE.Entities.forEach(e => {
                    if (e instanceof Enemy && !e.dead) {
                        const dist = Math.hypot(e.x - this.x, e.y - this.y);
                        if (dist < this.range) {
                            e.takeDamage(this.damage);
                        }
                    }
                });
            }

            // Floating leaves
            if (STATE.Frame % 10 === 0) {
                const leaf = new Particle(
                    this.x + (Math.random() - 0.5) * this.range * 1.4,
                    this.y - 20,
                    Math.random() * 4 + 2,
                    ['#1a5c1a', '#2e7d32', '#388e3c'][Math.floor(Math.random() * 3)],
                    'normal'
                );
                leaf.vx = (Math.random() - 0.5) * 1.5;
                leaf.vy = Math.random() + 0.5;
                leaf.life = 25;
                STATE.Entities.push(leaf);
            }

            if (this.life <= 0) this.dead = true;
        };

        woodsFX.draw = function (ctx) {
            const alpha = Math.min(0.85, this.life / 40);

            ctx.save();

            // Darker, more prominent shadow zone
            const zoneGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.range);
            zoneGrad.addColorStop(0, `rgba(0, 35, 0, ${alpha * 0.55})`);
            zoneGrad.addColorStop(0.5, `rgba(0, 55, 0, ${alpha * 0.45})`);
            zoneGrad.addColorStop(0.85, `rgba(0, 70, 0, ${alpha * 0.25})`);
            zoneGrad.addColorStop(1, 'rgba(0, 80, 0, 0)');
            ctx.fillStyle = zoneGrad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fill();

            // Tree shadows (sparse)
            ctx.fillStyle = `rgba(0, 30, 0, ${alpha * 0.65})`;
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2 + Math.sin(this.life * 0.015) * 0.1;
                const treeD = this.range * (0.35 + i * 0.12);
                const treeX = this.x + Math.cos(a) * treeD;
                const treeY = this.y + Math.sin(a) * treeD;
                const treeH = 35 + i * 6;

                ctx.beginPath();
                ctx.moveTo(treeX, treeY);
                ctx.lineTo(treeX - 10, treeY);
                ctx.lineTo(treeX, treeY - treeH);
                ctx.lineTo(treeX + 10, treeY);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        };

        STATE.Entities.push(woodsFX);
        return;
    }

    // STAR: 7 random meteors (Accelerating Gravity, Motion Blur)
    if (k.name === 'Star') {
        this.abilityCD = k.cd;
        const damage = k.damage || 95;
        const radius = k.radius || 110;
        const count = k.count || 7;

        for (let i = 0; i < count; i++) {
            const mx = 100 + Math.random() * (CONFIG.ScreenWidth - 200);
            const my = 100 + Math.random() * (CONFIG.ScreenHeight - 200);

            const meteor = new Entity(mx, my, radius, '#f1c40f');
            meteor.damage = damage;
            meteor.radius = radius;

            meteor.phase = 'warning';
            meteor.timer = 20 + i * 8;
            meteor.maxTimer = meteor.timer;

            // Diagonal: Top-Left to Bottom-Right
            const angle = Math.PI * 0.25;
            const dist = 800; // Increased distance for more speed
            meteor.targetX = mx;
            meteor.targetY = my;

            // Start position
            meteor.startX = mx - Math.cos(angle) * dist;
            meteor.startY = my - Math.sin(angle) * dist;
            meteor.x = meteor.startX;
            meteor.y = meteor.startY;
            meteor.angle = angle;

            // Movement progress
            meteor.fallT = 0;

            meteor.textureSeed = Math.random();
            meteor.shapeSeed = [];
            const verts = 5 + Math.floor(Math.random() * 3);
            for (let v = 0; v < verts; v++) meteor.shapeSeed.push(0.7 + Math.random() * 0.6);

            meteor.update = function () {
                if (this.phase === 'warning') {
                    this.timer--;
                    if (this.timer <= 0) {
                        this.phase = 'falling';
                    }
                }
                else if (this.phase === 'falling') {
                    // Accelerating Gravity (Ease-In Quad)
                    // t goes from 0 to 1
                    this.fallT += 0.04; // Adjust this for duration (approx 25 frames)
                    if (this.fallT > 1) this.fallT = 1;

                    const t = this.fallT * this.fallT; // Quadratic Ease-In

                    this.x = this.startX + (this.targetX - this.startX) * t;
                    this.y = this.startY + (this.targetY - this.startY) * t;

                    // Cool White Trail Particles (Motion Blurred)
                    // Spawn more frequent as it speeds up
                    if (Math.random() > 0.1) {
                        const gp = new Particle(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30, Math.random() * 2 + 1, '#fff', 'normal');
                        gp.life = 10;
                        gp.vx = (Math.random() - 0.5) * 2;
                        gp.vy = (Math.random() - 0.5) * 2;
                        gp.color = ['#ffffff', '#f0faff', '#dcdcdc'][Math.floor(Math.random() * 3)];

                        // Motion blur stretch
                        gp.stretch = true;
                        gp.angle = this.angle;

                        gp.update = function () {
                            this.x += this.vx; this.y += this.vy;
                            this.life--;
                            if (this.life <= 0) this.dead = true;
                        }
                        gp.draw = function (ctx) {
                            ctx.save();
                            ctx.translate(this.x, this.y);
                            ctx.rotate(this.angle);
                            ctx.scale(3, 0.5); // Stretch
                            ctx.fillStyle = this.color;
                            ctx.beginPath();
                            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        }
                        STATE.Entities.push(gp);
                    }

                    if (this.fallT >= 1) {
                        this.phase = 'impact';
                        this.timer = 15;
                        screenShake(16, 16); // Hard impact

                        STATE.Entities.forEach(e => {
                            if (e instanceof Enemy && !e.dead) {
                                if (Math.hypot(e.x - this.x, e.y - this.y) < this.radius) {
                                    e.takeDamage(this.damage);
                                }
                            }
                        });

                        // Burst of Shards + Cool White Sparks (EXTREME OVERKILL)
                        for (let d = 0; d < 200; d++) { // Extreme count
                            const isSpark = Math.random() > 0.2; // Mostly sparks
                            const size = isSpark ? 1 + Math.random() * 4 : 2 + Math.random() * 5;

                            let color;
                            if (isSpark) {
                                // Blinding white scales
                                color = ['#ffffff', '#ffffff', '#e3f2fd', '#bbdefb', '#80d8ff'][Math.floor(Math.random() * 5)];
                            } else {
                                color = '#222';
                            }

                            const p = new Particle(this.x, this.y, size, color, 'normal');
                            const ang = Math.random() * 6.28;
                            // Extreme speed for "tarinai" fix
                            const spd = Math.random() * 35 + 10;

                            if (isSpark) {
                                p.vx = Math.cos(ang) * spd;
                                p.vy = Math.sin(ang) * spd;
                                p.life = 30 + Math.random() * 25;
                                p.update = function () {
                                    this.x += this.vx; this.y += this.vy;
                                    this.vx *= 0.8; this.vy *= 0.8; // High drag for snappy burst
                                    this.life--;
                                    if (this.life <= 0) this.dead = true;
                                }
                            } else {
                                p.vx = Math.cos(ang) * spd * 0.9;
                                p.vy = Math.sin(ang) * spd * 0.9 - 8; // Violence
                                p.life = 50;
                                p.rotation = Math.random() * Math.PI;
                                p.rotSpeed = (Math.random() - 0.5) * 0.8;
                                p.update = function () {
                                    this.x += this.vx; this.y += this.vy;
                                    this.vy += 0.6;
                                    this.rotation += this.rotSpeed;
                                    this.life--;
                                    if (this.life <= 0) this.dead = true;
                                }
                            }
                            STATE.Entities.push(p);
                        }
                    }
                }
                else if (this.phase === 'impact') {
                    this.timer--;
                    if (this.timer <= 0) this.dead = true;
                }
            };

            meteor.draw = function (ctx) {
                ctx.save();

                if (this.phase === 'warning') {
                    const progress = 1 - (this.timer / this.maxTimer);
                    // Fade out warning as it falls so it doesn't distract from impact
                    const alpha = (this.timer > 0) ? 0.3 * progress : 0;
                    ctx.translate(this.targetX, this.targetY);
                    ctx.scale(1, 0.5);
                    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radius * (0.2 + progress * 0.5), 0, Math.PI * 2);
                    ctx.fill();
                }
                else if (this.phase === 'falling') {
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.angle);

                    // 1. Motion Blur Trail
                    // Instead of a gradient cone, just use the particles + a very faint streaks
                    ctx.globalAlpha = 0.5;
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(-50, -10); ctx.lineTo(0, -5);
                    ctx.moveTo(-70, 10); ctx.lineTo(0, 5);
                    ctx.moveTo(-100, 0); ctx.lineTo(10, 0);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;

                    // 2. Meteor Body (Jagged Shard)
                    ctx.rotate(STATE.Frame * 0.2);

                    const rockGrad = ctx.createLinearGradient(-10, -10, 10, 10);
                    rockGrad.addColorStop(0, '#ccc');
                    rockGrad.addColorStop(0.5, '#444');
                    rockGrad.addColorStop(1, '#000');

                    ctx.fillStyle = rockGrad;
                    ctx.beginPath();
                    const verts = this.shapeSeed.length;
                    for (let v = 0; v < verts; v++) {
                        const ang = (v / verts) * Math.PI * 2;
                        const r = 20 * this.shapeSeed[v];
                        if (v === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
                        else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
                    }
                    ctx.closePath();
                    ctx.fill();

                    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                else if (this.phase === 'impact') {
                    // No drawn shapes, purely particles
                    // Maybe a tiny localized flash just to pop
                    const t = 1 - this.timer / 15;
                    if (t < 0.1) {
                        ctx.globalCompositeOperation = 'lighter';
                        ctx.fillStyle = `rgba(255, 255, 255, ${0.8})`;
                        ctx.beginPath();
                        ctx.arc(0, 0, 20, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalCompositeOperation = 'source-over';
                    }
                }

                ctx.restore();
            };

            STATE.Entities.push(meteor);
        }
        return;
    }

    // BREAK: Red shockwave + Vulnerability
    if (k.name === 'Break') {
        this.abilityCD = k.cd;
        const duration = k.duration || 240;
        const vulnerable = k.vulnerable || 1.25;
        const px = this.x, py = this.y;
        const range = 280;

        // Apply debuff
        STATE.Entities.forEach(e => {
            if (e instanceof Enemy && !e.dead) {
                if (Math.hypot(e.x - px, e.y - py) < range) {
                    e.vulnerableTime = duration;
                    e.vulnerableMult = vulnerable;
                }
            }
        });

        // Effect
        const breakFX = new Entity(px, py, range, '#c00');
        breakFX.life = 30;
        breakFX.maxLife = 30;

        breakFX.update = function () {
            this.life--;
            if (this.life <= 0) this.dead = true;
        };

        breakFX.draw = function (ctx) {
            const p = 1 - this.life / this.maxLife;
            const a = this.life / this.maxLife;

            ctx.save();
            ctx.translate(this.x, this.y);

            // Expanding red Shockwave
            ctx.strokeStyle = `rgba(220, 20, 60, ${a})`;
            ctx.lineWidth = 10 * (1 - p) + 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.r * p, 0, Math.PI * 2);
            ctx.stroke();

            // Core flash
            if (this.life > 20) {
                ctx.fillStyle = `rgba(255, 50, 50, ${(this.life - 20) / 10})`;
                ctx.beginPath();
                ctx.arc(0, 0, 100 * p, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        };
        STATE.Entities.push(breakFX);
        screenShake(8, 8);
        return;
    }

    // SLASH: Horizontal Fast Ink Cut (Thinner & Faster)
    if (k.name === 'Slash') {
        this.abilityCD = k.cd;
        const damageMult = k.damage_mult || 2.2;
        const radius = k.radius || 220;

        // Find nearest
        let nearest = null;
        let dist = Infinity;
        STATE.Entities.forEach(e => {
            if (e instanceof Enemy && !e.dead) {
                const d = Math.hypot(e.x - this.x, e.y - this.y);
                if (d < radius && d < dist) {
                    dist = d;
                    nearest = e;
                }
            }
        });

        if (nearest) {
            const baseDmg = CONFIG.Kanji['斬'] && CONFIG.Kanji['斬'].damage ? CONFIG.Kanji['斬'].damage : 50;
            nearest.takeDamage(baseDmg * damageMult);

            // Ink Slash Entity (Very Fast)
            const slashFX = new Entity(nearest.x, nearest.y, 0);
            slashFX.life = 7; // Even Faster (was 10)

            slashFX.update = function () {
                this.life--;
                if (this.life <= 0) this.dead = true;
            };

            slashFX.draw = function (ctx) {
                const t = 1 - this.life / 7;
                const a = this.life / 7;

                ctx.save();
                ctx.translate(this.x, this.y);

                // 1. Ink Stroke (Thinner)
                ctx.globalAlpha = a * 0.9;
                ctx.fillStyle = '#050505';

                ctx.beginPath();
                // Much thinner crescent
                ctx.moveTo(-220, 0);
                // Control points closer to 0 Y
                ctx.quadraticCurveTo(0, -15, 220, 0);
                ctx.quadraticCurveTo(0, 15, -220, 0);
                ctx.fill();

                // 2. White Core (Razor thin)
                ctx.globalAlpha = a;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.moveTo(-210, 0);
                ctx.quadraticCurveTo(0, -3, 210, 0);
                ctx.quadraticCurveTo(0, 3, -210, 0);
                ctx.fill();

                // 3. Ink Splatters (Horizontal scattered)
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const offset = (Math.random() - 0.5) * 400;
                    ctx.beginPath();
                    // Very flat splatters
                    ctx.moveTo(offset, 0);
                    ctx.lineTo(offset + (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 15);
                    ctx.stroke();
                }

                ctx.restore();
            };
            STATE.Entities.push(slashFX);

            // Blood Spray (Fast & Low)
            for (let b = 0; b < 20; b++) {
                const blood = new Particle(
                    nearest.x, nearest.y,
                    2 + Math.random() * 3,
                    ['#800', '#a00'][Math.floor(Math.random() * 2)],
                    'normal'
                );
                blood.vx = (Math.random() - 0.5) * 25; // Very wide spread
                blood.vy = (Math.random() - 0.5) * 5;  // Flat spray
                blood.life = 20;
                STATE.Entities.push(blood);
            }
        }
        return;
    }

    // Call original for other abilities
    if (_originalPerformAbility) {
        _originalPerformAbility.call(this, angle, k);
    }
};

// Set fxType when creating projectiles
const _origCreateProjectile = Projectile;
window.Projectile = function (x, y, angle, speed, size, color, dmg) {
    const p = new _origCreateProjectile(x, y, angle, speed, size, color, dmg);
    return p;
};
window.Projectile.prototype = _origCreateProjectile.prototype;

// Hook into performAbility to set fxType on projectiles
const _performAbilityForFxType = Player.prototype.performAbility;
Player.prototype.performAbility = function (angle, k) {
    const preCount = STATE.Entities.length;
    _performAbilityForFxType.call(this, angle, k);

    // Tag new projectiles with fxType
    for (let i = preCount; i < STATE.Entities.length; i++) {
        const e = STATE.Entities[i];
        if (e instanceof _origCreateProjectile) {
            if (k.name === 'Fire') e.fxType = 'fire';
            else if (k.name === 'Water') e.fxType = 'water';
            else if (k.name === 'Ice') e.fxType = 'ice';
            else if (k.name === 'Earth') e.fxType = 'rock';
            else if (k.name === 'Wind') e.fxType = 'wind';
            else if (k.name === 'Thunder') e.fxType = 'lightning';
            else if (k.name === 'Light') e.fxType = 'light';

            // Copy ability properties
            if (k.burn) e.burn = k.burn;
            if (k.slow) { e.slow = k.slow; e.slowTime = k.slowTime; }
            if (k.chain) e.chain = k.chain;
            if (k.pierce) e.pierce = k.pierce;
            if (k.maxHitsPerShot) e.maxHits = k.maxHitsPerShot;
        }
    }
};

// ==========================================
// V10 PHASE 3: BOSS WARNING SYSTEM
// ==========================================

// Track if warning has been shown
let bossWarningShown = false;
let lastStage = -1;

// Use setInterval to check for boss warning (runs every 100ms)
setInterval(function () {
    // Check for boss warning (3 seconds before spawn)
    if (STATE.Screen === 'game' && !STATE.BossSpawned && !bossWarningShown) {
        const bossTime = CONFIG.BossSpawnTime[STATE.Stage];
        const warningTime = bossTime - 3; // 3 seconds before

        if (STATE.Time >= warningTime && STATE.Time < bossTime) {
            bossWarningShown = true;
            showBossWarning();
        }
    }

    // Reset warning flag when stage changes
    if (STATE.Stage !== lastStage) {
        lastStage = STATE.Stage;
        bossWarningShown = false;
    }
}, 100);

function showBossWarning() {
    // Create warning overlay
    const warning = document.createElement('div');
    warning.id = 'boss-warning-overlay';
    warning.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;
        z-index: 1000;
    `;

    // Warning text
    const text = document.createElement('div');
    text.innerHTML = '強敵出現';
    text.style.cssText = `
        font-size: 72px;
        font-weight: bold;
        color: #ff0000;
        text-shadow: 
            0 0 20px #ff0000,
            0 0 40px #ff0000,
            0 0 60px #ff4444,
            4px 4px 0 #000,
            -4px -4px 0 #000,
            4px -4px 0 #000,
            -4px 4px 0 #000;
        opacity: 0;
        transform: scale(2);
        animation: bossWarningAnim 3s ease-out forwards;
        letter-spacing: 20px;
    `;

    warning.appendChild(text);
    document.body.appendChild(warning);

    // Add animation styles
    if (!document.getElementById('boss-warning-styles')) {
        const style = document.createElement('style');
        style.id = 'boss-warning-styles';
        style.textContent = `
            @keyframes bossWarningAnim {
                0% {
                    opacity: 0;
                    transform: scale(2);
                }
                15% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 1;
                    transform: scale(1);
                }
                100% {
                    opacity: 0;
                    transform: scale(0.8);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Screen flash effect
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(255, 0, 0, 0.3);
        pointer-events: none;
        z-index: 999;
        animation: flashAnim 0.5s ease-out;
    `;
    document.body.appendChild(flash);

    if (!document.getElementById('flash-styles')) {
        const style = document.createElement('style');
        style.id = 'flash-styles';
        style.textContent = `
            @keyframes flashAnim {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Remove after animation
    setTimeout(() => {
        warning.remove();
        flash.remove();
    }, 3500);

    // Screen shake
    screenShake(5, 30);
}

// ==========================================
// V10 PHASE 4: AURA EFFECTS (Iron/Gold) & FREEZE VISUAL
// ==========================================

// Override Enemy.draw to show frozen effect when slowed
const _originalEnemyDraw = Enemy.prototype.draw;
Enemy.prototype.draw = function (ctx) {
    // Call original first
    if (_originalEnemyDraw) {
        _originalEnemyDraw.call(this, ctx);
    }

    // FROZEN VISUAL: Blue ice overlay when slowed
    if (this.slowTimer && this.slowTimer > 0) {
        ctx.save();

        // Ice crystals around enemy
        const numCrystals = 6;
        for (let i = 0; i < numCrystals; i++) {
            const angle = (i / numCrystals) * Math.PI * 2 + STATE.Frame * 0.02;
            const dist = this.r + 5;
            const cx = this.x + Math.cos(angle) * dist;
            const cy = this.y + Math.sin(angle) * dist;

            ctx.fillStyle = 'rgba(180, 220, 255, 0.7)';
            ctx.beginPath();
            // Diamond shape
            ctx.moveTo(cx, cy - 4);
            ctx.lineTo(cx + 3, cy);
            ctx.lineTo(cx, cy + 4);
            ctx.lineTo(cx - 3, cy);
            ctx.closePath();
            ctx.fill();
        }

        // Blue frost overlay on enemy
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#aef';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // BREAK VISUAL: Red pulsing aura when vulnerable
    if ((this.vulnerableTime && this.vulnerableTime > 0) || (this.vulnerableTimer && this.vulnerableTimer > 0)) {
        ctx.save();

        const pulse = 1 + Math.sin(STATE.Frame * 0.15) * 0.25;
        const auraSize = (this.r + 12) * pulse;

        // Red glow aura
        const auraGrad = ctx.createRadialGradient(this.x, this.y, this.r * 0.5, this.x, this.y, auraSize);
        auraGrad.addColorStop(0, 'rgba(139, 0, 0, 0)');
        auraGrad.addColorStop(0.6, 'rgba(180, 0, 0, 0.35)');
        auraGrad.addColorStop(1, 'rgba(255, 50, 50, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, auraSize, 0, Math.PI * 2);
        ctx.fill();

        // Crack marks on enemy
        ctx.strokeStyle = 'rgba(139, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        for (let c = 0; c < 4; c++) {
            const ca = (c / 4) * Math.PI * 2 + STATE.Frame * 0.01;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(ca) * (this.r + 8), this.y + Math.sin(ca) * (this.r + 8));
            ctx.stroke();
        }

        ctx.restore();
    }
};

// Override Player.draw to add Iron/Gold aura
const _originalPlayerDraw = Player.prototype.draw;
Player.prototype.draw = function (ctx) {
    const k = CONFIG.Kanji[STATE.Kanji];

    // IRON: Silver metallic shimmer (NO circle)
    if (k && k.name === 'Iron') {
        ctx.save();

        // Metallic shimmer particles only
        if (STATE.Frame % 6 === 0) {
            const angle = Math.random() * Math.PI * 2;
            const dist = this.r + Math.random() * 8;
            const spark = new Particle(
                this.x + Math.cos(angle) * dist,
                this.y + Math.sin(angle) * dist,
                Math.random() * 3 + 1,
                ['#e0e0e0', '#bdbdbd', '#fff', '#c0c0c0'][Math.floor(Math.random() * 4)],
                'normal'
            );
            spark.life = 12;
            spark.vy = -Math.random() * 1.5 - 0.5;
            STATE.Entities.push(spark);
        }

        // Soft silver glow (no outline)
        const silverGlow = ctx.createRadialGradient(this.x, this.y, this.r * 0.5, this.x, this.y, this.r + 15);
        silverGlow.addColorStop(0, 'rgba(192, 192, 192, 0.15)');
        silverGlow.addColorStop(1, 'rgba(192, 192, 192, 0)');
        ctx.fillStyle = silverGlow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r + 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // GOLD: Soft golden glow only (NO particles)
    if (this.buffTime && this.buffTime > 0 && k && k.name === 'Gold') {
        ctx.save();

        // Soft golden glow only - no particles
        const glowGrad = ctx.createRadialGradient(this.x, this.y, this.r * 0.3, this.x, this.y, this.r + 25);
        glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.25)');
        glowGrad.addColorStop(0.5, 'rgba(255, 200, 0, 0.15)');
        glowGrad.addColorStop(1, 'rgba(255, 180, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r + 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Call original draw
    if (_originalPlayerDraw) {
        _originalPlayerDraw.call(this, ctx);
    }
};

// Add screen shake when Earth projectile is fired
const _performAbilityEarthShake = Player.prototype.performAbility;
Player.prototype.performAbility = function (angle, k) {
    // Earth projectile: shake on fire
    if (k.name === 'Earth') {
        screenShake(4, 8);
    }

    // Call the existing chain
    if (_performAbilityEarthShake) {
        _performAbilityEarthShake.call(this, angle, k);
    }
};
