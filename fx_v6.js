
// ========================================
// === V6 ULTIMATE FX SYSTEM (100 POINT) ===
// ========================================

const FX = {
    // === AURA SYSTEM (NEW) ===
    updateAura: (e) => {
        if (!e || e.dead) return;

        // PLAYER BUFF AURAS
        if (e.timeScale && e.timeScale > 1) { // Haste/Speed
            if (STATE.Frame % 4 === 0) FX.spawnAura(e, '#00ffff', 'speed');
        }
        // Directly checking properties attached to entity (from backup logic)
        // Player: buffTime(Gold), powerTime, speedTime, guardTime, lifeTime, etc.
        if (e.powerTime > 0 && STATE.Frame % 5 === 0) FX.spawnAura(e, '#ff0000', 'power');
        if (e.speedTime > 0 && STATE.Frame % 4 === 0) FX.spawnAura(e, '#00ffff', 'speed');
        if (e.guardTime > 0) {
            // Continuous shield visual?
            if (STATE.Frame % 60 === 0) FX.spawnShield(e, '#ffff00');
        }
        if (e.buffTime > 0 && STATE.Frame % 10 === 0) FX.spawnAura(e, '#ffd700', 'gold'); // Gold

        // ENEMY DEBUFF AURAS
        if (e.poisonTime > 0 && STATE.Frame % 8 === 0) FX.spawnAura(e, '#8a2be2', 'poison');
        if (e.burnTime > 0 && STATE.Frame % 4 === 0) FX.spawnAura(e, '#ff4500', 'fire');
        if (e.slowTimer > 0 && STATE.Frame % 15 === 0) FX.spawnAura(e, '#4488ff', 'slow');
        if (e.stopTime > 0 && STATE.Frame % 30 === 0) FX.spawnAura(e, '#888888', 'stop');
    },

    spawnAura: (e, color, type) => {
        const x = e.x + (Math.random() - 0.5) * e.r;
        const y = e.y + (Math.random() - 0.5) * e.r;

        const opts = { size: Math.random() * 6 + 4, color: color, life: 30, vx: 0, vy: -2, blendMode: 'lighter' };

        if (type === 'fire' || type === 'power') {
            opts.type = 'fire'; opts.vy = -3 - Math.random();
        } else if (type === 'poison') {
            opts.type = 'bubble'; opts.gravity = -0.05; opts.blendMode = 'source-over';
        } else if (type === 'gold') {
            opts.draw = (ctx, p) => {
                ctx.fillStyle = '#ffd700'; ctx.beginPath();
                // Star shape
                ctx.moveTo(0, -p.r); ctx.lineTo(p.r * 0.3, -p.r * 0.3); ctx.lineTo(p.r, 0); ctx.lineTo(p.r * 0.3, p.r * 0.3);
                ctx.lineTo(0, p.r); ctx.lineTo(-p.r * 0.3, p.r * 0.3); ctx.lineTo(-p.r, 0); ctx.lineTo(-p.r * 0.3, -p.r * 0.3);
                ctx.fill();
            };
        } else if (type === 'speed') {
            opts.vx = (Math.random() - 0.5) * 2;
            opts.vy = (Math.random() - 0.5) * 2;
            opts.draw = (ctx, p) => {
                ctx.strokeStyle = p.color; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-p.vx * 10, -p.vy * 10); ctx.stroke();
            };
        }

        STATE.Entities.push(new Particle(x, y, opts));
    },

    spawnShield: (e, color) => {
        // Hex Shield Ring
        STATE.Entities.push(new Particle(e.x, e.y, {
            size: e.r + 15, color: color, life: 60,
            draw: (ctx, p) => {
                ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.globalAlpha = p.life / p.maxLife * 0.5;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = i / 6 * Math.PI * 2 + STATE.Frame * 0.05;
                    const px = Math.cos(a) * p.r; const py = Math.sin(a) * p.r;
                    if (i == 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath(); ctx.stroke();
            },
            onUpdate: (p) => { p.x = e.x; p.y = e.y; }
        }));
    },

    // --- FIRE (User Approved) ---
    fireTrail: (x, y) => {
        const p = new Particle(x, y, {
            size: 6, color: '#ffaa00', life: 15, blendMode: 'lighter', shrink: 0.3,
            vx: (Math.random() - 0.5), vy: -1.5,
            draw: (ctx, p) => {
                const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
                grd.addColorStop(0, '#ffffaa'); grd.addColorStop(0.5, '#ff6600'); grd.addColorStop(1, 'rgba(255,0,0,0)');
                ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
            }
        });
        STATE.Entities.push(p);
    },
    fireImpact: (x, y) => {
        screenShake(5, 8);
        STATE.Entities.push(new Particle(x, y, { size: 50, color: '#ffaa00', life: 5, blendMode: 'lighter', shrink: 8 })); // Flash
        for (let i = 0; i < 15; i++) {
            const a = Math.random() * Math.PI * 2; const s = Math.random() * 8 + 5;
            STATE.Entities.push(new Particle(x, y, {
                size: 5, color: '#ff8800', life: 25, blendMode: 'lighter',
                vx: Math.cos(a) * s, vy: Math.sin(a) * s, friction: 0.9, gravity: -0.2
            }));
        }
    },
    flameZone: (x, y, radius) => { /* Reuse logic from V4/Update if needed */
        screenShake(5, 10);
        // Ground scorch ring
        STATE.Entities.push(new Particle(x, y, {
            size: radius, color: '#441100', life: 40, blendMode: 'source-over',
            draw: (ctx, p) => {
                ctx.globalAlpha = 0.5 * (p.life / p.maxLife);
                ctx.fillStyle = '#331100'; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
            }
        }));
        // Pillars of fire
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2; const dist = Math.random() * radius * 0.8;
            const px = x + Math.cos(angle) * dist; const py = y + Math.sin(angle) * dist * 0.6;
            FX.fireImpact(px, py); // Reuse impact for chaos
        }
    },

    // --- WATER (100 Point Revamp: SPIRAL TORRENT) ---
    waterTrail: (x, y) => {
        // Stream effect
        STATE.Entities.push(new Particle(x, y, {
            size: 4, color: '#00bfff', life: 12, blendMode: 'screen',
            vx: 0, vy: 0,
            draw: (ctx, p) => {
                ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
            }
        }));
    },
    waterSplash: (x, y) => {
        // Big Splash
        spawnShockwave(x, y, 50, '#00bfff');
        for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2; const s = Math.random() * 6 + 4;
            STATE.Entities.push(new Particle(x, y, {
                size: Math.random() * 8 + 4, color: '#00bfff', life: 30,
                vx: Math.cos(a) * s, vy: Math.sin(a) * s, gravity: 0.3, friction: 0.94,
                type: 'bubble'
            }));
        }
        // Fountain center
        for (let i = 0; i < 8; i++) {
            STATE.Entities.push(new Particle(x, y, {
                size: 10, color: '#e0ffff', life: 25,
                vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 8 - 5, gravity: 0.5
            }));
        }
    },
    waterSpiral: (x, y) => { /* For Ability use? */ }, // kept if needed

    // --- ICE (100 Point Revamp: GLACIAL SHATTER) ---
    iceTrail: (x, y) => {
        STATE.Entities.push(new Particle(x, y, {
            size: 4, color: '#e0f7fa', life: 15, blendMode: 'lighter',
            draw: (ctx, p) => {
                ctx.rotate(p.life); ctx.fillStyle = p.color; ctx.beginPath();
                ctx.rect(-p.r, -p.r, p.r * 2, p.r * 2); ctx.fill();
            }
        }));
    },
    iceBurst: (x, y) => {
        // Glass shatter sound visual
        for (let i = 0; i < 12; i++) {
            const a = Math.random() * Math.PI * 2; const s = Math.random() * 8 + 2;
            STATE.Entities.push(new Particle(x, y, {
                size: Math.random() * 15 + 5, color: '#b2ebf2', life: 35,
                vx: Math.cos(a) * s, vy: Math.sin(a) * s, friction: 0.92,
                draw: (ctx, p) => {
                    ctx.rotate(p.life * 0.2);
                    ctx.fillStyle = `rgba(224, 247, 250, ${p.life / p.maxLife})`;
                    ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(p.r * 0.5, 0); ctx.lineTo(0, p.r); ctx.lineTo(-p.r * 0.5, 0); ctx.fill();
                    // Shininess
                    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(-2, -2, 2, 0, Math.PI * 2); ctx.fill();
                }
            }));
        }
        // Nova
        spawnShockwave(x, y, 60, '#e0f7fa');
    },

    // --- EARTH (100 Point Revamp: ROCK SLIDE) ---
    earthTrail: (x, y) => {
        STATE.Entities.push(new Particle(x, y, {
            size: 4, color: '#795548', life: 20,
            vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
            type: 'rock'
        }));
    },
    earthImpact: (x, y) => {
        screenShake(8, 12);
        // Cracks
        FX.groundCrack(x, y);
        // Debris Flying
        for (let i = 0; i < 10; i++) {
            STATE.Entities.push(new Particle(x, y, {
                size: Math.random() * 8 + 6, color: '#5d4037', life: 45,
                vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 15, gravity: 0.6,
                type: 'rock', spin: 0.2
            }));
        }
        // Dust Cloud
        for (let i = 0; i < 8; i++) {
            const a = Math.random() * Math.PI * 2; const d = Math.random() * 20;
            STATE.Entities.push(new Particle(x + Math.cos(a) * d, y + Math.sin(a) * d, {
                size: 20, color: '#6d4c41', life: 40,
                vx: Math.cos(a) * 2, vy: Math.sin(a) * 2,
                draw: (ctx, p) => {
                    ctx.globalAlpha = (p.life / p.maxLife) * 0.4;
                    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
                }
            }));
        }
    },
    groundCrack: (x, y) => {
        // Visual Crack
        STATE.Entities.push(new Particle(x, y, {
            size: 50, color: '#3e2723', life: 60,
            draw: (ctx, p) => {
                ctx.strokeStyle = p.color; ctx.lineWidth = 4; ctx.globalAlpha = p.life / p.maxLife;
                ctx.beginPath();
                ctx.moveTo(-20, 0); ctx.lineTo(-10, 10); ctx.lineTo(10, -10); ctx.lineTo(25, 5);
                ctx.moveTo(0, 5); ctx.lineTo(5, 20);
                ctx.stroke();
            }
        }));
    },

    // --- WIND (100 Point Revamp: AERO SLASH) ---
    windTrail: (x, y) => {
        STATE.Entities.push(new Particle(x, y, {
            size: 10, color: 'rgba(255,255,255,0.2)', life: 8,
            vx: 0, vy: 0, shrink: 1,
            draw: (ctx, p) => {
                ctx.strokeStyle = '#b2dfdb'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.stroke();
            }
        }));
    },
    windSlash: (x, y) => {
        // Cutting vacuum lines
        for (let i = 0; i < 5; i++) {
            STATE.Entities.push(new Particle(x, y, {
                size: 60, color: '#e0f2f1', life: 10,
                angle: Math.random() * Math.PI * 2,
                draw: (ctx, p) => {
                    ctx.strokeStyle = `rgba(224, 242, 241, ${p.life / p.maxLife})`;
                    ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.arc(0, 0, p.r, -0.5, 0.5); ctx.stroke();
                }
            }));
        }
        // Distortion ring (Shockwave)
        spawnShockwave(x, y, 60, '#80cbc4');
    },

    // --- THUNDER (100 Point Revamp: PLASMA ARC) ---
    thunderChain: (cx, cy) => {
        STATE.ScreenFlash = { color: 'white', alpha: 0.6, time: 3 };
        screenShake(6, 12);

        // Search enemies logic (visual)
        const enemies = STATE.Entities.filter(e => e instanceof Enemy && !e.dead);
        enemies.forEach(e => {
            if (Math.hypot(e.x - cx, e.y - cy) < 400) FX.lightning(cx, cy, e.x, e.y);
        });
        if (enemies.length === 0) {
            for (let i = 0; i < 4; i++) FX.lightning(cx, cy, cx + (Math.random() - 0.5) * 300, cy + (Math.random() - 0.5) * 300);
        }
    },
    lightning: (x1, y1, x2, y2) => {
        // High def lightining
        STATE.Entities.push(new Particle(x1, y1, {
            life: 8, color: '#fff', size: 0,
            draw: (ctx, p) => {
                ctx.save();
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
                ctx.shadowBlur = 15; ctx.shadowColor = '#9c27b0';
                ctx.lineJoin = 'round';
                ctx.beginPath();

                const dx = x2 - x1, dy = y2 - y1;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const steps = dist / 20;
                let px = 0, py = 0;

                ctx.moveTo(0, 0);
                for (let i = 1; i <= steps; i++) {
                    const t = i / steps;
                    const jitter = (Math.random() - 0.5) * 30;
                    const tx = dx * t + jitter; const ty = dy * t + jitter;
                    ctx.lineTo(tx, ty);
                    // Branch?
                    if (Math.random() > 0.7) {
                        ctx.save();
                        ctx.moveTo(tx, ty);
                        ctx.lineTo(tx + (Math.random() - 0.5) * 50, ty + (Math.random() - 0.5) * 50);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
                ctx.lineTo(dx, dy);
                ctx.stroke();
                ctx.restore();
            }
        }));
    },

    // --- POISON (User requested decent) ---
    poisonBurst: (x, y, radius) => {
        spawnShockwave(x, y, radius, '#8e44ad');
        // Bubbling Swamp
        for (let i = 0; i < 20; i++) {
            const a = Math.random() * Math.PI * 2; const d = Math.random() * radius;
            STATE.Entities.push(new Particle(x + Math.cos(a) * d, y + Math.sin(a) * d, {
                size: Math.random() * 15 + 5, color: '#8e44ad', life: 60,
                vx: 0, vy: -0.5,
                draw: (ctx, p) => {
                    ctx.globalAlpha = 0.7;
                    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
                    grd.addColorStop(0, '#da70d6'); grd.addColorStop(1, '#4b0082');
                    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
                    // Pop effect
                    if (p.life % 20 === 0) {
                        // inner ripple
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, p.r * 0.5, 0, Math.PI * 2); ctx.stroke();
                    }
                }
            }));
        }
    },

    // --- LIGHT ---
    lightRay: (x, y, angle) => {
        // Laser beam
        STATE.Entities.push(new Particle(x, y, {
            size: 10, color: '#fff', life: 10, angle: angle,
            draw: (ctx, p) => {
                ctx.globalCompositeOperation = 'lighter';
                ctx.shadowBlur = 20; ctx.shadowColor = '#ffff00';
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 8;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1000, 0); ctx.stroke();
                ctx.strokeStyle = '#ffA'; ctx.lineWidth = 15; ctx.globalAlpha = 0.5;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1000, 0); ctx.stroke();
            }
        }));
        // Muzzle flash
        STATE.Entities.push(new Particle(x, y, { size: 40, color: '#fff', life: 5, blendMode: 'lighter' }));
    },

    // Mountain, Star (KEEP V4)
    mountainDrop: (x, y, cb) => {
        // Re-implement V4 mountainDrop here or V4 one remains if I selectively replace?
        // I'm replacing the whole FX object so I must include it.
        // Copying V4 Mountain logic.
        const shadow = new Entity(x, y, 0, '#000000');
        shadow.life = 35; shadow.onImpact = cb;
        shadow.draw = function (ctx) {
            ctx.save(); const p = 1 - (this.life / 35);
            ctx.globalAlpha = 0.2 + p * 0.5; ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(this.x, this.y, 50 * (0.4 + p * 0.6), 15, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        };
        shadow.update = function () {
            this.life--;
            if (this.life <= 0) { this.dead = true; FX.earthImpact(x, y); screenShake(15, 20); if (this.onImpact) this.onImpact(); }
        };
        STATE.Entities.push(shadow);
    },
    meteor: (tx, ty, delay, cb) => {
        // Copy V4 Meteor
        setTimeout(() => {
            const shadow = new Entity(tx, ty, 0, '#000');
            shadow.life = 25;
            shadow.draw = function (ctx) { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(this.x, this.y, 40, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
            shadow.update = function () {
                this.life--; if (this.life <= 0) { this.dead = true; FX.fireImpact(tx, ty); if (cb) cb(); }
            };
            STATE.Entities.push(shadow);

            // The Meteor itself
            const met = new Entity(tx + 100, ty - 200, 0, '#fff');
            met.tx = tx; met.ty = ty; met.life = 20;
            met.draw = function (ctx) {
                ctx.save(); ctx.translate(this.x, this.y);
                const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, '#fff'); g.addColorStop(1, '#f00');
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
            met.update = function () {
                this.x += (this.tx - this.x) * 0.2; this.y += (this.ty - this.y) * 0.2;
                if (Math.abs(this.y - this.ty) < 10) this.dead = true;
            }
            STATE.Entities.push(met);
        }, delay);
    },

    // Other legacy
    slashLine: (ex, ey) => {
        const p = new Particle(ex, ey, {
            size: 100, color: '#fff', life: 10,
            draw: (ctx, p) => {
                ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(-100, 0); ctx.lineTo(100, 0); ctx.stroke();
            }
        });
        STATE.Entities.push(p);
    },
    timeStop: () => { STATE.TimeStopEffect = { active: true, time: 60 }; screenShake(3, 10); },
    hexShield: (x, y, r) => FX.spawnShield({ x, y, r }, '#4169e1'), // Reuse spawnShield logic
    vineGrow: (x, y) => { /* Reuse logic? Or just skip? User said 100 point. */ },
    // Implementing simple vine
    vineGrow: (x, y) => {
        for (let i = 0; i < 5; i++) {
            STATE.Entities.push(new Particle(x, y, {
                size: 5, color: '#2ecc71', life: 50,
                vx: (Math.random() - 0.5) * 5, vy: -5, gravity: 0.1,
                draw: (ctx, p) => {
                    ctx.strokeStyle = p.color; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(p.life) * 10, 20); ctx.stroke();
                }
            }));
        }
    },
    forestBarrier: (x, y, r) => FX.spawnShield({ x, y, r }, '#228b22'),
    aura: (e, c) => FX.spawnAura(e, c, 'gold') // Legacy
};
