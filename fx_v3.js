
// ========================================
// === V3 PARTICLE SYSTEM & FX LIBRARY ===
// ========================================

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
        } else if (this.type === 'ice') {
            // シャープな氷晶（ひし形）
            ctx.fillStyle = '#aaddff';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#88ccff';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.r);
            ctx.lineTo(this.x + this.r * 0.6, this.y);
            ctx.lineTo(this.x, this.y + this.r);
            ctx.lineTo(this.x - this.r * 0.6, this.y);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'wind') {
            // 小さく速い刃（半透明弧）
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * 2, 0, Math.PI * 0.7);
            ctx.stroke();
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

// ========================================
// === 最高にかっこいいFXライブラリ V3 ===
// ========================================
const FX = {
    // === 火 (軽量・高速パーティクル) ===
    fireTrail: (x, y) => {
        const p = new Particle(x, y, 4, '#ff6600', 'fire');
        p.vy = -3;
        p.life = 12;
        STATE.Entities.push(p);
    },

    fireImpact: (x, y) => {
        screenShake(3, 5);
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const p = new Particle(x, y, 5, '#ff4400', 'fire');
            p.vx = Math.cos(a) * 5;
            p.vy = Math.sin(a) * 5;
            p.life = 12;
            STATE.Entities.push(p);
        }
    },

    // === 水 (泡) ===
    waterTrail: (x, y) => {
        const p = new Particle(x, y, 3, '#66aaff', 'bubble');
        p.life = 15;
        STATE.Entities.push(p);
    },

    waterSplash: (x, y) => {
        for (let i = 0; i < 5; i++) {
            const p = new Particle(x, y, 4, '#4488ff', 'bubble');
            p.vx = (Math.random() - 0.5) * 6;
            p.vy = -Math.random() * 5;
            p.life = 20;
            STATE.Entities.push(p);
        }
    },

    // === 氷 (シャープな氷晶) ===
    iceTrail: (x, y) => {
        const p = new Particle(x, y, 2, '#aaddff', 'ice');
        p.life = 10;
        STATE.Entities.push(p);
    },

    iceBurst: (x, y) => {
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const p = new Particle(x, y, 4, '#88ccff', 'ice');
            p.vx = Math.cos(a) * 7;
            p.vy = Math.sin(a) * 7;
            p.life = 15;
            STATE.Entities.push(p);
        }
    },

    // === 土 (岩片) ===
    earthTrail: (x, y) => {
        const p = new Particle(x, y, 4, '#8b5a2b', 'rock');
        p.vy = 2;
        p.life = 12;
        STATE.Entities.push(p);
    },

    earthImpact: (x, y) => {
        screenShake(6, 10);
        for (let i = 0; i < 8; i++) {
            const p = new Particle(x, y, 6 + Math.random() * 4, '#6b4423', 'rock');
            p.vx = (Math.random() - 0.5) * 10;
            p.vy = -Math.random() * 8;
            p.life = 25;
            STATE.Entities.push(p);
        }
    },

    // === 風 (小さく速い刃) ===
    windTrail: (x, y) => {
        const p = new Particle(x, y, 2, 'rgba(176, 224, 230, 0.6)', 'wind');
        p.life = 5;
        STATE.Entities.push(p);
    },

    windSlash: (x, y) => {
        for (let i = 0; i < 3; i++) {
            const p = new Particle(x, y, 2, '#b0e0e6', 'wind');
            p.vx = (Math.random() - 0.5) * 12;
            p.vy = (Math.random() - 0.5) * 12;
            p.life = 8;
            STATE.Entities.push(p);
        }
    },

    // === 雷 (稲妻+連鎖) ===
    lightning: (x1, y1, x2, y2) => {
        const bolt = new Entity(x1, y1, 0, '#aa88ff');
        bolt.x2 = x2;
        bolt.y2 = y2;
        bolt.life = 5;
        bolt.segments = [];

        const dx = x2 - x1, dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(2, Math.floor(dist / 40));

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            bolt.segments.push({
                x: x1 + dx * t + (i > 0 && i < steps ? (Math.random() - 0.5) * 25 : 0),
                y: y1 + dy * t + (i > 0 && i < steps ? (Math.random() - 0.5) * 25 : 0)
            });
        }

        bolt.draw = function (ctx) {
            ctx.save();
            ctx.globalAlpha = this.life / 5;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#8866ff';
            ctx.beginPath();
            ctx.moveTo(this.segments[0].x, this.segments[0].y);
            for (let i = 1; i < this.segments.length; i++) {
                ctx.lineTo(this.segments[i].x, this.segments[i].y);
            }
            ctx.stroke();
            ctx.restore();
        };
        bolt.update = function () {
            this.life--;
            if (this.life <= 0) this.dead = true;
        };
        STATE.Entities.push(bolt);
    },

    thunderFlash: () => {
        STATE.ScreenFlash = { color: '#ffffff', alpha: 0.4, time: 2 };
    },

    thunderChain: (cx, cy) => {
        FX.thunderFlash();
        const enemies = STATE.Entities.filter(e => e instanceof Enemy && !e.dead)
            .sort((a, b) => {
                const da = Math.sqrt((a.x - cx) ** 2 + (a.y - cy) ** 2);
                const db = Math.sqrt((b.x - cx) ** 2 + (b.y - cy) ** 2);
                return da - db;
            }).slice(0, 5);

        let lastX = cx, lastY = cy;
        enemies.forEach((target, i) => {
            setTimeout(() => {
                FX.lightning(lastX, lastY, target.x, target.y);
                target.takeDamage(40);
                lastX = target.x;
                lastY = target.y;
            }, i * 25);
        });
    },

    // === 光 (走る白い光線) ===
    lightRay: (x, y, angle) => {
        const ray = new Entity(x, y, 0, '#ffffff');
        ray.angle = angle;
        ray.progress = 0;
        ray.life = 8;
        ray.update = function () {
            this.progress += 0.2;
            this.life--;
            if (this.life <= 0) this.dead = true;
        };
        ray.draw = function (ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.globalAlpha = this.life / 8;

            const len = Math.min(this.progress * 1500, 1200);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ffffaa';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();
            ctx.restore();
        };
        STATE.Entities.push(ray);
    },

    // === 炎 (燃焼エリア) ===
    flameZone: (x, y, radius) => {
        screenShake(5, 10);
        // 瞬間の爆発
        for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            const dist = radius * 0.6;
            const p = new Particle(x + Math.cos(a) * dist, y + Math.sin(a) * dist, 8, '#ff4400', 'fire');
            p.vy = -3;
            p.life = 25;
            STATE.Entities.push(p);
        }
    },

    // === 毒 (瞬間展開) ===
    poisonBurst: (x, y, radius) => {
        spawnParticleRing(x, y, radius, '#9b59b6');
        for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            const dist = radius * 0.5;
            const p = new Particle(x + Math.cos(a) * dist, y + Math.sin(a) * dist, 5, '#9b59b6', 'bubble');
            p.vy = -1;
            p.life = 25;
            STATE.Entities.push(p);
        }
    },

    // === 地 (地割れ) ===
    groundCrack: (x, y) => {
        screenShake(8, 15);
        const crack = new Entity(x, y, 0, '#654321');
        crack.life = 45;
        crack.draw = function (ctx) {
            ctx.save();
            ctx.globalAlpha = this.life / 45;
            ctx.strokeStyle = '#3d2817';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - 40, this.y + 25);
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + 35, this.y + 30);
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + 15, this.y - 35);
            ctx.stroke();
            ctx.restore();
        };
        crack.update = function () {
            this.life--;
            if (this.life <= 0) this.dead = true;
        };
        STATE.Entities.push(crack);
    },

    // === 山 (巨岩落下) ===
    mountainDrop: (x, y, onImpact) => {
        const shadow = new Entity(x, y, 0, '#000000');
        shadow.life = 35;
        shadow.onImpact = onImpact;
        shadow.draw = function (ctx) {
            ctx.save();
            const progress = 1 - (this.life / 35);
            ctx.globalAlpha = 0.2 + progress * 0.5;
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, 50 * (0.4 + progress * 0.6), 15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };
        shadow.update = function () {
            this.life--;
            if (this.life <= 0) {
                this.dead = true;
                FX.earthImpact(x, y);
                screenShake(15, 20);
                if (this.onImpact) this.onImpact();
            }
        };
        STATE.Entities.push(shadow);
    },

    // === 海 (波) ===
    waveRing: (x, y, radius, knockback) => {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                spawnParticleRing(x, y, radius * (0.4 + i * 0.3), '#4488cc');
            }, i * 80);
        }
        for (let i = 0; i < 12; i++) {
            const a = Math.random() * Math.PI * 2;
            const d = Math.random() * radius * 0.6;
            const p = new Particle(x + Math.cos(a) * d, y + Math.sin(a) * d, 4, '#66aaff', 'bubble');
            p.vy = -2 - Math.random() * 2;
            p.life = 20;
            STATE.Entities.push(p);
        }
    },

    // === 森 (絡みつく蔦) ===
    vineGrow: (x, y) => {
        for (let i = 0; i < 4; i++) {
            const vine = new Entity(x + (Math.random() - 0.5) * 50, y, 0, '#228b22');
            vine.height = 0;
            vine.maxHeight = 40 + Math.random() * 40;
            vine.life = 50;
            vine.draw = function (ctx) {
                ctx.save();
                ctx.globalAlpha = Math.min(1, this.life / 20);
                ctx.strokeStyle = '#228b22';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + Math.sin(STATE.Frame * 0.1) * 8, this.y - this.height);
                ctx.stroke();
                // 葉
                ctx.fillStyle = '#44aa44';
                ctx.beginPath();
                ctx.ellipse(this.x + Math.sin(STATE.Frame * 0.1) * 8, this.y - this.height, 6, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            };
            vine.update = function () {
                if (this.height < this.maxHeight) this.height += 3;
                this.life--;
                if (this.life <= 0) this.dead = true;
            };
            STATE.Entities.push(vine);
        }
    },

    // === 林 (結界) ===
    forestBarrier: (x, y, radius) => {
        const barrier = new Entity(x, y, 0, '#006400');
        barrier.radius = radius;
        barrier.life = 200;
        barrier.draw = function (ctx) {
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#228b22';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };
        barrier.update = function () {
            this.life--;
            if (this.life <= 0) this.dead = true;
            // 葉を時々出す
            if (STATE.Frame % 25 === 0) {
                const a = Math.random() * Math.PI * 2;
                const d = Math.random() * this.radius;
                const p = new Particle(this.x + Math.cos(a) * d, this.y + Math.sin(a) * d, 4, '#44aa44', 'normal');
                p.vy = -1;
                p.life = 30;
                STATE.Entities.push(p);
            }
        };
        STATE.Entities.push(barrier);
    },

    // === 星 (流星 - 影予兆+火花インパクト) ===
    meteor: (targetX, targetY, delay, onImpact) => {
        setTimeout(() => {
            // 影予兆
            const shadow = new Entity(targetX, targetY, 0, '#000000');
            shadow.life = 25;
            shadow.draw = function (ctx) {
                ctx.save();
                const progress = 1 - (this.life / 25);
                ctx.globalAlpha = 0.15 + progress * 0.4;
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, 30 * (0.3 + progress * 0.7), 10, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            };
            shadow.update = function () {
                this.life--;
                if (this.life <= 0) {
                    this.dead = true;
                    // 火花インパクト
                    screenShake(5, 8);
                    for (let i = 0; i < 8; i++) {
                        const a = (i / 8) * Math.PI * 2;
                        const p = new Particle(targetX, targetY, 4, '#ffaa44', 'fire');
                        p.vx = Math.cos(a) * 6;
                        p.vy = Math.sin(a) * 6;
                        p.life = 15;
                        STATE.Entities.push(p);
                    }
                    if (onImpact) onImpact();
                }
            };
            STATE.Entities.push(shadow);
        }, delay);
    },

    // === 斬 (敵中心の横一閃) ===
    slashLine: (ex, ey) => {
        const slash = new Entity(ex, ey, 0, '#ffffff');
        slash.life = 6;
        slash.draw = function (ctx) {
            ctx.save();
            ctx.globalAlpha = this.life / 6;
            // 黒縁
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.x - 100, this.y);
            ctx.lineTo(this.x + 100, this.y);
            ctx.stroke();
            // 白芯
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - 100, this.y);
            ctx.lineTo(this.x + 100, this.y);
            ctx.stroke();
            ctx.restore();
        };
        slash.update = function () {
            this.life--;
            if (this.life <= 0) this.dead = true;
        };
        STATE.Entities.push(slash);
    },

    // === 止 (全画面時間停止) ===
    timeStop: () => {
        STATE.TimeStopEffect = { active: true, time: 60 };
        screenShake(3, 10);
    },

    // === オーラ (バフ/デバフ継続表示) ===
    aura: (entity, color) => {
        if (STATE.Frame % 6 !== 0) return;
        const a = Math.random() * Math.PI * 2;
        const d = entity.r * 0.6;
        const p = new Particle(entity.x + Math.cos(a) * d, entity.y + Math.sin(a) * d, 3, color, 'normal');
        p.vy = -1.5;
        p.life = 15;
        STATE.Entities.push(p);
    },

    // === 守 (六角結界) ===
    hexShield: (x, y, radius) => {
        const shield = new Entity(x, y, 0, '#4169e1');
        shield.radius = radius;
        shield.life = 150;
        shield.draw = function (ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.globalAlpha = 0.3 + 0.1 * Math.sin(STATE.Frame * 0.1);
            ctx.strokeStyle = '#6699ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
                const px = Math.cos(angle) * this.radius;
                const py = Math.sin(angle) * this.radius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        };
        shield.update = function () {
            this.life--;
            if (this.life <= 0) this.dead = true;
        };
        STATE.Entities.push(shield);
    }
};

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
    // Visual
    spawnParticleRing(x, y, r, color);
}
