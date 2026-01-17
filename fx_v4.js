
// ========================================
// === V4 ULTIMATE FX SYSTEM ===
// ========================================

class Particle extends Entity {
    constructor(x, y, options = {}) {
        // Handle legacy arguments if options is not an object (fallback)
        // usage: new Particle(x, y, size, color, type)
        if (typeof options !== 'object' || options === null) {
            super(x, y, arguments[2], arguments[3]);
            this.type = arguments[4] || 'normal';
            // Mimic old constructor logic
            this.life = 40 + Math.random() * 20;
            this.maxLife = this.life;
            const ang = Math.random() * Math.PI * 2;
            const spd = Math.random() * 3 + 1;
            this.vx = Math.cos(ang) * spd;
            this.vy = Math.sin(ang) * spd;
            this.gravity = 0;
            this.friction = 0.98;
            this.angle = 0;
            this.spin = 0;
            if (this.type === 'fire') { this.vy -= 1; this.blendMode = 'lighter'; }
            else if (this.type === 'bubble') { this.blendMode = 'source-over'; this.gravity = -0.05; }
            else { this.blendMode = 'source-over'; }
            return;
        }

        super(x, y, options.size || 5, options.color || 'white');
        this.vx = options.vx !== undefined ? options.vx : (Math.random() - 0.5) * 5;
        this.vy = options.vy !== undefined ? options.vy : (Math.random() - 0.5) * 5;
        this.life = options.life || 30;
        this.maxLife = this.life;
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 1;
        this.shrink = options.shrink || 0;
        this.spin = options.spin || 0;
        this.angle = Math.random() * Math.PI * 2;
        this.blendMode = options.blendMode || 'source-over';
        this.type = options.type || 'circle';
        this.drawCustom = options.draw || null;
        this.onUpdate = options.onUpdate || null;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.angle += this.spin;
        if (this.shrink) this.r = Math.max(0, this.r - this.shrink);

        if (this.onUpdate) this.onUpdate(this);

        this.life--;
        if (this.life <= 0 || this.r <= 0.1) this.dead = true;
    }

