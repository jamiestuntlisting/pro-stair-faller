// ============================================================
// STARFALL — Phase 1+ Core Loop (Visual Overhaul)
// ============================================================

const CONFIG = {
    WIDTH: 1280,
    HEIGHT: 720,

    // World — much bigger scale for realistic proportions
    STAIR_START_X: 300,
    STAIR_START_Y: 200,
    STEP_WIDTH: 80,         // tread depth in pixels (~28cm real)

    // Physics (tuned for larger world)
    METER_OSCILLATION_SPEED: 3.5,
    METER_POWER_CURVE: 1.3,
    MIN_POWER_FLOOR: 0.25,    // meter value can't go below this — prevents silly low power
    MAX_INITIAL_VELOCITY: 1800,
    MAX_ENERGY: 280,
    BASE_FRICTION: 520,
    SLOPE_FRICTION_REDUCTION: 0.7,
    GRAVITY_ASSIST: 280,
    MAX_ENERGY_DRAIN_RATE: 0.38,
    SLOPE_DRAIN_REDUCTION: 0.6,
    BOOST_ACCEL: 90,
    BOOST_ENERGY_MULT: 1.4,
    BRAKE_ACCEL: -130,
    BRAKE_ENERGY_MULT: 0.6,
    JUMP_VELOCITY: 450,
    JUMP_GRAVITY: 1800,
    JUMP_ENERGY_COST_FRAC: 0.10,
    JUMP_COOLDOWN_MS: 500,

    PIXELS_PER_METER: 100,
    PERFECT_THRESHOLD_PX: 20,

    BASE_HEALTH: 100,
    LEVEL_BASE_COST: 4,
    ACCURACY_COST_MULT: 1.5,
    CRASH_TIER_THRESHOLDS: [0, 80, 200, 400, 700],
    CRASH_TIER_HEALTH_COSTS: [5, 10, 18, 28, 40],
    CRASH_TIER_SCORE_PENALTIES: [0.5, 1.5, 3.0, 5.0, 8.0],

    THUMBS_UP_DURATION: 3000,
    STOP_BEAT_DURATION: 1400,  // lie still before thumbs up (ms) — longer beat
    PLAYER_RADIUS: 75,        // tucked ball radius
    PERSON_HEIGHT: 300,       // standing height in pixels (~5 stair risers)
    CAM_LEAD_X: 100,
    CAM_SMOOTH: 0.06,

    BG_COLOR: 0x1c1c24,
};

// ============================================================
// LEVELS
// ============================================================
const LEVELS = [
    { name: 'The Basics', angleDeg: 35, numSteps: 16, flatLength: 1400, markOffset: 750 },
    { name: 'Gentle Slope', angleDeg: 25, numSteps: 20, flatLength: 1300, markOffset: 650 },
    { name: 'Steep Drop', angleDeg: 48, numSteps: 12, flatLength: 1600, markOffset: 900 },
    { name: 'The Long Way Down', angleDeg: 32, numSteps: 22, flatLength: 1200, markOffset: 620 },
    { name: 'Vertigo', angleDeg: 55, numSteps: 10, flatLength: 1800, markOffset: 1000 },
    { name: 'Barely a Ramp', angleDeg: 18, numSteps: 24, flatLength: 1100, markOffset: 500 },
    { name: 'The Goldilocks', angleDeg: 38, numSteps: 16, flatLength: 1350, markOffset: 720 },
    { name: 'Nosedive', angleDeg: 52, numSteps: 11, flatLength: 1700, markOffset: 950 },
];

function buildLevel(levelDef) {
    const angleRad = levelDef.angleDeg * Math.PI / 180;
    const numSteps = levelDef.numSteps;
    const stepW = CONFIG.STEP_WIDTH;
    const stepH = Math.round(stepW * Math.tan(angleRad));
    const startX = CONFIG.STAIR_START_X;
    const startY = CONFIG.STAIR_START_Y;
    const endX = startX + stepW * numSteps;
    const endY = startY + stepH * numSteps;

    const steps = [];
    for (let i = 0; i < numSteps; i++) {
        steps.push({ x: startX + i * stepW, y: startY + i * stepH, w: stepW, h: stepH });
    }

    const stairLength = (stepW * numSteps) / Math.cos(angleRad);
    const flatEndX = endX + levelDef.flatLength;
    const markX = endX + levelDef.markOffset;
    const cameraX = markX + 200;

    const segments = [
        { type: 'slope', startX, startY, endX, endY, angle: angleRad, length: stairLength },
        { type: 'flat', startX: endX, startY: endY, endX: flatEndX, endY: endY, angle: 0, length: levelDef.flatLength },
    ];

    return { segments, steps, stepW, stepH, markX, cameraX, flatEndX, angleDeg: levelDef.angleDeg, name: levelDef.name, startX, startY, endX, endY };
}

let SEGMENTS = buildLevel(LEVELS[0]).segments;

// ============================================================
// BOOT SCENE
// ============================================================
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }
    create() { this.scene.start('PlayScene'); }
}

// ============================================================
// PLAY SCENE
// ============================================================
class PlayScene extends Phaser.Scene {
    constructor() { super('PlayScene'); }

    init(data) {
        this.currentHealth = data.health != null ? data.health : CONFIG.BASE_HEALTH;
        this.currentLevel = data.level != null ? data.level : 0;
        this.currency = data.currency != null ? data.currency : 0;
        this.levelData = buildLevel(LEVELS[this.currentLevel % LEVELS.length]);
        SEGMENTS = this.levelData.segments;
    }