    draw(ctx) {
        ctx.save();
        const alpha = Math.max(0, Math.min(1, this.life / this.maxLife));
        ctx.globalAlpha = alpha;
        ctx.globalCompositeOperation = this.blendMode;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;

        if (this.drawCustom) {
            this.drawCustom(ctx, this);
        } else if (this.type === 'rect') {
            ctx.fillRect(-this.r, -this.r, this.r * 2, this.r * 2);
        } else if (this.type === 'ring') {
            ctx.beginPath();
            ctx.arc(0, 0, this.r, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Circle
            ctx.shadowBlur = this.blendMode === 'lighter' ? 10 : 0;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// Retro-fit legacy spawnParticle
function spawnParticle(x, y, count, color, type = 'normal') {
    for (let i = 0; i < count; i++) {
        // Use legacy constructor signature
        STATE.Entities.push(new Particle(x, y, Math.random() * 3 + 2, color, type));
    }
}

function spawnShockwave(x, y, r, color) {
    // Elegant shockwave
    const wave = new Particle(x, y, {
        size: 5,
        color: color,
        life: 30,
        vx: 0, vy: 0,
        type: 'custom',
        draw: (ctx, p) => {
            const progress = 1 - (p.life / p.maxLife);
            const radius = r * (0.2 + 0.8 * Math.pow(progress, 0.5)); // Ease out
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.lineWidth = 10 * (1 - progress);
            ctx.strokeStyle = p.color;
            ctx.stroke();
        }
    });
    STATE.Entities.push(wave);
}

// === ULTIMATE FX LIBRARY (V4) ===
const FX = {
    // --- FIRE ---
    fireTrail: (x, y) => {
        const p = new Particle(x, y, {
            size: 6,
            color: '#ffaa00',
            life: 15,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 1.0) * 2,
            blendMode: 'lighter',
            shrink: 0.3,
            draw: (ctx, p) => {
                const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
                grd.addColorStop(0, '#ffffaa');
                grd.addColorStop(0.4, '#ffaa00');
                grd.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = grd;
                ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
            }
        });
        STATE.Entities.push(p);
    },

    fireImpact: (x, y) => {
        screenShake(5, 8);
        // Flash
        STATE.Entities.push(new Particle(x, y, {
            size: 40, color: '#ffdd00', life: 4, blendMode: 'lighter', shrink: 5
        }));
        // Sparks
        for (let i = 0; i < 12; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = Math.random() * 8 + 4;
            STATE.Entities.push(new Particle(x, y, {
                size: 3, color: '#ffaa00', life: 20,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                friction: 0.9, blendMode: 'lighter',
                type: 'rect', spin: 0.5
            }));
        }
        // Smoke
        for (let i = 0; i < 5; i++) {
            STATE.Entities.push(new Particle(x, y, {
                size: 8, color: '#222', life: 40,
                vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 3,
                gravity: -0.1, fade: 0.05
            }));
        }
    },

    flameZone: (x, y, radius) => {
        screenShake(5, 10);
        // Base Glow
        STATE.Entities.push(new Particle(x, y, {
            size: radius, color: '#ff4400', life: 40, blendMode: 'screen',
            draw: (ctx, p) => {
                const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
                grd.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
                grd.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = grd;
                ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
            }
        }));

        // Rising Flames
        for (let i = 0; i < 15; i++) {
            const ang = Math.random() * Math.PI * 2;
            const r = Math.random() * radius * 0.7;
            const px = x + Math.cos(ang) * r;
            const py = y + Math.sin(ang) * r * 0.6;
            STATE.Entities.push(new Particle(px, py, {
                size: Math.random() * 10 + 10, color: '#ff8800', life: 40 + Math.random() * 20,
                vx: 0, vy: -2 - Math.random() * 2, blendMode: 'lighter', shrink: 0.3,
                draw: (ctx, p) => {
                    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
                    grd.addColorStop(0, 'rgba(255, 255, 100, 1)');
                    grd.addColorStop(0.5, 'rgba(255, 100, 0, 0.6)');
                    grd.addColorStop(1, 'rgba(100, 0, 0, 0)');
                    ctx.fillStyle = grd;
                    ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
                }
            }));
        }
    },

    // --- ICE ---
    iceTrail: (x, y) => {
        STATE.Entities.push(new Particle(x, y, {
            size: 3, color: 'rgba(200, 240, 255, 0.8)', life: 10, blendMode: 'screen', shrink: 0.2
        }));
    },

    iceBurst: (x, y) => {
        // Diamond Dust
        for (let i = 0; i < 10; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = Math.random() * 6 + 2;
            STATE.Entities.push(new Particle(x, y, {
                size: Math.random() * 4 + 2, color: 'white', life: 30,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                friction: 0.92, blendMode: 'screen', spin: 0.2,
                draw: (ctx, p) => {
                    ctx.fillStyle = `rgba(220, 240, 255, ${p.life / p.maxLife})`;
                    ctx.beginPath();
                    ctx.moveTo(0, -p.r);
                    ctx.lineTo(p.r * 0.6, 0);
                    ctx.lineTo(0, p.r);
                    ctx.lineTo(-p.r * 0.6, 0);
                    ctx.fill();
                    // Sparkle
                    if (Math.random() > 0.8) {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(-1, -1, 2, 2);
                    }
                }
            }));
        }
        // Nova ring
        spawnShockwave(x, y, 40, '#aaddff');
    },

    // --- WATER ---
    waterTrail: (x, y) => {
        STATE.Entities.push(new Particle(x, y, {
            size: 4, color: '#44aaff', life: 15, blendMode: 'source-over',
            vx: 0, vy: 0, shrink: 0.2
        }));
    },
    waterSplash: (x, y) => {
        // Liquid splash
        for (let i = 0; i < 8; i++) {
            STATE.Entities.push(new Particle(x, y, {
                size: Math.random() * 5 + 3, color: '#2288ee', life: 25,
                vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 6 - 2,
                gravity: 0.3, friction: 0.98, type: 'bubble'
            }));
        }
    },

    // === POISON (AOE) ===
    poisonBurst: (x, y, radius) => {
        spawnShockwave(x, y, radius, '#8e44ad');
        // Swirling Gas
        for (let i = 0; i < 15; i++) {
            const ang = (i / 15) * Math.PI * 2;
            const dist = radius * 0.4;
            STATE.Entities.push(new Particle(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist, {
                size: 20 + Math.random() * 15, color: '#9b59b6', life: 80 + Math.random() * 20,
                vx: Math.cos(ang) * 0.5, vy: Math.sin(ang) * 0.5,
                friction: 0.95, blendMode: 'source-over',
                draw: (ctx, p) => {
                    // Bubbling Gas
                    const pulse = Math.sin(STATE.Frame * 0.1 + i);
                    const r = p.r + pulse * 5;
                    ctx.globalAlpha = (p.life / p.maxLife) * 0.6;
                    const grd = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
                    grd.addColorStop(0, 'rgba(155, 89, 182, 0.8)');
                    grd.addColorStop(0.6, 'rgba(46, 204, 113, 0.4)'); // Green toxin mix
                    grd.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = grd;
                    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

                    // Little bubbles rising
                    if (Math.random() > 0.9) {
                        ctx.fillStyle = '#2ecc71';
                        ctx.beginPath(); ctx.arc((Math.random() - 0.5) * r, (Math.random() - 0.5) * r, 2, 0, Math.PI * 2); ctx.fill();
                    }
                }
            }));
        }
    },

    // === EARTH / MOUNTAIN ===
    earthImpact: (x, y) => {
        screenShake(10, 15);
        // Debris
        for (let i = 0; i < 8; i++) {
            STATE.Entities.push(new Particle(x, y, {
                size: Math.random() * 6 + 4, color: '#5d4037', life: 40,
                vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 10,
                gravity: 0.4, spin: Math.random() * 0.2 - 0.1, type: 'rect'
            }));
        }
        // Dust
        STATE.Entities.push(new Particle(x, y, {
            size: 30, color: '#795548', life: 30,
            vx: 0, vy: -0.5, shrink: -1, // Grow
            draw: (ctx, p) => {
                ctx.globalAlpha = (p.life / p.maxLife) * 0.5;
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
            }
        }));
    },

    mountainDrop: (x, y, onImpact) => {
        // Falling massive shadow/rock
        const rock = new Entity(x, y - 600, 0, '#3e2723'); // Start high
        rock.targetY = y;
        rock.vy = 25; // Fast fall
        rock.life = 100;
        rock.draw = function (ctx) {
            ctx.save();
            ctx.shadowBlur = 20; ctx.shadowColor = 'black';
            ctx.fillStyle = '#3e2723';
            ctx.translate(this.x, this.y);
            // Rough rock shape
            ctx.beginPath();
            ctx.moveTo(-40, -50); ctx.lineTo(40, -40); ctx.lineTo(50, 40); ctx.lineTo(-30, 50);
            ctx.fill();
            ctx.restore();

            // Shadow on ground
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            const dist = rock.targetY - rock.y;
            const scale = Math.max(0.1, 1 - dist / 600);
            ctx.translate(rock.x, rock.targetY);
            ctx.scale(scale, scale * 0.5);
            ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        };
        rock.update = function () {
            this.y += this.vy;
            if (this.y >= this.targetY) {
                this.dead = true;
                FX.earthImpact(this.x, this.y);
                if (onImpact) onImpact();
            }
        };
        STATE.Entities.push(rock);
    },

    // === THUNDER ===
    thunderChain: (cx, cy) => {
        STATE.ScreenFlash = { color: 'white', alpha: 0.7, time: 3 };
        screenShake(5, 5);
        // We need target logic, but visual only.
        // Re-implement finding nearby enemies for visual visual connection
        const enemies = STATE.Entities.filter(e => e instanceof Enemy && !e.dead);
        // Simple logic: connect random nearby enemies with bolts
        enemies.forEach(e => {
            if (Math.hypot(e.x - cx, e.y - cy) < 400) {
                FX.lightning(cx, cy, e.x, e.y);
            }
        });
        if (enemies.length === 0) {
            // Just some random bolts if no enemies
            for (let i = 0; i < 3; i++) {
                FX.lightning(cx, cy, cx + (Math.random() - 0.5) * 300, cy + (Math.random() - 0.5) * 300);
            }
        }
    },

    lightning: (x1, y1, x2, y2) => {
        const segs = 6;
        const dx = x2 - x1, dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const bolt = new Particle(x1, y1, {
            size: 0, color: '#fff', life: 10,
            draw: (ctx, p) => {
                ctx.save();
                ctx.strokeStyle = '#e0ffff';
                ctx.lineWidth = 3;
                ctx.shadowBlur = 15; ctx.shadowColor = '#8a2be2';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                let cx = 0, cy = 0;
                for (let i = 1; i <= segs; i++) {
                    const t = i / segs;
                    const tx = dx * t;
                    const ty = dy * t;
                    if (i < segs) {
                        cx = tx + (Math.random() - 0.5) * (dist / segs) * 3; // Jitter
                        cy = ty + (Math.random() - 0.5) * (dist / segs) * 3;
                    } else {
                        cx = tx; cy = ty;
                    }
                    ctx.lineTo(cx, cy);
                }
                ctx.stroke();

                // Core
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.shadowBlur = 0;
                ctx.stroke();
                ctx.restore();
            }
        });
        STATE.Entities.push(bolt);
    },

    // === METEOR (Star) ===
    meteor: (tx, ty, delay, onImpact) => {
        setTimeout(() => {
            // Warning reticle
            STATE.Entities.push(new Particle(tx, ty, {
                size: 80, color: 'red', life: 40,
                draw: (ctx, p) => {
                    ctx.strokeStyle = `rgba(255, 0, 0, ${(p.life / p.maxLife) * 0.5})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(0, 0, p.r * (1 - p.life / p.maxLife), 0, Math.PI * 2); ctx.stroke();
                    // Crosshair
                    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.stroke();
                }
            }));

            // Meteor falling
            const met = new Entity(tx + 200, ty - 400, 0, '#fff');
            met.tx = tx; met.ty = ty;
            met.life = 20;
            met.draw = function (ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
                grad.addColorStop(0, 'white');
                grad.addColorStop(0.3, '#f1c40f');
                grad.addColorStop(1, 'rgba(255,0,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            };
            met.update = function () {
                this.x += (this.tx - this.x) * 0.2;
                this.y += (this.ty - this.y) * 0.2;
                if (Math.abs(this.y - this.ty) < 10) {
                    this.dead = true;
                    FX.fireImpact(this.tx, this.ty);
                    if (onImpact) onImpact();
                }
            };
            STATE.Entities.push(met);

        }, delay);
    },

    // === WIND ===
    windSlash: (x, y) => {
        // Curved slashes
        for (let i = 0; i < 3; i++) {
            STATE.Entities.push(new Particle(x, y, {
                size: 40, color: '#b0e0e6', life: 10,
                vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                angle: Math.random() * Math.PI * 2,
                draw: (ctx, p) => {
                    ctx.strokeStyle = `rgba(176, 224, 230, ${p.life / p.maxLife})`;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(0, 0, 30, -0.5, 0.5);
                    ctx.stroke();
                }
            }));
        }
    },

    // === LIGHT ===
    lightRay: (x, y, angle) => {
        STATE.Entities.push(new Particle(x, y, {
            size: 0, color: 'white', life: 10, angle: angle,
            draw: (ctx, p) => {
                ctx.globalCompositeOperation = 'lighter';
                ctx.strokeStyle = 'white';
                ctx.shadowColor = '#ffffaa';
                ctx.shadowBlur = 20;
                ctx.lineWidth = 10 * (p.life / p.maxLife);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(800, 0); // Long ray
                ctx.stroke();
            }
        }));
    }, // Add comma

    groundCrack: (x, y) => FX.earthImpact(x, y), // Alias
    timeStop: () => {
        STATE.TimeStopEffect = { active: true, time: 60 };
        // Invert color ripple?
        STATE.ScreenFlash = { color: 'black', alpha: 0.5, time: 5 };
        setTimeout(() => STATE.ScreenFlash = { color: 'white', alpha: 0.5, time: 5 }, 50);
    }
};

function createExplosion(x, y, r, color, frameDuration, dmg, isEnemyAttack) {
    // Immediate AoE check (Logic)
    STATE.Entities.forEach(e => {
        if (e instanceof Enemy && !e.dead) {
            const d = Math.sqrt((e.x - x) ** 2 + (e.y - y) ** 2);
            if (d < r + e.r) {
                e.takeDamage(dmg);
            }
        }
    });
    // Visual
    spawnShockwave(x, y, r, color);
}