    create() {
        this.playerState = 'idle';
        this.meterValue = 0;
        this.meterTime = 0;
        this.playerVelocity = 0;
        this.playerEnergy = 0;
        this.playerMaxEnergy = 0;
        this.currentSegment = 0;
        this.distAlongSegment = 0;
        this.playerWorldX = SEGMENTS[0].startX;
        this.playerWorldY = SEGMENTS[0].startY;
        this.jumpVelY = 0;
        this.lastJumpTime = 0;
        this.rollRotation = 0;
        this.scoreData = null;
        this.showingScore = false;
        this.crashTier = 0;
        this.crashAnimTime = 0;
        this.stopTime = 0;        // time since player stopped (for beat before thumbs up)

        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.on('pointerdown', () => this.handleAction());
        this.spaceKey.on('down', () => this.handleAction());

        // World layers
        this.bgGfx = this.add.graphics();
        this.worldGfx = this.add.graphics();
        this.crewGfx = this.add.graphics();
        this.playerGfx = this.add.graphics();
        this.fgGfx = this.add.graphics(); // foreground details

        this.drawBackground();
        this.drawWorld();
        this.drawCrewScene(0);
        this.drawForeground();

        // Camera
        const worldW = this.levelData.flatEndX + 600;
        const worldH = this.levelData.endY + 600;
        this.cameras.main.setBounds(-500, -600, worldW + 1000, worldH + 1200);
        this.cameras.main.scrollX = SEGMENTS[0].startX - 400;
        this.cameras.main.scrollY = SEGMENTS[0].startY - 300;
        this.camTargetX = this.cameras.main.scrollX;
        this.camTargetY = this.cameras.main.scrollY;

        // UI (fixed to screen)
        this.uiGfx = this.add.graphics().setScrollFactor(0);
        this.meterGfx = this.add.graphics().setScrollFactor(0);
        this.meterLabel = this.add.text(44, 184, 'POWER', {
            fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#8888aa',
        }).setOrigin(0.5, 1).setScrollFactor(0);
        this.add.text(140, 18, 'ENERGY', { fontSize: '11px', fontFamily: 'Arial', color: '#66bb99' }).setOrigin(0, 1).setScrollFactor(0);
        this.add.text(440, 18, 'HEALTH', { fontSize: '11px', fontFamily: 'Arial', color: '#bb7777' }).setOrigin(0, 1).setScrollFactor(0);

        const lvl = this.currentLevel + 1;
        this.add.text(CONFIG.WIDTH / 2, 52, `Level ${lvl}: ${this.levelData.name}`, {
            fontSize: '24px', fontFamily: 'Georgia, serif', color: '#aaaacc',
            stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5).setScrollFactor(0);
        this.add.text(CONFIG.WIDTH / 2, 80, `${this.levelData.angleDeg}°`, {
            fontSize: '15px', fontFamily: 'Arial', color: '#666688',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setScrollFactor(0);

        this.scoreText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 50, '', {
            fontSize: '48px', fontFamily: 'Georgia, serif', color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
        this.crashText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 110, '', {
            fontSize: '42px', fontFamily: 'Georgia, serif', color: '#ff3333',
            stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
        this.promptText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 30, '', {
            fontSize: '16px', fontFamily: 'Arial', color: '#aaaacc',
            stroke: '#000000', strokeThickness: 3, align: 'center',
        }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
        this.hintText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 30, 'Press SPACE to set power', {
            fontSize: '15px', fontFamily: 'Arial', color: '#555577',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setScrollFactor(0);

        this.bounceTime = 0;
    }

    handleAction() {
        if (this.playerState === 'idle') {
            this.launchPlayer();
        } else if ((this.playerState === 'stopped' || this.playerState === 'crashed') && this.showingScore) {
            if (this.currentHealth <= 0) {
                this.scene.restart({ health: CONFIG.BASE_HEALTH, level: 0, currency: 0 });
            } else {
                this.scene.restart({ health: this.currentHealth, level: this.currentLevel + 1, currency: this.currency });
            }
        }
    }

    launchPlayer() {
        const scaled = Math.pow(this.meterValue, CONFIG.METER_POWER_CURVE);
        this.playerVelocity = scaled * CONFIG.MAX_INITIAL_VELOCITY;
        this.playerMaxEnergy = scaled * CONFIG.MAX_ENERGY;
        this.playerEnergy = this.playerMaxEnergy;
        this.currentSegment = 0;
        this.distAlongSegment = 0;
        this.playerState = 'rolling';
        this.hintText.setVisible(false);
    }

    // ================================================================
    // BACKGROUND — warehouse / sound stage walls
    // ================================================================
    drawBackground() {
        const g = this.bgGfx;
        const ld = this.levelData;
        const left = -400;
        const right = ld.flatEndX + 800;
        const top = ld.startY - 500;
        const bot = ld.endY + 600;

        // Sound stage back wall — dark concrete with subtle variation
        for (let y = top; y < bot; y += 40) {
            const shade = 0x22 + Math.floor(Math.sin(y * 0.01) * 3);
            const color = (shade << 16) | (shade << 8) | (shade + 8);
            g.fillStyle(color, 1);
            g.fillRect(left, y, right - left, 42);
        }

        // Subtle vertical seams in wall (concrete panels)
        g.lineStyle(1, 0x282830, 0.4);
        for (let x = left; x < right; x += 300) {
            g.beginPath();
            g.moveTo(x, top);
            g.lineTo(x, bot);
            g.strokePath();
        }

        // Ambient light gradient from top (studio lights overhead)
        g.fillStyle(0xffffff, 0.03);
        g.fillRect(left, top, right - left, 200);
        g.fillStyle(0xffffff, 0.02);
        g.fillRect(left, top + 200, right - left, 200);
    }

    // ================================================================
    // FOREGROUND DETAILS — cables, tape marks, set dressing
    // ================================================================
    drawForeground() {
        const g = this.fgGfx;
        const ld = this.levelData;

        // Gaffer tape lines on floor (random set marks)
        g.lineStyle(3, 0x333340, 0.4);
        for (let i = 0; i < 5; i++) {
            const tx = ld.endX + 100 + i * 200 + (i * 73 % 60);
            g.beginPath();
            g.moveTo(tx, ld.endY - 2);
            g.lineTo(tx + 20 + (i * 31 % 40), ld.endY - 2);
            g.strokePath();
        }

        // Cable runs along the floor
        g.lineStyle(2, 0x222228, 0.5);
        g.beginPath();
        g.moveTo(ld.endX + 50, ld.endY + 8);
        const cableEnd = ld.flatEndX - 100;
        for (let x = ld.endX + 50; x < cableEnd; x += 30) {
            g.lineTo(x + 15, ld.endY + 8 + Math.sin(x * 0.05) * 3);
        }
        g.strokePath();

        // Apple box near the stairs (wooden box — film set prop)
        const abx = ld.endX + 60;
        const aby = ld.endY;
        g.fillStyle(0x8a7250, 1);
        g.fillRect(abx, aby - 28, 40, 28);
        g.fillStyle(0x7a6240, 1);
        g.fillRect(abx, aby - 28, 40, 4);
        g.lineStyle(1, 0x6a5230, 0.6);
        g.strokeRect(abx, aby - 28, 40, 28);
        // "APPLE BOX" text (too small to read, but it's there conceptually)
        g.lineStyle(1, 0x5a4220, 0.3);
        g.beginPath();
        g.moveTo(abx + 8, aby - 14);
        g.lineTo(abx + 32, aby - 14);
        g.strokePath();
    }

    // ================================================================
    // WORLD — Stairs with depth, concrete texture, proper floor
    // ================================================================
    drawWorld() {
        const g = this.worldGfx;
        g.clear();
        const ld = this.levelData;
        const steps = ld.steps;
        const depth = 120; // visual thickness under the stairs

        // ---- Stair structure underneath (dark fill) ----
        g.fillStyle(0x1a1a22, 1);
        g.beginPath();
        g.moveTo(ld.startX, ld.startY);
        for (const s of steps) {
            g.lineTo(s.x, s.y);
            g.lineTo(s.x, s.y + s.h);
            g.lineTo(s.x + s.w, s.y + s.h);
        }
        g.lineTo(ld.endX, ld.endY + depth);
        g.lineTo(ld.startX, ld.endY + depth);
        g.closePath();
        g.fillPath();

        // Stair stringer (side beam visible)
        g.lineStyle(3, 0x3a3a48, 0.6);
        g.beginPath();
        g.moveTo(ld.startX, ld.startY + depth * 0.3);
        g.lineTo(ld.endX, ld.endY + depth * 0.3);
        g.strokePath();

        // ---- Each step — tread and riser with concrete look ----
        for (let i = 0; i < steps.length; i++) {
            const s = steps[i];

            // Riser (vertical face)
            const riserShade = 0x55 + (i % 2) * 3;
            g.fillStyle((riserShade << 16) | ((riserShade - 5) << 8) | (riserShade + 5), 1);
            g.fillRect(s.x, s.y + s.h, s.w, -s.h < 0 ? 0 : s.h);

            // Actually the riser is the vertical part below the tread leading to next step
            // Draw it from (s.x, s.y) down to (s.x, s.y + s.h) at width s.w
            g.fillStyle(0x585868, 1);
            g.fillRect(s.x, s.y, s.w, s.h);

            // Tread (horizontal surface — lighter, this is what you step on)
            g.fillStyle(0x727282, 1);
            g.fillRect(s.x, s.y, s.w + 1, 6); // thin tread surface on top

            // Tread nosing (front edge of each step — slightly brighter)
            g.fillStyle(0x8a8a98, 1);
            g.fillRect(s.x, s.y, s.w + 1, 2);

            // Anti-slip texture (subtle lines on tread)
            g.lineStyle(1, 0x666676, 0.2);
            for (let lx = s.x + 8; lx < s.x + s.w - 4; lx += 10) {
                g.beginPath();
                g.moveTo(lx, s.y + 2);
                g.lineTo(lx, s.y + 5);
                g.strokePath();
            }

            // Shadow under the nosing onto the riser below
            g.fillStyle(0x000000, 0.12);
            g.fillRect(s.x, s.y + 6, s.w, 4);

            // Vertical shadow on left edge of riser (depth cue)
            g.fillStyle(0x000000, 0.08);
            g.fillRect(s.x, s.y, 3, s.h);
        }

        // ---- Floor ----
        const floorY = ld.endY;
        // Floor surface
        g.fillStyle(0x5a5a68, 1);
        g.fillRect(ld.endX, floorY, ld.flatEndX - ld.endX + 500, 8);

        // Floor body
        g.fillStyle(0x484858, 1);
        g.fillRect(ld.endX, floorY + 8, ld.flatEndX - ld.endX + 500, depth);

        // Floor surface highlight
        g.fillStyle(0x6a6a78, 1);
        g.fillRect(ld.endX, floorY, ld.flatEndX - ld.endX + 500, 2);

        // Floor texture — subtle concrete grain
        g.lineStyle(1, 0x4e4e5e, 0.15);
        for (let fx = ld.endX; fx < ld.flatEndX + 200; fx += 60) {
            g.beginPath();
            g.moveTo(fx, floorY + 2);
            g.lineTo(fx + 25, floorY + 6);
            g.strokePath();
        }

        // Floor below stairs continuation
        g.fillStyle(0x484858, 1);
        g.fillRect(ld.startX - 200, floorY + 8, ld.endX - ld.startX + 200, depth);

        // ---- Landing transition seam ----
        g.lineStyle(2, 0x3a3a48, 0.6);
        g.beginPath();
        g.moveTo(ld.endX, floorY);
        g.lineTo(ld.endX, floorY + depth);
        g.strokePath();

        // ---- Mark (gaffer tape X on the floor surface) ----
        const mx = ld.markX;
        const my = floorY;
        // Tape X — flat on the ground (drawn on the floor surface strip)
        g.lineStyle(4, 0xdd2222, 0.85);
        g.beginPath();
        g.moveTo(mx - 18, my + 1); g.lineTo(mx + 18, my + 7);
        g.moveTo(mx + 18, my + 1); g.lineTo(mx - 18, my + 7);
        g.strokePath();
        // Tape highlight
        g.lineStyle(1, 0xff5555, 0.3);
        g.beginPath();
        g.moveTo(mx - 16, my + 2); g.lineTo(mx + 16, my + 6);
        g.moveTo(mx + 16, my + 2); g.lineTo(mx - 16, my + 6);
        g.strokePath();

        // Handrail (metal pipe along the stairs)
        g.lineStyle(4, 0x777788, 0.7);
        g.beginPath();
        g.moveTo(ld.startX - 5, ld.startY - 60);
        g.lineTo(ld.endX - 5, ld.endY - 60);
        g.strokePath();
        // Handrail supports (vertical posts)
        g.lineStyle(3, 0x666677, 0.5);
        for (let i = 0; i < steps.length; i += 4) {
            const s = steps[i];
            g.beginPath();
            g.moveTo(s.x + 5, s.y);
            g.lineTo(s.x + 5, s.y - 62);
            g.strokePath();
        }
        // Handrail top cap
        g.lineStyle(2, 0x8888998, 0.4);
        g.beginPath();
        g.moveTo(ld.startX - 5, ld.startY - 62);
        g.lineTo(ld.endX - 5, ld.endY - 62);
        g.strokePath();
    }

    // ================================================================
    // CREW
    // ================================================================
    drawCrewScene(tier, p) {
        const g = this.crewGfx;
        g.clear();
        const cx = this.levelData.cameraX;
        const cy = this.levelData.endY;
        p = p || 0;
        const H = CONFIG.PERSON_HEIGHT;
        const t = this.crashAnimTime || 0;
        // Crew base positions — far enough RIGHT of camera that player never overlaps
        const crew1X = cx + H*0.55;  // camera operator
        const crew2X = cx + H*0.85;  // focus puller
        const crew3X = cx + H*1.15;  // director

        if (tier <= 1) {
            // Tier 1: Wobble — camera shakes, crew annoyed
            const tilt = Math.sin(t*20) * 0.03 * Math.max(0, 1-t*2);
            this.drawCameraRig(g, cx, cy, tilt, 0);
            this.drawCrewPerson(g, crew1X, cy, 0x4a4a5a, false, false, 0, 0, 0, 'lean_left');
            this.drawCrewPerson(g, crew2X, cy, 0x5a4a3a, false, false, 0, 0, 0, 'standing');
            this.drawCrewPerson(g, crew3X, cy, 0x2a2a3a, true, true, 0, 0, 0, 'confident');
        } else if (tier === 2) {
            // Tier 2: Camera tilts, crew steps back and looks angry
            const prog = Math.min(t*2, 1);
            const tilt = prog * 0.35;
            const step = prog * 60;  // step away distance
            this.drawCameraRig(g, cx, cy, tilt, 0);
            // Crew moved further right, angry poses
            this.drawCrewPerson(g, crew1X + step, cy, 0x4a4a5a, false, false, 0, 1, 0, 'standing');
            this.drawCrewPerson(g, crew2X + step*0.7, cy, 0x5a4a3a, false, false, 0, 1, 0, 'standing');
            this.drawCrewPerson(g, crew3X + step*0.4, cy, 0x2a2a3a, true, true, 0, 0, 0, 'confident');
        } else if (tier === 3) {
            // Tier 3: Camera topples, crew scrambles away
            const prog = Math.min(t*1.5, 1);
            const tilt = prog * 1.57;
            const drop = prog * 30;
            const scatter = prog * 120;
            this.drawCameraRig(g, cx, cy, tilt, drop);
            this.drawCrewPerson(g, crew1X + scatter, cy, 0x4a4a5a, false, false, 0, 2, 0, 'standing');
            this.drawCrewPerson(g, crew2X + scatter*0.8, cy, 0x5a4a3a, false, false, 0, 2, 0, 'standing');
            this.drawCrewPerson(g, crew3X + scatter*0.5, cy, 0x2a2a3a, true, true, 0, 1, 0, 'confident');
        } else {
            // Tier 4-5: FULL CHAOS — everything destroyed
            const impactT = Math.min(t * 2.0, 1);
            const afterT = Math.max(0, Math.min((t - 0.3) * 1.2, 1));
            const settleT = Math.max(0, Math.min((t - 1.0) * 0.8, 1));
            const isBulldoze = tier >= 5;

            // === CAMERA RIG — crashes over and slides ===
            const tilt = impactT * 1.57;
            const camDrop = impactT * 50;
            const camSlide = afterT * (isBulldoze ? 130 : 60);
            this.drawCameraRig(g, cx + camSlide, cy, tilt, camDrop);
            // Tripod debris scattered on ground
            if (afterT > 0.2) {
                g.lineStyle(4, 0x4a4a4a, 0.5);
                g.beginPath();
                g.moveTo(cx + 30, cy - 3); g.lineTo(cx + 110, cy + 2);
                g.moveTo(cx + 40, cy + 1); g.lineTo(cx - 20, cy + 4);
                g.strokePath();
            }

            // === CAMERA OPERATOR — knocked out, lying on ground far right ===
            {
                const koX = crew1X + 80 + afterT * 40;
                if (impactT < 0.5) {
                    // Getting knocked — falling arc
                    const fallProg = impactT * 2;
                    const arcX = crew1X + fallProg * 80;
                    this.drawCrewPerson(g, arcX, cy, 0x4a4a5a, false, false, 0, 2, 0, 'standing');
                } else {
                    // Knocked out — lying face down
                    g.lineStyle(H*0.035, 0x4a4a5a, 1);
                    g.beginPath(); g.moveTo(koX - H*0.14, cy - H*0.03); g.lineTo(koX + H*0.14, cy - H*0.02); g.strokePath();
                    g.lineStyle(H*0.028, 0x4a4a5a, 1);
                    g.beginPath();
                    g.moveTo(koX + H*0.14, cy - H*0.02); g.lineTo(koX + H*0.26, cy - H*0.008);
                    g.moveTo(koX + H*0.12, cy); g.lineTo(koX + H*0.24, cy + H*0.015);
                    g.strokePath();
                    g.lineStyle(H*0.018, 0xd4a87c, 1);
                    g.beginPath();
                    g.moveTo(koX - H*0.12, cy - H*0.03); g.lineTo(koX - H*0.19, cy + H*0.01);
                    g.moveTo(koX - H*0.07, cy - H*0.01); g.lineTo(koX - H*0.15, cy - H*0.05);
                    g.strokePath();
                    g.fillStyle(0x3a2a1a, 1);
                    g.fillCircle(koX - H*0.17, cy - H*0.03, H*0.038);
                    g.fillStyle(0x1a1a1a, 1);
                    g.fillCircle(koX + H*0.26, cy - H*0.008, H*0.013);
                    g.fillCircle(koX + H*0.24, cy + H*0.015, H*0.013);
                    // Stars circling head (unconscious)
                    if (settleT > 0) {
                        for (let i = 0; i < 3; i++) {
                            const sa = t * 3 + i * 2.09;
                            g.fillStyle(0xffff44, 0.6);
                            g.fillCircle(koX - H*0.17 + Math.cos(sa)*H*0.05, cy - H*0.08 + Math.sin(sa)*H*0.025, 2.5);
                        }
                    }
                }
            }

            // === FOCUS PULLER — crawling away on all fours, far right ===
            {
                if (impactT < 0.35) {
                    // Falling down
                    const fallP = impactT / 0.35;
                    const fX = crew2X + fallP * 50;
                    const fY = cy;
                    // Crouching down
                    this.drawCrewPerson(g, fX, fY, 0x5a4a3a, false, false, 0, 2, 0, 'standing');
                } else {
                    const crawlDist = afterT * H * 0.6;
                    const crawlX = crew2X + 80 + crawlDist;
                    const bob = Math.sin(t * 8) * 3;
                    const limb = Math.sin(t * 6);
                    const torsoY = cy - H*0.11 + bob;
                    g.lineStyle(H*0.055, 0x5a4a3a, 1);
                    g.beginPath(); g.moveTo(crawlX - H*0.09, torsoY); g.lineTo(crawlX + H*0.09, torsoY); g.strokePath();
                    g.lineStyle(H*0.028, 0x5a4a3a, 1);
                    g.beginPath();
                    g.moveTo(crawlX - H*0.09, torsoY); g.lineTo(crawlX - H*0.14 + limb*H*0.03, cy);
                    g.moveTo(crawlX - H*0.05, torsoY); g.lineTo(crawlX - H*0.09 - limb*H*0.03, cy);
                    g.strokePath();
                    g.lineStyle(H*0.020, 0xd4a87c, 1);
                    g.beginPath();
                    g.moveTo(crawlX + H*0.07, torsoY); g.lineTo(crawlX + H*0.14 - limb*H*0.025, cy);
                    g.moveTo(crawlX + H*0.05, torsoY); g.lineTo(crawlX + H*0.11 + limb*H*0.025, cy);
                    g.strokePath();
                    g.fillStyle(0xd4a87c, 1);
                    g.fillCircle(crawlX + H*0.14 - limb*H*0.025, cy, H*0.011);
                    g.fillCircle(crawlX + H*0.11 + limb*H*0.025, cy, H*0.011);
                    // Head looking back (terrified)
                    const hx = crawlX + H*0.13, hy = torsoY - H*0.015;
                    g.fillStyle(0x3a2a1a, 1);
                    g.fillCircle(hx, hy, H*0.037);
                    g.fillStyle(0xd4a87c, 1);
                    g.fillCircle(hx + H*0.008, hy + H*0.005, H*0.030);
                    g.fillStyle(0xffffff, 1);
                    g.fillCircle(hx + H*0.015, hy, H*0.009);
                    g.fillStyle(0x222222, 1);
                    g.fillCircle(hx + H*0.017, hy, H*0.004);
                    // Knees
                    g.fillStyle(0x5a4a3a, 0.5);
                    g.fillCircle(crawlX - H*0.14 + limb*H*0.03, cy, H*0.014);
                    g.fillCircle(crawlX - H*0.09 - limb*H*0.03, cy, H*0.014);
                }
            }

            // === DIRECTOR — stumbling far right, angry, shaking fist ===
            {
                const stumbleDist = afterT * (isBulldoze ? H*0.9 : H*0.5);
                const dirX = crew3X + stumbleDist;
                // Standing but furious — use drawCrewPerson in panic mode far away
                this.drawCrewPerson(g, dirX, cy, 0x2a2a3a, true, true, 0, 2, 0, 'confident');
            }
        }
    }

    drawCameraRig(g, cx, cy, tilt, drop) {
        const H = CONFIG.PERSON_HEIGHT;
        const S = H / 300; // scale factor relative to baseline
        const py = cy - H*0.38 + drop;

        // Tripod legs
        g.lineStyle(5*S, 0x4a4a4a, 1);
        g.beginPath();
        g.moveTo(cx, py); g.lineTo(cx - 55*S, cy);
        g.moveTo(cx, py); g.lineTo(cx + 55*S, cy);
        g.moveTo(cx, py); g.lineTo(cx + 8*S, cy);
        g.strokePath();
        g.fillStyle(0x3a3a3a, 1);
        g.fillCircle(cx, py, 12*S);

        // Camera body
        const armLen = 60*S;
        const bx = cx + Math.sin(tilt) * armLen;
        const by = py - Math.cos(tilt) * armLen + drop;
        g.fillStyle(0x222226, 1);
        g.fillCircle(bx + 4*S, by + 4*S, 40*S);
        g.fillStyle(0x3a3a42, 1);
        g.fillCircle(bx, by, 38*S);
        g.fillStyle(0x44444c, 1);
        g.fillRect(bx - 30*S, by - 22*S, 60*S, 44*S);
        g.fillStyle(0x333338, 1);
        g.fillRect(bx - 12*S, by - 36*S, 24*S, 16*S);

        // Lens
        const lx = bx - Math.cos(tilt) * 58*S;
        const ly = by + Math.sin(tilt) * 58*S;
        g.fillStyle(0x2a2a35, 1);
        g.fillCircle(lx, ly, 22*S);
        g.fillStyle(0x3a4a6a, 0.8);
        g.fillCircle(lx, ly, 16*S);
        g.fillStyle(0x5577aa, 0.6);
        g.fillCircle(lx, ly, 11*S);
        g.fillStyle(0xaaccff, 0.25);
        g.fillCircle(lx - 4*S, ly - 4*S, 5*S);

        // Viewfinder
        const vx = bx + Math.cos(tilt) * 38*S + Math.sin(tilt) * 22*S;
        const vy = by - Math.sin(tilt) * 38*S + Math.cos(tilt) * 22*S;
        g.fillStyle(0x333336, 1);
        g.fillRect(vx - 9*S, vy - 9*S, 18*S, 18*S);
        g.fillStyle(0x88aacc, 0.3);
        g.fillRect(vx - 6*S, vy - 6*S, 12*S, 12*S);

        g.fillStyle(0xff2222, 0.8);
        g.fillCircle(bx + 28*S, by - 18*S, 4*S);
    }

    drawCrewPerson(g, baseX, baseY, bodyCol, hasBeret, hasMonitor, scatter, panic, fly, pose) {
        const H = CONFIG.PERSON_HEIGHT;
        const skin = 0xd4a87c, skinDark = 0xc09670, hair = 0x3a2a1a;
        const bodyDark = Phaser.Display.Color.IntegerToColor(bodyCol).darken(20).color;
        const sx = (baseX > this.levelData.cameraX ? scatter : -scatter * 0.6);
        const fx = fly * (baseX > this.levelData.cameraX ? 80 : -70);
        const fy = fly * -70;
        const bx = baseX + sx + fx;
        const by = baseY + fy;
        const lean = panic > 0 ? (baseX > this.levelData.cameraX ? scatter * 0.012 : -scatter * 0.012) : 0;

        // Pose offsets
        const isLeanL = pose === 'lean_left' && panic === 0;
        const isLeanR = pose === 'lean_right' && panic === 0;
        const isConf = pose === 'confident' && panic === 0;
        const torsoLean = isLeanL ? -0.08 : isLeanR ? 0.08 : 0;
        const legSpread = panic >= 2 ? H*0.06 : isConf ? H*0.045 : H*0.035;

        // Shadow
        g.fillStyle(0x000000, 0.15);
        g.fillEllipse(bx, baseY + 3, H*0.09, H*0.018);

        // Shoes
        g.fillStyle(0x1a1a1a, 1);
        g.fillRect(bx - legSpread - H*0.02 + lean*4, by - H*0.008, H*0.05, H*0.022);
        g.fillRect(bx + legSpread - H*0.03 + lean*4, by - H*0.008, H*0.05, H*0.022);

        // Legs
        const hipX = bx + lean*3 + torsoLean * H*0.1;
        const hipY = by - H*0.28;
        g.lineStyle(H*0.035, bodyCol, 1);
        g.beginPath();
        g.moveTo(hipX - H*0.01, hipY); g.lineTo(bx - legSpread + lean*4, by);
        g.moveTo(hipX + H*0.01, hipY); g.lineTo(bx + legSpread + lean*4, by);
        g.strokePath();

        // Belt
        g.fillStyle(0x222222, 1);
        g.fillRect(hipX - H*0.05, hipY - H*0.01, H*0.10, H*0.016);

        // Torso
        const shoulderX = hipX + torsoLean * H*0.6;
        const shoulderY = by - H*0.64;
        g.lineStyle(H*0.10, bodyCol, 1);
        g.beginPath();
        g.moveTo(hipX, hipY);
        g.lineTo(shoulderX, shoulderY);
        g.strokePath();
        // Shoulder line
        g.lineStyle(H*0.04, bodyCol, 1);
        g.beginPath();
        g.moveTo(shoulderX - H*0.08, shoulderY);
        g.lineTo(shoulderX + H*0.08, shoulderY);
        g.strokePath();

        // Arms
        g.lineStyle(H*0.025, skin, 1);
        if (panic === 0) {
            if (isConf) {
                // Arms crossed
                g.lineStyle(H*0.026, bodyCol, 1);
                g.beginPath();
                g.moveTo(shoulderX - H*0.08, shoulderY); g.lineTo(shoulderX + H*0.04, shoulderY + H*0.12);
                g.moveTo(shoulderX + H*0.08, shoulderY); g.lineTo(shoulderX - H*0.04, shoulderY + H*0.10);
                g.strokePath();
                g.lineStyle(H*0.022, skin, 1);
                g.beginPath();
                g.moveTo(shoulderX + H*0.04, shoulderY + H*0.12); g.lineTo(shoulderX + H*0.06, shoulderY + H*0.08);
                g.moveTo(shoulderX - H*0.04, shoulderY + H*0.10); g.lineTo(shoulderX - H*0.06, shoulderY + H*0.06);
                g.strokePath();
            } else if (isLeanR) {
                // Leaning toward camera — one hand extended
                g.lineStyle(H*0.026, bodyCol, 1);
                g.beginPath();
                g.moveTo(shoulderX - H*0.08, shoulderY); g.lineTo(shoulderX - H*0.04, shoulderY + H*0.14);
                g.strokePath();
                g.lineStyle(H*0.022, skin, 1);
                g.beginPath();
                g.moveTo(shoulderX - H*0.04, shoulderY + H*0.14); g.lineTo(shoulderX - H*0.08, shoulderY + H*0.18);
                g.strokePath();
                // Right hand on camera
                g.lineStyle(H*0.026, bodyCol, 1);
                g.beginPath();
                g.moveTo(shoulderX + H*0.08, shoulderY); g.lineTo(shoulderX + H*0.02, shoulderY + H*0.12);
                g.strokePath();
            } else {
                // Hands at sides (focus puller)
                g.lineStyle(H*0.026, bodyCol, 1);
                g.beginPath();
                g.moveTo(shoulderX - H*0.08, shoulderY); g.lineTo(shoulderX - H*0.12, shoulderY + H*0.14);
                g.moveTo(shoulderX + H*0.08, shoulderY); g.lineTo(shoulderX + H*0.04, shoulderY + H*0.16);
                g.strokePath();
                g.lineStyle(H*0.022, skin, 1);
                g.beginPath();
                g.moveTo(shoulderX - H*0.12, shoulderY + H*0.14); g.lineTo(shoulderX - H*0.10, shoulderY + H*0.20);
                g.moveTo(shoulderX + H*0.04, shoulderY + H*0.16); g.lineTo(shoulderX + H*0.02, shoulderY + H*0.22);
                g.strokePath();
                g.fillStyle(skin, 1);
                g.fillCircle(shoulderX - H*0.10, shoulderY + H*0.20, H*0.014);
                g.fillCircle(shoulderX + H*0.02, shoulderY + H*0.22, H*0.014);
            }
        } else if (panic === 1) {
            // Startled — hands up defensively
            g.lineStyle(H*0.025, bodyCol, 1);
            g.beginPath();
            g.moveTo(shoulderX - H*0.08, shoulderY); g.lineTo(shoulderX - H*0.10, shoulderY - H*0.06);
            g.moveTo(shoulderX + H*0.08, shoulderY); g.lineTo(shoulderX + H*0.10, shoulderY - H*0.06);
            g.strokePath();
            g.lineStyle(H*0.020, skin, 1);
            g.beginPath();
            g.moveTo(shoulderX - H*0.10, shoulderY - H*0.06); g.lineTo(shoulderX - H*0.12, shoulderY - H*0.10);
            g.moveTo(shoulderX + H*0.10, shoulderY - H*0.06); g.lineTo(shoulderX + H*0.12, shoulderY - H*0.10);
            g.strokePath();
        } else {
            // Angry — one arm pointing LEFT (at player), other fist clenched
            const shake = Math.sin((this.crashAnimTime || 0) * 10) * H*0.01;
            // Left arm pointing at player (accusingly)
            g.lineStyle(H*0.026, bodyCol, 1);
            g.beginPath();
            g.moveTo(shoulderX - H*0.08, shoulderY); g.lineTo(shoulderX - H*0.14, shoulderY + H*0.04);
            g.strokePath();
            g.lineStyle(H*0.022, skin, 1);
            g.beginPath();
            g.moveTo(shoulderX - H*0.14, shoulderY + H*0.04); g.lineTo(shoulderX - H*0.22, shoulderY + H*0.02 + shake);
            g.strokePath();
            g.fillStyle(skin, 1);
            g.fillCircle(shoulderX - H*0.22, shoulderY + H*0.02 + shake, H*0.010);
            // Right arm — fist clenched at side, shaking
            g.lineStyle(H*0.026, bodyCol, 1);
            g.beginPath();
            g.moveTo(shoulderX + H*0.08, shoulderY); g.lineTo(shoulderX + H*0.06, shoulderY + H*0.10);
            g.strokePath();
            g.lineStyle(H*0.022, skin, 1);
            g.beginPath();
            g.moveTo(shoulderX + H*0.06, shoulderY + H*0.10); g.lineTo(shoulderX + H*0.08, shoulderY + H*0.15 + shake);
            g.strokePath();
            g.fillStyle(skin, 1);
            g.fillCircle(shoulderX + H*0.08, shoulderY + H*0.15 + shake, H*0.012);
        }

        // Neck
        g.fillStyle(skin, 1);
        const neckX = shoulderX;
        g.fillRect(neckX - H*0.014, shoulderY - H*0.05, H*0.028, H*0.05);

        // Head
        const headR = H * 0.05;
        const headX = neckX;
        const headY = shoulderY - H*0.10;
        g.fillStyle(skin, 1);
        g.fillCircle(headX, headY, headR);
        // Hair
        g.fillStyle(hair, 1);
        g.fillCircle(headX, headY - headR*0.3, headR*0.88);
        g.fillRect(headX - headR*0.9, headY - headR*0.7, headR*1.8, headR*0.5);
        g.fillStyle(skin, 1);
        g.fillCircle(headX, headY + headR*0.15, headR*0.82);
        // Ear
        g.fillStyle(skinDark, 1);
        g.fillCircle(headX + headR*0.88, headY, headR*0.18);
        // Eyes
        g.fillStyle(0xffffff, 1);
        g.fillCircle(headX - headR*0.3, headY, headR*0.16);
        g.fillCircle(headX + headR*0.3, headY, headR*0.16);
        g.fillStyle(0x222222, 1);
        g.fillCircle(headX - headR*0.26, headY, headR*0.08);
        g.fillCircle(headX + headR*0.26, headY, headR*0.08);
        // Eyebrows
        g.lineStyle(H*0.004, hair, 0.6);
        g.beginPath();
        g.moveTo(headX - headR*0.45, headY - headR*0.25); g.lineTo(headX - headR*0.1, headY - headR*0.28);
        g.moveTo(headX + headR*0.1, headY - headR*0.28); g.lineTo(headX + headR*0.45, headY - headR*0.25);
        g.strokePath();
        // Mouth
        g.lineStyle(H*0.003, 0x995544, 0.5);
        g.beginPath();
        g.moveTo(headX - headR*0.2, headY + headR*0.35); g.lineTo(headX + headR*0.2, headY + headR*0.35);
        g.strokePath();

        if (hasBeret) {
            g.fillStyle(0x111111, 1);
            g.fillEllipse(headX - headR*0.15, headY - headR*0.7, headR*1.2, headR*0.38);
            g.fillRect(headX - headR*1.1, headY - headR*0.7, headR*2.1, H*0.01);
        }

        if (hasMonitor && panic < 3) {
            const monX = shoulderX - H*0.16;
            const monY = shoulderY + H*0.04;
            g.fillStyle(0x2a2a35, 1);
            g.fillRect(monX, monY, H*0.07, H*0.05);
            g.fillStyle(0x5577aa, 0.5);
            g.fillRect(monX + H*0.005, monY + H*0.005, H*0.06, H*0.04);
            g.fillStyle(0x88bbee, 0.15);
            g.fillRect(monX + H*0.008, monY + H*0.008, H*0.054, H*0.034);
        }
    }

    // ================================================================
    // PLAYER DRAWING
    // ================================================================
    drawPlayer(x, y, rotation) {
        const g = this.playerGfx;
        g.clear();
        if (this.playerState === 'idle') this.drawStanding(g, x, y);
        else if (this.playerState === 'stopped' || this.playerState === 'crashed') this.drawLying(g, x, y);
        else this.drawRolling(g, x, y, rotation);
    }

    drawStanding(g, x, y) {
        const H = CONFIG.PERSON_HEIGHT;
        const skin = 0xd4a87c, skinDark = 0xc09670, shirt = 0x3b5998, shirtDark = 0x2d4578;
        const pants = 0x33333f, pantsDark = 0x282832, hair = 0x2a1a0a, shoe = 0x1a1a1a;
        const headR = H * 0.058;
        const sw = H * 0.05;

        // Shadow
        g.fillStyle(0x000000, 0.2);
        g.fillEllipse(x, y + 4, H * 0.12, H * 0.02);

        // Shoes
        g.fillStyle(shoe, 1);
        g.fillRect(x - sw - H*0.02, y - H*0.01, H*0.06, H*0.03);
        g.fillRect(x + sw - H*0.04, y - H*0.01, H*0.06, H*0.03);
        // Shoe soles
        g.fillStyle(0x333333, 1);
        g.fillRect(x - sw - H*0.02, y + H*0.015, H*0.06, H*0.008);
        g.fillRect(x + sw - H*0.04, y + H*0.015, H*0.06, H*0.008);

        // Legs — left (back)
        g.lineStyle(H*0.038, pantsDark, 1);
        g.beginPath();
        g.moveTo(x - H*0.02, y - H*0.42); g.lineTo(x - sw, y - H*0.21);
        g.strokePath();
        g.lineStyle(H*0.032, pantsDark, 1);
        g.beginPath();
        g.moveTo(x - sw, y - H*0.21); g.lineTo(x - sw, y + 2);
        g.strokePath();
        // Legs — right (front)
        g.lineStyle(H*0.038, pants, 1);
        g.beginPath();
        g.moveTo(x + H*0.02, y - H*0.42); g.lineTo(x + sw, y - H*0.21);
        g.strokePath();
        g.lineStyle(H*0.032, pants, 1);
        g.beginPath();
        g.moveTo(x + sw, y - H*0.21); g.lineTo(x + sw, y + 2);
        g.strokePath();

        // Belt
        g.fillStyle(0x2a2222, 1);
        g.fillRect(x - H*0.055, y - H*0.44, H*0.11, H*0.018);
        // Belt buckle
        g.fillStyle(0x888877, 1);
        g.fillRect(x - H*0.01, y - H*0.438, H*0.02, H*0.014);

        // Torso
        g.fillStyle(shirt, 1);
        g.fillRect(x - H*0.06, y - H*0.70, H*0.12, H*0.27);
        // Torso shadow (right side)
        g.fillStyle(shirtDark, 0.4);
        g.fillRect(x + H*0.02, y - H*0.70, H*0.04, H*0.27);
        // Collar
        g.fillStyle(skin, 1);
        g.beginPath();
        g.moveTo(x - H*0.035, y - H*0.70);
        g.lineTo(x, y - H*0.66);
        g.lineTo(x + H*0.035, y - H*0.70);
        g.closePath();
        g.fillPath();

        // Shoulders
        g.fillStyle(shirt, 1);
        g.fillRect(x - H*0.09, y - H*0.70, H*0.18, H*0.035);
        g.fillStyle(shirtDark, 0.3);
        g.fillRect(x - H*0.09, y - H*0.67, H*0.18, H*0.01);

        // Arms — back arm first
        g.lineStyle(H*0.028, shirtDark, 1);
        g.beginPath();
        g.moveTo(x - H*0.09, y - H*0.68); g.lineTo(x - H*0.10, y - H*0.55);
        g.strokePath();
        g.lineStyle(H*0.022, skinDark, 1);
        g.beginPath();
        g.moveTo(x - H*0.10, y - H*0.55); g.lineTo(x - H*0.08, y - H*0.44);
        g.strokePath();
        g.fillStyle(skinDark, 1);
        g.fillCircle(x - H*0.08, y - H*0.44, H*0.016);
        // Arms — front arm
        g.lineStyle(H*0.03, shirt, 1);
        g.beginPath();
        g.moveTo(x + H*0.09, y - H*0.68); g.lineTo(x + H*0.10, y - H*0.55);
        g.strokePath();
        g.lineStyle(H*0.024, skin, 1);
        g.beginPath();
        g.moveTo(x + H*0.10, y - H*0.55); g.lineTo(x + H*0.08, y - H*0.44);
        g.strokePath();
        g.fillStyle(skin, 1);
        g.fillCircle(x + H*0.08, y - H*0.44, H*0.018);

        // Neck
        g.fillStyle(skin, 1);
        g.fillRect(x - H*0.018, y - H*0.76, H*0.036, H*0.06);

        // Head
        g.fillStyle(skin, 1);
        g.fillCircle(x, y - H*0.82, headR);
        // Hair
        g.fillStyle(hair, 1);
        g.fillCircle(x, y - H*0.85, headR * 0.92);
        g.fillRect(x - headR, y - H*0.88, headR*2, headR*0.5);
        g.fillStyle(skin, 1);
        g.fillCircle(x, y - H*0.80, headR * 0.85);
        // Ear
        g.fillStyle(skinDark, 1);
        g.fillCircle(x + headR*0.9, y - H*0.82, headR*0.2);
        // Eyes (white + iris)
        g.fillStyle(0xffffff, 1);
        g.fillCircle(x - headR*0.32, y - H*0.82, headR*0.2);
        g.fillCircle(x + headR*0.32, y - H*0.82, headR*0.2);
        g.fillStyle(0x443322, 1);
        g.fillCircle(x - headR*0.28, y - H*0.82, headR*0.12);
        g.fillCircle(x + headR*0.28, y - H*0.82, headR*0.12);
        g.fillStyle(0x111111, 1);
        g.fillCircle(x - headR*0.28, y - H*0.82, headR*0.06);
        g.fillCircle(x + headR*0.28, y - H*0.82, headR*0.06);
        // Eyebrows
        g.lineStyle(H*0.005, hair, 0.7);
        g.beginPath();
        g.moveTo(x - headR*0.48, y - H*0.84); g.lineTo(x - headR*0.12, y - H*0.845);
        g.moveTo(x + headR*0.12, y - H*0.845); g.lineTo(x + headR*0.48, y - H*0.84);
        g.strokePath();
        // Nose (small line)
        g.lineStyle(1, skinDark, 0.4);
        g.beginPath();
        g.moveTo(x, y - H*0.81); g.lineTo(x + headR*0.08, y - H*0.80);
        g.strokePath();
        // Mouth
        g.lineStyle(H*0.004, 0x995544, 0.6);
        g.beginPath();
        g.moveTo(x - headR*0.22, y - H*0.79); g.lineTo(x + headR*0.22, y - H*0.79);
        g.strokePath();
    }

    drawLying(g, x, y) {
        const skin = 0xd4a87c, skinDark = 0xc09670, shirt = 0x3b5998, shirtDark = 0x2d4578;
        const pants = 0x33333f, pantsDark = 0x282832, hair = 0x2a1a0a, shoe = 0x1a1a1a;
        const H = CONFIG.PERSON_HEIGHT;
        const showThumb = this.stopTime > CONFIG.STOP_BEAT_DURATION / 1000;
        const thumbProg = showThumb ? Math.min((this.stopTime - CONFIG.STOP_BEAT_DURATION / 1000) * 1.8, 1) : 0;

        // Shadow
        g.fillStyle(0x000000, 0.18);
        g.fillEllipse(x, y + 4, H*0.14, H*0.02);

        if (!showThumb) {
            // === LYING FLAT — face down, motionless beat ===
            const by = y - H*0.04;

            // Legs
            g.lineStyle(H*0.04, pants, 1);
            g.beginPath();
            g.moveTo(x - H*0.05, by); g.lineTo(x - H*0.30, by + 3);
            g.strokePath();
            g.lineStyle(H*0.035, pantsDark, 1);
            g.beginPath();
            g.moveTo(x - H*0.05, by + H*0.035); g.lineTo(x - H*0.28, by + H*0.04);
            g.strokePath();
            // Shoes
            g.fillStyle(shoe, 1);
            g.fillRect(x - H*0.33, by - H*0.01, H*0.05, H*0.035);
            g.fillRect(x - H*0.31, by + H*0.025, H*0.05, H*0.035);

            // Torso
            g.fillStyle(shirt, 1);
            g.fillRect(x - H*0.06, by - H*0.07, H*0.20, H*0.11);
            g.fillStyle(shirtDark, 1);
            g.fillRect(x - H*0.06, by - H*0.02, H*0.20, H*0.04);

            // Arms splayed
            g.lineStyle(H*0.025, skin, 1);
            g.beginPath();
            g.moveTo(x + H*0.10, by - H*0.04); g.lineTo(x + H*0.18, by - H*0.08);
            g.moveTo(x - H*0.04, by - H*0.04); g.lineTo(x - H*0.10, by + H*0.03);
            g.strokePath();

            // Head (face down)
            const headR = H * 0.05;
            g.fillStyle(hair, 1);
            g.fillCircle(x + H*0.17, by - H*0.03, headR);
            g.fillStyle(skin, 0.5);
            g.fillCircle(x + H*0.18, by - H*0.01, headR*0.6);
        } else {
            // === SITTING UP — thumbs up pose ===
            const armProg = Math.max((thumbProg - 0.5) / 0.5, 0);
            const by = y;
            const headR = H * 0.05;

            // Key body points
            const hipX = x;
            const hipY = by - H*0.01;
            const torsoAngle = -0.18;
            const torsoLen = H * 0.23;
            const shoulderX = hipX + Math.sin(torsoAngle) * torsoLen;
            const shoulderY = hipY - Math.cos(torsoAngle) * torsoLen;

            // === LEGS (behind jacket) ===
            // Back leg
            g.lineStyle(H*0.036, pantsDark, 1);
            g.beginPath();
            g.moveTo(hipX + H*0.01, hipY); g.lineTo(x + H*0.19, by + H*0.005);
            g.strokePath();
            // Front leg
            g.lineStyle(H*0.04, pants, 1);
            g.beginPath();
            g.moveTo(hipX, hipY); g.lineTo(x + H*0.21, by - H*0.01);
            g.strokePath();
            // Shoes
            g.fillStyle(shoe, 1);
            g.fillRect(x + H*0.19, by - H*0.005, H*0.045, H*0.02);
            g.fillRect(x + H*0.17, by + H*0.005, H*0.045, H*0.02);

            // === JACKET — filled polygon covering torso+hips as one piece ===
            g.fillStyle(shirt, 1);
            g.beginPath();
            // Right shoulder
            g.moveTo(shoulderX + H*0.065, shoulderY);
            // Down the right side of torso
            g.lineTo(hipX + H*0.055, hipY - H*0.02);
            // Across the hip/waist (jacket bottom)
            g.lineTo(hipX - H*0.04, hipY + H*0.01);
            // Up the left side (back)
            g.lineTo(shoulderX - H*0.065, shoulderY + H*0.02);
            // Across the shoulders
            g.lineTo(shoulderX + H*0.065, shoulderY);
            g.closePath();
            g.fillPath();
            // Jacket shadow on right side
            g.fillStyle(shirtDark, 0.3);
            g.beginPath();
            g.moveTo(shoulderX + H*0.03, shoulderY);
            g.lineTo(hipX + H*0.03, hipY - H*0.02);
            g.lineTo(hipX + H*0.055, hipY - H*0.02);
            g.lineTo(shoulderX + H*0.065, shoulderY);
            g.closePath();
            g.fillPath();
            // Collar V
            g.fillStyle(skin, 1);
            g.beginPath();
            g.moveTo(shoulderX - H*0.025, shoulderY - H*0.005);
            g.lineTo(shoulderX, shoulderY + H*0.03);
            g.lineTo(shoulderX + H*0.025, shoulderY - H*0.005);
            g.closePath();
            g.fillPath();
            // Belt at bottom of jacket
            g.fillStyle(0x222222, 0.6);
            const beltY = hipY - H*0.015;
            g.fillRect(hipX - H*0.04, beltY, H*0.09, H*0.012);

            // === SUPPORT ARM (left, behind body, propping up) ===
            g.lineStyle(H*0.024, shirt, 1);
            g.beginPath();
            g.moveTo(shoulderX - H*0.06, shoulderY + H*0.01);
            g.lineTo(shoulderX - H*0.13, hipY - H*0.03);
            g.strokePath();
            g.lineStyle(H*0.02, skin, 1);
            g.beginPath();
            g.moveTo(shoulderX - H*0.13, hipY - H*0.03);
            g.lineTo(shoulderX - H*0.15, by + H*0.01);
            g.strokePath();
            g.fillStyle(skin, 1);
            g.fillCircle(shoulderX - H*0.15, by + H*0.01, H*0.012);

            // === THUMBS UP ARM (right) ===
            const rsx = shoulderX + H*0.06;
            const rsy = shoulderY + H*0.01;
            if (armProg > 0) {
                // Upper arm rises up and forward
                const elbowX = rsx + H*0.04 * armProg;
                const elbowY = rsy - H*0.11 * armProg;
                // Forearm angled slightly (not perfectly vertical — reads better)
                const wristX = elbowX + H*0.02 * armProg;
                const wristY = elbowY - H*0.11 * armProg;

                // Upper arm (sleeve)
                g.lineStyle(H*0.032, shirt, 1);
                g.beginPath(); g.moveTo(rsx, rsy); g.lineTo(elbowX, elbowY); g.strokePath();
                // Forearm
                g.lineStyle(H*0.025, skin, 1);
                g.beginPath(); g.moveTo(elbowX, elbowY); g.lineTo(wristX, wristY); g.strokePath();

                // CARTOON FIST — wide horizontal block, clearly distinct from the forearm
                // From side view: we see the back of the hand. Fist is WIDER than the arm.
                const fistW = H*0.06;   // much wider than forearm
                const fistH = H*0.045;  // chunky
                const fistCX = wristX;
                const fistCY = wristY;
                g.fillStyle(skin, 1);
                // Main fist — rounded rectangle shape
                g.fillRect(fistCX - fistW/2, fistCY - fistH/2, fistW, fistH);
                g.fillCircle(fistCX - fistW/2, fistCY, fistH/2);   // left round edge
                g.fillCircle(fistCX + fistW/2, fistCY, fistH/2);   // right round edge
                // Knuckle highlights
                g.fillStyle(skinDark, 0.15);
                g.fillCircle(fistCX - fistW*0.25, fistCY - fistH*0.15, fistH*0.2);
                g.fillCircle(fistCX, fistCY - fistH*0.15, fistH*0.2);
                g.fillCircle(fistCX + fistW*0.25, fistCY - fistH*0.15, fistH*0.2);
                // Finger curl line across bottom of fist
                g.lineStyle(1.5, skinDark, 0.25);
                g.beginPath();
                g.moveTo(fistCX - fistW*0.35, fistCY + fistH*0.15);
                g.lineTo(fistCX + fistW*0.35, fistCY + fistH*0.15);
                g.strokePath();

                // THUMB — thick oval pointing UP from the LEFT edge of the fist
                if (armProg > 0.3) {
                    const tp = (armProg - 0.3) / 0.7;
                    const thumbLen = H*0.05 * tp;
                    const thumbW = H*0.025;   // nice and thick
                    const thumbX = fistCX - fistW*0.42;
                    const thumbTopY = fistCY - fistH/2 - thumbLen;
                    g.fillStyle(skin, 1);
                    // Thumb shaft
                    g.fillRect(thumbX - thumbW/2, thumbTopY, thumbW, thumbLen + fistH*0.3);
                    // Rounded tip
                    g.fillCircle(thumbX, thumbTopY, thumbW/2);
                    // Slight shadow on thumb
                    g.fillStyle(skinDark, 0.15);
                    g.fillRect(thumbX + thumbW*0.15, thumbTopY + 2, thumbW*0.3, thumbLen);
                }
            } else {
                // Arm resting at side
                g.lineStyle(H*0.024, skin, 1);
                g.beginPath(); g.moveTo(rsx, rsy); g.lineTo(rsx + H*0.06, hipY); g.strokePath();
            }

            // === NECK ===
            g.fillStyle(skin, 1);
            g.fillRect(shoulderX - H*0.012, shoulderY - H*0.04, H*0.024, H*0.04);

            // === HEAD ===
            const headX = shoulderX;
            const headY = shoulderY - H*0.065;
            g.fillStyle(hair, 1);
            g.fillCircle(headX, headY, headR);
            g.fillRect(headX - headR*0.85, headY - headR*0.45, headR*1.7, headR*0.45);
            g.fillStyle(skin, 1);
            g.fillCircle(headX, headY + headR*0.15, headR*0.86);
            // Ear
            g.fillStyle(skinDark, 1);
            g.fillCircle(headX + headR*0.85, headY + headR*0.05, headR*0.15);
            // Eyes — dazed, half-closed
            g.fillStyle(0xffffff, 1);
            g.fillCircle(headX - headR*0.28, headY + headR*0.05, headR*0.15);
            g.fillCircle(headX + headR*0.28, headY + headR*0.05, headR*0.15);
            g.fillStyle(0x443322, 1);
            g.fillCircle(headX - headR*0.24, headY + headR*0.07, headR*0.08);
            g.fillCircle(headX + headR*0.24, headY + headR*0.07, headR*0.08);
            // Heavy eyelids (dazed)
            g.fillStyle(skin, 0.7);
            g.fillRect(headX - headR*0.48, headY - headR*0.04, headR*0.96, headR*0.12);
            // Mouth — slight open exhale
            g.lineStyle(H*0.003, 0x995544, 0.4);
            g.beginPath();
            g.moveTo(headX - headR*0.12, headY + headR*0.38);
            g.lineTo(headX + headR*0.12, headY + headR*0.40);
            g.strokePath();
            // Eyebrows
            g.lineStyle(H*0.004, hair, 0.5);
            g.beginPath();
            g.moveTo(headX - headR*0.40, headY - headR*0.16);
            g.lineTo(headX - headR*0.12, headY - headR*0.20);
            g.moveTo(headX + headR*0.12, headY - headR*0.20);
            g.lineTo(headX + headR*0.40, headY - headR*0.16);
            g.strokePath();
        }
    }

    drawRolling(g, x, y, rotation) {
        const r = CONFIG.PLAYER_RADIUS;
        const skin = 0xd4a87c, skinDark = 0xc09670;
        const shirt = 0x3b5998, shirtDark = 0x2d4578;
        const pants = 0x33333f, pantsDark = 0x282832;
        const hair = 0x2a1a0a, shoe = 0x1a1a1a;
        const cos = Math.cos(rotation), sin = Math.sin(rotation);
        const rot = (px, py) => ({ x: x + cos*px - sin*py, y: y + sin*px + cos*py });

        // Shadow
        g.fillStyle(0x000000, 0.12);
        g.fillEllipse(x, y + r + 8, r * 0.9, 8);

        // Barrel roll — tucked on side, knees to chest, arms wrapped.
        // All body part sizes proportional to PERSON_HEIGHT for consistency with standing.
        const head = rot(0, -r*0.65);
        const neck = rot(0, -r*0.48);
        const shoulderF = rot(r*0.18, -r*0.40);
        const shoulderB = rot(-r*0.18, -r*0.40);
        const hipF = rot(r*0.22, r*0.12);
        const hipB = rot(-r*0.12, r*0.12);
        const kneeF = rot(r*0.42, -r*0.18);
        const kneeB = rot(-r*0.05, -r*0.12);
        const footF = rot(r*0.18, -r*0.55);
        const footB = rot(-r*0.22, -r*0.50);
        const handF = rot(r*0.28, -r*0.58);
        const handB = rot(-r*0.32, r*0.22);

        // Back leg
        g.lineStyle(r*0.16, pantsDark, 0.7);
        g.beginPath(); g.moveTo(hipB.x, hipB.y); g.lineTo(kneeB.x, kneeB.y); g.strokePath();
        g.lineStyle(r*0.14, pantsDark, 0.7);
        g.beginPath(); g.moveTo(kneeB.x, kneeB.y); g.lineTo(footB.x, footB.y); g.strokePath();
        g.fillStyle(shoe, 0.7);
        g.fillCircle(footB.x, footB.y, r*0.08);

        // Back arm
        g.lineStyle(r*0.10, shirtDark, 0.6);
        g.beginPath(); g.moveTo(shoulderB.x, shoulderB.y); g.lineTo(handB.x, handB.y); g.strokePath();

        // Torso — jacket as thick line
        g.lineStyle(r*0.42, shirt, 1);
        g.beginPath(); g.moveTo(neck.x, neck.y); g.lineTo(hipF.x, hipF.y); g.strokePath();
        // Torso shadow
        g.lineStyle(r*0.14, shirtDark, 0.3);
        g.beginPath(); g.moveTo(neck.x, neck.y); g.lineTo(hipF.x, hipF.y); g.strokePath();

        // Front leg
        g.lineStyle(r*0.18, pants, 1);
        g.beginPath(); g.moveTo(hipF.x, hipF.y); g.lineTo(kneeF.x, kneeF.y); g.strokePath();
        g.lineStyle(r*0.15, pants, 1);
        g.beginPath(); g.moveTo(kneeF.x, kneeF.y); g.lineTo(footF.x, footF.y); g.strokePath();
        g.fillStyle(shoe, 1);
        g.fillCircle(footF.x, footF.y, r*0.09);

        // Front arm (sleeve + skin hand)
        g.lineStyle(r*0.12, shirt, 1);
        g.beginPath(); g.moveTo(shoulderF.x, shoulderF.y); g.lineTo(kneeF.x, kneeF.y); g.strokePath();
        g.lineStyle(r*0.10, skin, 1);
        g.beginPath(); g.moveTo(kneeF.x, kneeF.y); g.lineTo(handF.x, handF.y); g.strokePath();
        g.fillStyle(skin, 1);
        g.fillCircle(handF.x, handF.y, r*0.06);

        // Head — sized to match standing proportions
        const headR = r * 0.22;
        g.fillStyle(hair, 1);
        g.fillCircle(head.x, head.y, headR);
        g.fillStyle(skin, 1);
        g.fillCircle(head.x + sin*headR*0.3, head.y + cos*headR*0.3, headR*0.85);
        // Ear
        const earDir = rot(headR*0.8, -r*0.65 + headR*0.1);
        g.fillStyle(skinDark, 1);
        g.fillCircle(earDir.x, earDir.y, headR*0.15);
    }

    // ================================================================
    // UI
    // ================================================================
    drawMeter() {
        const g = this.meterGfx; g.clear();
        if (this.playerState !== 'idle') { this.meterLabel.setVisible(false); return; }
        this.meterLabel.setVisible(true);
        const mx = 30, my = 200, mw = 28, mh = 300;
        g.fillStyle(0x1a1a28, 0.9); g.fillRect(mx, my, mw, mh);
        g.lineStyle(1, 0x444466, 0.8); g.strokeRect(mx, my, mw, mh);
        // Optimal zone
        const ozY = my + mh * (1 - 0.70), ozH = mh * 0.04;
        g.fillStyle(0x44cc66, 0.25); g.fillRect(mx+2, ozY, mw-4, ozH);
        g.lineStyle(1, 0x44cc66, 0.5);
        g.beginPath(); g.moveTo(mx, ozY); g.lineTo(mx+5, ozY); g.moveTo(mx, ozY+ozH); g.lineTo(mx+5, ozY+ozH);
        g.moveTo(mx+mw-5, ozY); g.lineTo(mx+mw, ozY); g.moveTo(mx+mw-5, ozY+ozH); g.lineTo(mx+mw, ozY+ozH); g.strokePath();

        const fillY = my + mh * (1 - this.meterValue);
        g.fillStyle(0xddddf0, 0.5); g.fillRect(mx+2, fillY, mw-4, mh*this.meterValue);
        g.lineStyle(2, 0xffffff, 0.9);
        g.beginPath(); g.moveTo(mx, fillY); g.lineTo(mx+mw, fillY); g.strokePath();
        g.fillStyle(0xffffff, 0.9);
        g.fillTriangle(mx+mw+1, fillY, mx+mw+8, fillY-4, mx+mw+8, fillY+4);
    }

    drawUI() {
        const g = this.uiGfx; g.clear();
        const ef = this.playerMaxEnergy > 0 ? this.playerEnergy / this.playerMaxEnergy : 0;
        this.drawBar(g, 140, 24, 260, 16, ef, 'energy');
        this.drawBar(g, 440, 24, 260, 16, this.currentHealth / CONFIG.BASE_HEALTH, 'health');
    }

    drawBar(g, x, y, w, h, frac, type) {
        frac = Phaser.Math.Clamp(frac, 0, 1);
        g.fillStyle(0x0a0a14, 0.7); g.fillRect(x, y, w, h);
        g.lineStyle(1, 0x333344, 0.8); g.strokeRect(x, y, w, h);
        let color = frac > 0.5 ? (type === 'energy' ? 0x44cc88 : 0xcc6666) : frac > 0.25 ? 0xcccc44 : 0xcc3333;
        g.fillStyle(color, 0.8); g.fillRect(x+1, y+1, (w-2)*frac, h-2);
    }

    // ================================================================
    // HELPERS
    // ================================================================
    getPositionOnSegment(si, dist) {
        const s = SEGMENTS[si]; const t = Phaser.Math.Clamp(dist/s.length, 0, 1);
        return { x: Phaser.Math.Linear(s.startX, s.endX, t), y: Phaser.Math.Linear(s.startY, s.endY, t) };
    }
    getSurfaceYAtX(x) {
        for (const s of SEGMENTS) { if (x >= s.startX && x <= s.endX) { return Phaser.Math.Linear(s.startY, s.endY, (x-s.startX)/(s.endX-s.startX)); } }
        return SEGMENTS[SEGMENTS.length-1].endY;
    }
    getSegmentAtX(x) {
        for (let i = 0; i < SEGMENTS.length; i++) { if (x >= SEGMENTS[i].startX && x <= SEGMENTS[i].endX) return i; }
        return SEGMENTS.length - 1;
    }
    updateCamera() {
        let focusX = this.playerWorldX;
        // When crashed, center camera between the player and the camera rig so crash scene is visible
        if (this.playerState === 'crashed' && this.levelData) {
            focusX = (this.playerWorldX + this.levelData.cameraX) / 2;
        }
        const tx = focusX - CONFIG.WIDTH/2 + CONFIG.CAM_LEAD_X;
        // Adjust camera Y offset per state so full character is always visible
        let yOff = 100;
        if (this.playerState === 'idle') yOff = -CONFIG.PERSON_HEIGHT * 0.35;
        else if (this.playerState === 'stopped' || this.playerState === 'crashed') yOff = -CONFIG.PERSON_HEIGHT * 0.5;
        const ty = this.playerWorldY - CONFIG.HEIGHT/2 + yOff;
        this.camTargetX += (tx - this.camTargetX) * CONFIG.CAM_SMOOTH;
        this.camTargetY += (ty - this.camTargetY) * CONFIG.CAM_SMOOTH;
        this.cameras.main.scrollX = this.camTargetX;
        this.cameras.main.scrollY = this.camTargetY;
    }

    // ================================================================
    // GAME LOOP
    // ================================================================
    update(time, delta) {
        const dt = Math.min(delta, 33) / 1000;
        switch (this.playerState) {
            case 'idle': this.updateIdle(time, dt); break;
            case 'rolling': this.updateRolling(time, dt); break;
            case 'airborne': this.updateAirborne(time, dt); break;
            case 'stopped': case 'crashed': this.updateStopped(time, dt); break;
        }
        this.updateCamera();
        this.drawMeter();
        this.drawUI();
    }

    updateIdle(time, dt) {
        this.meterTime += dt;
        // Oscillate between MIN_POWER_FLOOR and 1.0
        const floor = CONFIG.MIN_POWER_FLOOR;
        const raw = 0.5 + 0.5 * Math.sin(this.meterTime * CONFIG.METER_OSCILLATION_SPEED);
        this.meterValue = floor + raw * (1 - floor);
        this.bounceTime += dt;
        const by = Math.sin(this.bounceTime * 3.5) * 3;
        this.drawPlayer(SEGMENTS[0].startX, SEGMENTS[0].startY + by - 2, 0);
    }

    updateRolling(time, dt) {
        const seg = SEGMENTS[this.currentSegment];
        const sinA = Math.sin(seg.angle);
        const friction = CONFIG.BASE_FRICTION * (1 - sinA * CONFIG.SLOPE_FRICTION_REDUCTION);
        const gravity = CONFIG.GRAVITY_ASSIST * sinA;
        let ca = 0, edm = 1;
        if (this.cursors.right.isDown) { ca = CONFIG.BOOST_ACCEL; edm = CONFIG.BOOST_ENERGY_MULT; }
        else if (this.cursors.left.isDown) { ca = CONFIG.BRAKE_ACCEL; edm = CONFIG.BRAKE_ENERGY_MULT; }

        if (this.cursors.up.isDown && (time - this.lastJumpTime > CONFIG.JUMP_COOLDOWN_MS) && this.playerEnergy > this.playerMaxEnergy * CONFIG.JUMP_ENERGY_COST_FRAC) {
            this.lastJumpTime = time; this.jumpVelY = -CONFIG.JUMP_VELOCITY;
            this.playerEnergy -= this.playerMaxEnergy * CONFIG.JUMP_ENERGY_COST_FRAC;
            this.playerState = 'airborne'; return;
        }

        this.playerVelocity = Math.max(0, this.playerVelocity + (gravity - friction + ca) * dt);
        this.playerEnergy = Math.max(0, this.playerEnergy - CONFIG.MAX_ENERGY_DRAIN_RATE * this.playerMaxEnergy * (1 - sinA * CONFIG.SLOPE_DRAIN_REDUCTION) * edm * dt);

        const dist = this.playerVelocity * dt;
        this.distAlongSegment += dist;
        if (this.distAlongSegment >= seg.length && this.currentSegment < SEGMENTS.length - 1) {
            this.distAlongSegment -= seg.length; this.currentSegment++;
        }
        if (this.currentSegment >= SEGMENTS.length - 1) this.distAlongSegment = Math.min(this.distAlongSegment, SEGMENTS[SEGMENTS.length-1].length);

        const pos = this.getPositionOnSegment(this.currentSegment, this.distAlongSegment);
        this.playerWorldX = pos.x; this.playerWorldY = pos.y;
        const circ = 2 * Math.PI * CONFIG.PLAYER_RADIUS;
        const rollSpeed = seg.angle === 0 ? 0.1 : 1; // on flat ground, barely rotate (sliding/skidding)
        this.rollRotation += (dist / circ) * Math.PI * 2 * rollSpeed;
        this.drawPlayer(pos.x, pos.y - CONFIG.PLAYER_RADIUS - 4, this.rollRotation);

        if (this.playerVelocity <= 0 || this.playerEnergy <= 0) { this.playerVelocity = 0; this.playerState = 'stopped'; this.stopTime = 0; this.onPlayerStopped(); return; }
        if (this.playerWorldX >= this.levelData.cameraX) { this.playerState = 'crashed'; this.stopTime = 0; this.onPlayerCrashed(); }
    }

    updateAirborne(time, dt) {
        this.jumpVelY += CONFIG.JUMP_GRAVITY * dt;
        const seg = SEGMENTS[this.currentSegment];
        const hVel = this.playerVelocity * Math.cos(seg.angle);
        this.playerWorldX += hVel * dt; this.playerWorldY += this.jumpVelY * dt;
        this.playerEnergy = Math.max(0, this.playerEnergy - CONFIG.MAX_ENERGY_DRAIN_RATE * this.playerMaxEnergy * dt);
        this.playerVelocity = Math.max(0, this.playerVelocity - CONFIG.BASE_FRICTION * 0.2 * dt);

        const sy = this.getSurfaceYAtX(this.playerWorldX);
        if (this.playerWorldY >= sy) {
            this.playerWorldY = sy; this.playerState = 'rolling'; this.jumpVelY = 0;
            this.currentSegment = this.getSegmentAtX(this.playerWorldX);
            const s2 = SEGMENTS[this.currentSegment];
            this.distAlongSegment = (this.playerWorldX - s2.startX) / Math.cos(s2.angle);
        }
        if (this.playerWorldX >= this.levelData.cameraX) { this.playerState = 'crashed'; this.stopTime = 0; this.onPlayerCrashed(); return; }
        if (this.playerVelocity <= 0 || this.playerEnergy <= 0) {
            this.playerWorldY = this.getSurfaceYAtX(this.playerWorldX); this.playerVelocity = 0;
            this.playerState = 'stopped'; this.onPlayerStopped(); return;
        }
        const hDist = hVel * dt;
        this.rollRotation += (hDist / (2*Math.PI*CONFIG.PLAYER_RADIUS)) * Math.PI * 2;
        this.drawPlayer(this.playerWorldX, this.playerWorldY - CONFIG.PLAYER_RADIUS - 4, this.rollRotation);
    }

    onPlayerStopped() {
        // Snap player to the top of the nearest step so they sit ON the step, not inside the slope
        const ld = this.levelData;
        if (this.playerWorldX < ld.endX) {
            // On the stair slope — find the step whose x range contains the player
            const steps = ld.steps;
            let snapped = false;
            for (let i = 0; i < steps.length; i++) {
                const s = steps[i];
                if (this.playerWorldX >= s.x && this.playerWorldX < s.x + s.w) {
                    this.playerWorldY = s.y;
                    snapped = true;
                    break;
                }
            }
            // If past all steps but before endX, snap to last step
            if (!snapped && steps.length > 0) {
                const last = steps[steps.length - 1];
                this.playerWorldY = last.y;
            }
        }
        // If on flat section (past endX), playerWorldY is already correct (flat ground Y)

        const dm = Math.abs(this.playerWorldX - ld.markX) / CONFIG.PIXELS_PER_METER;
        const hc = CONFIG.LEVEL_BASE_COST + dm * CONFIG.ACCURACY_COST_MULT;
        this.currentHealth = Math.max(0, this.currentHealth - hc);
        this.scoreData = { distMeters: dm, isPerfect: Math.abs(this.playerWorldX - ld.markX) < CONFIG.PERFECT_THRESHOLD_PX, crashed: false, healthCost: hc };
        this.showScore();
    }

    onPlayerCrashed() {
        // Project where the player would end up if they kept rolling through the camera
        // This determines crash tier — more momentum = worse crash
        let simVel = this.playerVelocity;
        let simDist = 0;
        const dt = 0.016;
        const flatFric = CONFIG.BASE_FRICTION; // flat ground friction
        for (let i = 0; i < 500 && simVel > 0; i++) {
            simVel = Math.max(0, simVel - flatFric * dt);
            simDist += simVel * dt;
        }
        // Place the player past the camera but NOT too far — keep crash scene in view
        // Cap the distance so the player stays within ~3m of the camera
        this.playerWorldX = this.levelData.cameraX + Math.min(simDist, 300);
        this.playerWorldY = this.levelData.endY;

        const opx = simDist;
        const dm = Math.abs(this.playerWorldX - this.levelData.markX) / CONFIG.PIXELS_PER_METER;
        const th = CONFIG.CRASH_TIER_THRESHOLDS;
        let tier = 1; for (let i = th.length-1; i >= 0; i--) { if (opx >= th[i]) { tier = i+1; break; } }
        tier = Math.min(tier, 5); this.crashTier = tier; this.crashAnimTime = 0;
        const chc = CONFIG.CRASH_TIER_HEALTH_COSTS[tier-1];
        const sp = CONFIG.CRASH_TIER_SCORE_PENALTIES[tier-1];
        const hc = CONFIG.LEVEL_BASE_COST + (dm+sp) * CONFIG.ACCURACY_COST_MULT + chc;
        this.currentHealth = Math.max(0, this.currentHealth - hc);
        this.scoreData = { distMeters: dm+sp, isPerfect: false, crashed: true, crashTier: tier, healthCost: hc };
        this.showScore();
    }

    showScore() {
        const d = this.scoreData;
        this.scoreText.setText(d.isPerfect ? '★ PERFECT! ★' : `${d.distMeters.toFixed(1)}m from mark`).setVisible(true);
        if (d.crashed) {
            const tn = ['','WOBBLE','LEAN-BACK','TOPPLE!','FULL CRASH!','BULLDOZE!!'];
            this.crashText.setText(`CRASHED! — ${tn[d.crashTier]}`).setVisible(true);
        }
        const earned = d.isPerfect ? 100 : Math.max(0, Math.round(100 - d.distMeters * 8));
        this.currency += earned;
        this.showingScore = false;
        this.time.delayedCall(CONFIG.THUMBS_UP_DURATION, () => {
            this.showingScore = true;
            const hs = `Health: ${Math.round(this.currentHealth)}/${CONFIG.BASE_HEALTH}  (-${Math.round(d.healthCost)})`;
            const cs = `+$${earned}  (Total: $${this.currency})`;
            if (this.currentHealth <= 0) {
                this.promptText.setText(`${hs}\n\nRUN OVER — Reached Level ${this.currentLevel+1}\n\nPress SPACE to start new run`).setVisible(true).setColor('#ff6666');
            } else {
                this.promptText.setText(`${hs}\n${cs}\n\nPress SPACE for next level`).setVisible(true);
            }
        });
    }

    updateStopped(time, dt) {
        this.stopTime += dt;
        this.drawPlayer(this.playerWorldX, this.playerWorldY - 2, 0);
        if (this.crashTier > 0) { this.crashAnimTime += dt; this.drawCrewScene(this.crashTier, Math.min(this.crashAnimTime/2.5, 1)); }
    }
}

// ============================================================
const game = new Phaser.Game({
    type: Phaser.AUTO, width: CONFIG.WIDTH, height: CONFIG.HEIGHT,
    backgroundColor: CONFIG.BG_COLOR, parent: document.body,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, PlayScene],
});
