// ============================================================
// STARFALL — Phase 1+ Core Loop (Visual Overhaul)
// ============================================================
window.onerror = function(msg, url, line, col, err) {
    document.title = 'ERR:' + line + ':' + msg;
    console.error('STARFALL ERROR line ' + line + ': ' + msg);
};

const CONFIG = {
    WIDTH: 1280,
    HEIGHT: 720,

    // World — much bigger scale for realistic proportions
    STAIR_START_X: 150,
    STAIR_START_Y: 200,
    STEP_WIDTH: 40,         // tread depth in pixels — half size for realistic scale

    // Physics (tuned for larger world)
    METER_OSCILLATION_SPEED: 3.5,
    METER_POWER_CURVE: 1.3,
    MIN_POWER_FLOOR: 0.35,    // meter value can't go below this — prevents silly low power
    MAX_INITIAL_VELOCITY: 4400,
    MAX_ENERGY: 680,
    BASE_FRICTION: 550,
    SLOPE_FRICTION_REDUCTION: 0.7,
    GRAVITY_ASSIST: 280,
    MAX_ENERGY_DRAIN_RATE: 0.55,
    SLOPE_DRAIN_REDUCTION: 0.6,
    BOOST_ACCEL: 200,
    BOOST_ENERGY_MULT: 0.6,
    BRAKE_ACCEL: -150,
    BRAKE_ENERGY_MULT: 1.4,
    PIXELS_PER_FOOT: 30,
    PERFECT_THRESHOLD_PX: 20,

    BASE_HEALTH: 100,
    LEVEL_BASE_COST: 4,
    ACCURACY_COST_MULT: 1.5,
    CRASH_TIER_THRESHOLDS: [0, 80, 200, 400, 700],
    CRASH_TIER_HEALTH_COSTS: [5, 10, 18, 28, 40],
    CRASH_TIER_SCORE_PENALTIES: [0.5, 1.5, 3.0, 5.0, 8.0],

    THUMBS_UP_DURATION: 4500,
    STOP_BEAT_DURATION: 2800,  // lie still before thumbs up (ms) — long beat
    PLAYER_RADIUS: 68,        // tucked ball radius — ~45% of standing height (torso length)
    PERSON_HEIGHT: 300,       // standing height in pixels (~5 stair risers)
    CAM_LEAD_X: 100,
    CAM_SMOOTH: 0.12,

    BG_COLOR: 0x1c1c24,
};

// ============================================================
// LEVELS
// ============================================================
// Per-level costumes and locations
const COSTUMES = [
    { name: 'Chicken Suit', shirt: 0xddcc22, pants: 0xccbb11, hat: 'comb', prop: 'rubber_chicken' },
    { name: 'Superhero', shirt: 0xcc2222, pants: 0x2222cc, hat: 'mask', prop: 'cape' },
    { name: 'Gorilla Suit', shirt: 0x8a6a3a, pants: 0x7a5a2a, hat: 'gorilla', prop: 'banana' },
    { name: 'Tuxedo', shirt: 0xeeeeee, pants: 0x2a2a3a, hat: 'tophat', prop: 'cane' },
    { name: 'Viking', shirt: 0x8b6914, pants: 0x5a4a2a, hat: 'horns', prop: 'shield' },
    { name: 'Astronaut', shirt: 0xeeeeee, pants: 0xdddddd, hat: 'helmet', prop: 'flag' },
    { name: 'Pirate', shirt: 0xcc4444, pants: 0x554433, hat: 'pirate', prop: 'sword' },
    { name: 'Clown', shirt: 0xff6622, pants: 0x22cc44, hat: 'rainbow', prop: 'horn' },
    { name: 'Chef', shirt: 0xffffff, pants: 0x444466, hat: 'chef', prop: 'pan' },
    { name: 'Wizard', shirt: 0x4422aa, pants: 0x331188, hat: 'wizard', prop: 'wand' },
    { name: 'Luchador', shirt: 0xee2288, pants: 0xeecc22, hat: 'lucha', prop: 'belt' },
    { name: 'Scuba Diver', shirt: 0x336688, pants: 0x224466, hat: 'goggles', prop: 'flipper' },
    { name: 'Cowboy', shirt: 0xaa8844, pants: 0x556644, hat: 'cowboy', prop: 'lasso' },
    { name: 'Ninja', shirt: 0x444444, pants: 0x333333, hat: 'mask', prop: 'star' },
    { name: 'Disco King', shirt: 0xddaa22, pants: 0xffffff, hat: 'afro', prop: 'ball' },
    { name: 'Hazmat Suit', shirt: 0xcccc22, pants: 0xbbbb11, hat: 'mask', prop: 'geiger' },
    { name: 'Mummy', shirt: 0xddccaa, pants: 0xccbb99, hat: 'wrap', prop: 'scepter' },
    { name: 'Robot', shirt: 0x888899, pants: 0x777788, hat: 'antenna', prop: 'laser' },
    { name: 'Santa', shirt: 0xcc2222, pants: 0xcc2222, hat: 'santa', prop: 'sack' },
];
const LOCATIONS = [
    { name: 'Suburban Home', bg: 0x1c1c24, floor: 0x555566, wall: 0x3a3a4a, stair: 0x666677 },
    { name: 'Office Building', bg: 0x1a2028, floor: 0x606878, wall: 0x2a3040, stair: 0x5a6270 },
    { name: 'Castle', bg: 0x1a1820, floor: 0x5a5560, wall: 0x3a3540, stair: 0x6a6570 },
    { name: 'Spaceship', bg: 0x0a0a18, floor: 0x3a3a55, wall: 0x1a1a30, stair: 0x4a4a66 },
    { name: 'Jungle Temple', bg: 0x0a1a0a, floor: 0x4a5a3a, wall: 0x2a3a1a, stair: 0x6a7a4a },
    { name: 'Mall', bg: 0x201818, floor: 0x7a6a5a, wall: 0x4a3a2a, stair: 0x8a7a6a },
    { name: 'Haunted Mansion', bg: 0x12101a, floor: 0x4a4052, wall: 0x2a2232, stair: 0x5a5262 },
    { name: 'Volcano Lair', bg: 0x1a0a0a, floor: 0x5a3a2a, wall: 0x3a1a0a, stair: 0x6a4a3a },
    { name: 'Underwater Base', bg: 0x0a1a2a, floor: 0x3a5a6a, wall: 0x1a3a4a, stair: 0x4a6a7a },
    { name: 'Ski Lodge', bg: 0x1a1a22, floor: 0x6a5a4a, wall: 0x4a3a2a, stair: 0x8a7a6a },
    { name: 'Prison', bg: 0x181818, floor: 0x555555, wall: 0x333333, stair: 0x666666 },
    { name: 'Cruise Ship', bg: 0x0a1420, floor: 0x5a6a7a, wall: 0x3a4a5a, stair: 0x6a7a8a },
    { name: 'Pyramid', bg: 0x1a1808, floor: 0x8a7a4a, wall: 0x5a4a2a, stair: 0x9a8a5a },
    { name: 'Space Station', bg: 0x000010, floor: 0x3a3a4a, wall: 0x1a1a2a, stair: 0x5a5a6a },
    { name: 'Nightclub', bg: 0x0a0018, floor: 0x2a2a4a, wall: 0x1a0a2a, stair: 0x4a3a5a },
    { name: 'Nuclear Plant', bg: 0x0a1a0a, floor: 0x4a5a3a, wall: 0x2a3a1a, stair: 0x5a6a3a },
    { name: 'Arctic Base', bg: 0x1a2028, floor: 0x8a9aaa, wall: 0x5a6a7a, stair: 0x9aaabb },
    { name: 'Demon Castle', bg: 0x1a0808, floor: 0x4a2a2a, wall: 0x2a0a0a, stair: 0x5a3a3a },
    { name: 'Cloud Palace', bg: 0x1a1a2a, floor: 0xaaaacc, wall: 0x7a7a9a, stair: 0xbbbbdd },
    { name: 'The Void', bg: 0x000000, floor: 0x2a2a2a, wall: 0x0a0a0a, stair: 0x3a3a3a },
];
const LEVELS = [
    // sweetSpot = optimal meter value (0-1), greenW = ±range for green, yellowExtra = extra ± for yellow
    // Sweet spots tuned from playtesting. Green zones much smaller — precision matters.
    // L1: was 0.68 (too far), L3: was 0.64 (too short)
    // L1-2: Tutorial
    { name: 'Baby Steps', angleDeg: 30, numSteps: 4, flatLength: 600, markOffset: 300, sweetSpot: 0.58, greenW: 0.04, yellowExtra: 0.06 },
    { name: 'Getting Started', angleDeg: 32, numSteps: 10, flatLength: 800, markOffset: 400, sweetSpot: 0.67, greenW: 0.04, yellowExtra: 0.05 },
    // L3-4: Short staircases
    { name: 'The Basics', angleDeg: 35, numSteps: 16, flatLength: 1000, markOffset: 500, sweetSpot: 0.74, greenW: 0.04, yellowExtra: 0.05 },
    { name: 'Gentle Slope', angleDeg: 25, numSteps: 20, flatLength: 1000, markOffset: 500, sweetSpot: 0.85, greenW: 0.03, yellowExtra: 0.05 },
    // L5-6: Medium
    { name: 'Picking Up Speed', angleDeg: 35, numSteps: 28, flatLength: 1200, markOffset: 650, sweetSpot: 0.88, greenW: 0.05, yellowExtra: 0.05 },
    { name: 'Steep Drop', angleDeg: 45, numSteps: 24, flatLength: 1400, markOffset: 750, sweetSpot: 0.84, greenW: 0.05, yellowExtra: 0.05 },
    // L7-8: Long staircases
    { name: 'The Long Way Down', angleDeg: 32, numSteps: 40, flatLength: 1200, markOffset: 620, sweetSpot: 0.89, greenW: 0.04, yellowExtra: 0.05 },
    { name: 'Vertigo', angleDeg: 50, numSteps: 32, flatLength: 1600, markOffset: 900, sweetSpot: 0.82, greenW: 0.04, yellowExtra: 0.05 },
    // L9-10: Very long
    { name: 'Barely a Ramp', angleDeg: 22, numSteps: 56, flatLength: 1100, markOffset: 500, sweetSpot: 0.88, greenW: 0.04, yellowExtra: 0.04 },
    { name: 'The Gauntlet', angleDeg: 40, numSteps: 60, flatLength: 1800, markOffset: 1000, sweetSpot: 0.78, greenW: 0.04, yellowExtra: 0.04 },
    // L11-12: Extreme
    { name: 'Nosedive', angleDeg: 52, numSteps: 48, flatLength: 1700, markOffset: 950, sweetSpot: 0.78, greenW: 0.03, yellowExtra: 0.04 },
    { name: 'The Endless Fall', angleDeg: 35, numSteps: 80, flatLength: 2000, markOffset: 1100, sweetSpot: 0.80, greenW: 0.03, yellowExtra: 0.04 },
    // L13+: EXTREME — unrealistic, creative, very steep
    { name: 'The Cliff', angleDeg: 65, numSteps: 40, flatLength: 2000, markOffset: 1200, sweetSpot: 0.80, greenW: 0.03, yellowExtra: 0.04 },
    { name: 'Stairway to Hell', angleDeg: 70, numSteps: 60, flatLength: 2500, markOffset: 1500, sweetSpot: 0.75, greenW: 0.03, yellowExtra: 0.03 },
    { name: 'Skyscraper', angleDeg: 30, numSteps: 200, flatLength: 3000, markOffset: 1800, sweetSpot: 0.96, greenW: 0.03, yellowExtra: 0.03 },
    { name: 'The Waterfall', angleDeg: 75, numSteps: 80, flatLength: 3000, markOffset: 2000, sweetSpot: 0.50, greenW: 0.02, yellowExtra: 0.03 },
    { name: 'Mount Doom', angleDeg: 60, numSteps: 120, flatLength: 2500, markOffset: 1600, sweetSpot: 0.65, greenW: 0.02, yellowExtra: 0.03 },
    { name: 'The Abyss', angleDeg: 80, numSteps: 100, flatLength: 4000, markOffset: 2500, sweetSpot: 0.45, greenW: 0.02, yellowExtra: 0.02 },
    { name: 'Babel Tower', angleDeg: 35, numSteps: 300, flatLength: 3500, markOffset: 2200, sweetSpot: 0.95, greenW: 0.02, yellowExtra: 0.02 },
    { name: 'Freefall', angleDeg: 85, numSteps: 60, flatLength: 5000, markOffset: 3000, sweetSpot: 0.40, greenW: 0.02, yellowExtra: 0.02 },
    // L21: The ultimate challenge
    { name: 'Empire State Building', angleDeg: 35, numSteps: 1576, flatLength: 6000, markOffset: 4000, sweetSpot: 0.96, greenW: 0.01, yellowExtra: 0.02 },
    // L22-25: Nightmare tier
    { name: 'Black Diamond', angleDeg: 68, numSteps: 90, flatLength: 3500, markOffset: 2200, sweetSpot: 0.58, greenW: 0.02, yellowExtra: 0.03 },
    { name: 'Broken Elevator', angleDeg: 42, numSteps: 180, flatLength: 3000, markOffset: 1900, sweetSpot: 0.88, greenW: 0.02, yellowExtra: 0.02 },
    { name: 'The Plunge', angleDeg: 78, numSteps: 70, flatLength: 4000, markOffset: 2600, sweetSpot: 0.48, greenW: 0.02, yellowExtra: 0.02 },
    { name: 'Spiral of Pain', angleDeg: 55, numSteps: 150, flatLength: 3500, markOffset: 2300, sweetSpot: 0.72, greenW: 0.02, yellowExtra: 0.02 },
    // L26-28: Insanity tier
    { name: 'Mariana Trench', angleDeg: 82, numSteps: 120, flatLength: 5000, markOffset: 3200, sweetSpot: 0.42, greenW: 0.015, yellowExtra: 0.02 },
    { name: 'Space Needle', angleDeg: 38, numSteps: 400, flatLength: 4000, markOffset: 2800, sweetSpot: 0.94, greenW: 0.015, yellowExtra: 0.02 },
    { name: 'Crater Drop', angleDeg: 76, numSteps: 160, flatLength: 4500, markOffset: 3000, sweetSpot: 0.52, greenW: 0.015, yellowExtra: 0.02 },
    // L29-30: The final frontier
    { name: 'Death Wish', angleDeg: 84, numSteps: 200, flatLength: 5500, markOffset: 3500, sweetSpot: 0.44, greenW: 0.01, yellowExtra: 0.02 },
    { name: 'Rock Bottom', angleDeg: 88, numSteps: 250, flatLength: 6000, markOffset: 4000, sweetSpot: 0.38, greenW: 0.01, yellowExtra: 0.01 },
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

    return { segments, steps, stepW, stepH, markX, cameraX, flatEndX, angleDeg: levelDef.angleDeg, name: levelDef.name, startX, startY, endX, endY, sweetSpot: levelDef.sweetSpot || 0.5, greenW: levelDef.greenW || 0.08, yellowExtra: levelDef.yellowExtra || 0.06 };
}

function feetToStr(decimalFeet) {
    let totalInches = Math.round(decimalFeet * 12);
    let ft = Math.floor(totalInches / 12);
    let inches = totalInches - ft * 12;
    // Safety: if rounding gives 12 inches, bump to next foot
    if (inches >= 12) { ft++; inches = 0; }
    if (ft === 0) return `${inches} inch${inches !== 1 ? 'es' : ''}`;
    if (inches === 0) return `${ft}'`;
    return `${ft}' ${inches}"`;
}

let SEGMENTS = buildLevel(LEVELS[0]).segments;

// ============================================================
// BOOT SCENE
// ============================================================
// No BootScene — PlayScene starts directly

// ============================================================
// PLAY SCENE
// ============================================================
class PlayScene extends Phaser.Scene {
    constructor() { super('PlayScene'); }

    init(data) {
        this.currentHealth = data.health != null ? data.health : CONFIG.BASE_HEALTH;
        this.currentLevel = data.level != null ? data.level : 0;
        this.currency = data.currency != null ? data.currency : 0;
        this.ownedPads = data.ownedPads || [];
        this.protection = data.protection || 0;
        this.takeNumber = data.takeNumber || 1;
        this.levelData = buildLevel(LEVELS[this.currentLevel % LEVELS.length]);
        SEGMENTS = this.levelData.segments;
        this.costume = COSTUMES[this.currentLevel % COSTUMES.length];
        this.location = LOCATIONS[this.currentLevel % LOCATIONS.length];
        // Random skin tone per run (persists across retakes of same level)
        const SKIN_TONES = [
            { skin: 0xf5d0a9, skinDark: 0xd4a87c, hair: 0x2a1a0a },  // light
            { skin: 0xd4a87c, skinDark: 0xb08860, hair: 0x1a1008 },  // medium
            { skin: 0xc68642, skinDark: 0xa06a30, hair: 0x0a0a06 },  // tan
            { skin: 0x8d5524, skinDark: 0x6d3a14, hair: 0x0a0808 },  // brown
            { skin: 0x5c3310, skinDark: 0x3c1a08, hair: 0x080606 },  // dark
        ];
        this.skinTone = data.skinTone != null ? data.skinTone : Math.floor(Math.random() * SKIN_TONES.length);
        this.playerSkin = SKIN_TONES[this.skinTone % SKIN_TONES.length];
        // Gender — random at game start, persists across levels
        this.playerGender = data.playerGender != null ? data.playerGender : (Math.random() < 0.5 ? 'male' : 'female');

        // Compute pad visuals from owned pads
        this.padVisuals = { knees: 0, elbows: 0, hips: 0, back: 0, head: 0, forearms: 0, shins: 0, butt: 0, full: false };
        for (const idx of this.ownedPads) {
            const pad = PADS[idx];
            if (!pad) continue;
            if (pad.location === 'full') {
                this.padVisuals.full = true;
            } else if (this.padVisuals[pad.location] !== undefined) {
                this.padVisuals[pad.location] = Math.max(this.padVisuals[pad.location], pad.bulk);
            }
        }
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
        // Document-level touch for portrait mode (taps outside canvas area)
        this._docTouch = () => this.handleAction();
        document.addEventListener('touchstart', this._docTouch, { passive: true });
        this.events.on('shutdown', () => document.removeEventListener('touchstart', this._docTouch));

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
        this.cameras.main.scrollX = SEGMENTS[0].startX - 500;
        this.cameras.main.scrollY = SEGMENTS[0].startY - 300;
        this.camTargetX = this.cameras.main.scrollX;
        this.camTargetY = this.cameras.main.scrollY;

        // UI (fixed to screen)
        this.uiGfx = this.add.graphics().setScrollFactor(0);
        this.meterGfx = this.add.graphics().setScrollFactor(0);
        this.meterLabel = this.add.text(44, 78, 'POWER', {
            fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#8888aa',
        }).setOrigin(0.5, 1).setScrollFactor(0);
        this.add.text(140, 18, 'ROLL ENERGY', { fontSize: '11px', fontFamily: 'Arial', color: '#66bb99' }).setOrigin(0, 1).setScrollFactor(0);
        this.add.text(440, 18, 'HEALTH', { fontSize: '11px', fontFamily: 'Arial', color: '#bb7777' }).setOrigin(0, 1).setScrollFactor(0);

        const lvl = this.currentLevel + 1;
        const loc = this.location || LOCATIONS[0];
        const cos = this.costume || COSTUMES[0];
        this.add.text(CONFIG.WIDTH / 2, 45, `Level ${lvl}: ${this.levelData.name}`, {
            fontSize: '22px', fontFamily: 'Georgia, serif', color: '#aaaacc',
            stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5).setScrollFactor(0);
        this.add.text(CONFIG.WIDTH / 2, 68, `${this.levelData.steps.length} stairs`, {
            fontSize: '12px', fontFamily: 'Arial', color: '#777799',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setScrollFactor(0);
        // Slate — "Take X"
        const slateX = CONFIG.WIDTH - 100, slateY = 50;
        const slateGfx = this.add.graphics().setScrollFactor(0);
        slateGfx.fillStyle(0x222222, 0.9);
        slateGfx.fillRect(slateX - 55, slateY - 22, 110, 44);
        slateGfx.lineStyle(2, 0xffffff, 0.6);
        slateGfx.strokeRect(slateX - 55, slateY - 22, 110, 44);
        // Diagonal stripes on top (clapperboard style)
        slateGfx.fillStyle(0xffffff, 0.7);
        for (let i = 0; i < 5; i++) {
            slateGfx.fillRect(slateX - 55 + i*22, slateY - 30, 11, 8);
        }
        slateGfx.fillStyle(0x222222, 0.9);
        slateGfx.fillRect(slateX - 55, slateY - 30, 110, 8);
        slateGfx.fillStyle(0xffffff, 0.7);
        for (let i = 0; i < 5; i++) {
            slateGfx.fillRect(slateX - 50 + i*22, slateY - 30, 11, 8);
        }
        this.add.text(slateX, slateY, `TAKE ${this.takeNumber}`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0);

        this.scoreText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 60, '', {
            fontSize: '60px', fontFamily: 'Georgia, serif', color: '#ffffff',
            stroke: '#000000', strokeThickness: 7,
        }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
        this.crashText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 130, '', {
            fontSize: '52px', fontFamily: 'Georgia, serif', color: '#ff3333',
            stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
        this.promptText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 30, '', {
            fontSize: '20px', fontFamily: 'Arial', color: '#aaaacc',
            stroke: '#000000', strokeThickness: 3, align: 'center',
        }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
        this.hintText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 30, 'Tap or press SPACE', {
            fontSize: '15px', fontFamily: 'Arial', color: '#555577',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setScrollFactor(0);

        // Mobile touch controls — screen halves during rolling
        // Left half = brake, Right half = boost (detected via pointer position in updateRolling)

        this.bounceTime = 0;

        // Manual update loop — Phaser 3.90 doesn't call update() reliably
        // Guard: only one rAF loop, and prevent double-updates per frame
        this._rafId = null;
        this._lastFrame = 0; // frame counter to prevent double-calling
        const scene = this;
        let _lt = performance.now();
        function _loop() {
            if (!scene.sys || !scene.sys.settings || scene.sys.settings.status !== 5) return; // scene no longer running
            const now = performance.now();
            const d = now - _lt;
            _lt = now;
            if (d > 0 && d < 100) {
                try { scene.update(now, Math.min(d, 33)); } catch(e) {}
            }
            scene._rafId = requestAnimationFrame(_loop);
        }
        this._rafId = requestAnimationFrame(_loop);

        // Clean up rAF on scene shutdown to prevent stacking loops
        this.events.on('shutdown', () => {
            if (scene._rafId) { cancelAnimationFrame(scene._rafId); scene._rafId = null; }
        });
    }

    handleAction() {
        if (this.playerState === 'idle') {
            this.launchPlayer();
        } else if (this.playerState === 'rolling') {
            // During rolling, spacebar/tap does nothing (controls are arrow keys / touch zones)
            return;
        } else if ((this.playerState === 'stopped' || this.playerState === 'crashed') && this.showingScore) {
            // Check fail conditions: crashed or >5ft from mark = must retry
            const failed = this.scoreData && (this.scoreData.crashed || this.scoreData.distFeet > 5.1);
            const passData = { health: this.currentHealth, currency: this.currency, ownedPads: this.ownedPads, protection: this.protection, skinTone: this.skinTone, playerGender: this.playerGender };
            if (this.currentHealth <= 0) {
                this.scene.start('PlayScene', { health: CONFIG.BASE_HEALTH, level: 0, currency: 0, skinTone: this.skinTone, playerGender: this.playerGender });
            } else if (failed) {
                // Retry same level — increment take number, keep skin tone
                this.scene.start('PlayScene', { ...passData, level: this.currentLevel, takeNumber: this.takeNumber + 1 });
            } else {
                // Success — check for end-of-week rest
                const nextLevel = this.currentLevel + 1;
                const isRestWeek = (nextLevel === 5 || nextLevel === 10 || (nextLevel > 10 && nextLevel % 10 === 0)); // at 5, 10, 20, 30...
                if (isRestWeek) {
                    // Rest up — recover health
                    passData.health = Math.min(CONFIG.BASE_HEALTH, passData.health + 40);
                    passData.restWeek = true;
                }
                if (this.ownedPads.length >= PADS.length) {
                    // All pads owned — skip store, go directly to next level
                    this.scene.start('PlayScene', { ...passData, level: nextLevel });
                } else {
                    this.scene.start('StoreScene', { ...passData, level: nextLevel });
                }
            }
        }
    }

    launchPlayer() {
        const scaled = Math.pow(this.meterValue, CONFIG.METER_POWER_CURVE);
        // Scale max velocity/energy to level size — short levels need less power range
        const totalDist = this.levelData.markX - this.levelData.startX;
        const maxPossibleDist = CONFIG.MAX_INITIAL_VELOCITY * 2.5;
        const levelScale = Math.min(1.0, Math.max(0.3, (totalDist / maxPossibleDist) * 1.8));
        this.playerVelocity = scaled * CONFIG.MAX_INITIAL_VELOCITY * levelScale;
        this.playerMaxEnergy = scaled * CONFIG.MAX_ENERGY * levelScale;
        this.playerEnergy = this.playerMaxEnergy;
        this.currentSegment = 0;
        this.distAlongSegment = 0;
        this.playerState = 'rolling';
        this.launchTime = this.time.now; // cooldown: prevent spacebar from triggering anything right after launch
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

        // (apple box removed — was confusing)
    }

    // ================================================================
    // WORLD — Stairs with depth, concrete texture, proper floor
    // ================================================================
    drawWorld() {
        const g = this.worldGfx;
        g.clear();
        const ld = this.levelData;
        const steps = ld.steps;
        const depth = 120;
        const loc = this.location || LOCATIONS[0];

        // Set background color for this location
        this.cameras.main.setBackgroundColor(loc.bg);

        // ---- Solid triangle fill under the stairs ----
        // Triangle: top-left corner → stair steps → bottom-right → floor level back to start
        const wallDark = ((loc.wall >> 16 & 0xff) * 0.7 | 0) << 16 | ((loc.wall >> 8 & 0xff) * 0.7 | 0) << 8 | ((loc.wall & 0xff) * 0.7 | 0);
        g.fillStyle(wallDark, 1);
        g.beginPath();
        g.moveTo(ld.startX, ld.startY);
        // Follow stair steps down
        for (const s of steps) {
            g.lineTo(s.x, s.y);
            g.lineTo(s.x, s.y + s.h);
            g.lineTo(s.x + s.w, s.y + s.h);
        }
        // Down to floor + depth
        g.lineTo(ld.endX, ld.endY + depth);
        // Along the bottom
        g.lineTo(ld.startX, ld.endY + depth);
        // Back up to start (this fills the full triangle)
        g.closePath();
        g.fillPath();

        // Solid wall face of the triangle (lighter shade)
        g.fillStyle(loc.wall, 1);
        g.beginPath();
        g.moveTo(ld.startX, ld.startY);
        g.lineTo(ld.startX, ld.endY);  // straight down from top of stairs to floor
        g.lineTo(ld.endX, ld.endY);     // along the floor to bottom of stairs
        g.closePath();
        g.fillPath();

        // Stair stringer (diagonal beam)
        g.lineStyle(3, loc.stair, 0.4);
        g.beginPath();
        g.moveTo(ld.startX + 5, ld.startY + 15);
        g.lineTo(ld.endX - 5, ld.endY - 5);
        g.strokePath();

        // ---- Each step — tread and riser with concrete look ----
        for (let i = 0; i < steps.length; i++) {
            const s = steps[i];

            // Riser (vertical face)
            const riserShade = 0x55 + (i % 2) * 3;
            g.fillStyle((riserShade << 16) | ((riserShade - 5) << 8) | (riserShade + 5), 1);
            g.fillRect(s.x, s.y + s.h, s.w, -s.h < 0 ? 0 : s.h);

            // Riser
            g.fillStyle(loc.stair, 1);
            g.fillRect(s.x, s.y, s.w, s.h);

            // Tread surface (lighter)
            const treadColor = ((loc.stair >> 16 & 0xff) * 1.2 | 0) << 16 | ((loc.stair >> 8 & 0xff) * 1.2 | 0) << 8 | ((loc.stair & 0xff) * 1.2 | 0);
            g.fillStyle(Math.min(treadColor, 0xffffff), 1);
            g.fillRect(s.x, s.y, s.w + 1, 6);

            // Tread nosing (brighter edge)
            const nosingColor = ((loc.stair >> 16 & 0xff) * 1.35 | 0) << 16 | ((loc.stair >> 8 & 0xff) * 1.35 | 0) << 8 | ((loc.stair & 0xff) * 1.35 | 0);
            g.fillStyle(Math.min(nosingColor, 0xffffff), 1);
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
        g.fillStyle(loc.floor, 1);
        g.fillRect(ld.endX, floorY, ld.flatEndX - ld.endX + 1200, 8);

        // Floor body
        const floorDark = ((loc.floor >> 16 & 0xff) * 0.8 | 0) << 16 | ((loc.floor >> 8 & 0xff) * 0.8 | 0) << 8 | ((loc.floor & 0xff) * 0.8 | 0);
        g.fillStyle(floorDark, 1);
        g.fillRect(ld.endX, floorY + 8, ld.flatEndX - ld.endX + 1200, depth);

        // Floor surface highlight
        const floorLight = ((loc.floor >> 16 & 0xff) * 1.15 | 0) << 16 | ((loc.floor >> 8 & 0xff) * 1.15 | 0) << 8 | ((loc.floor & 0xff) * 1.15 | 0);
        g.fillStyle(Math.min(floorLight, 0xffffff), 1);
        g.fillRect(ld.endX, floorY, ld.flatEndX - ld.endX + 1200, 2);

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
        // Diverse crew styles
        const style1 = { skin: 0x8d5524, skinDark: 0x6d3d14, hair: 0x1a1a1a }; // dark skin, black hair — camera op
        const style2 = { skin: 0xc68642, skinDark: 0xa66622, hair: 0x4a2a0a }; // medium brown skin — focus puller
        const style3 = { skin: 0xf1c27d, skinDark: 0xd1a25d, hair: 0x888888 }; // light skin, grey hair — director

        if (tier <= 1) {
            // Tier 1: Wobble — camera shakes, crew annoyed
            const tilt = Math.sin(t*20) * 0.03 * Math.max(0, 1-t*2);
            this.drawCameraRig(g, cx, cy, tilt, 0);
            this.drawCrewPerson(g, crew1X, cy, 0x4a4a5a, false, false, 0, 0, 0, 'lean_left', style1);
            this.drawCrewPerson(g, crew2X, cy, 0x5a4a3a, false, false, 0, 0, 0, 'standing', style2);
            this.drawCrewPerson(g, crew3X, cy, 0x2a2a3a, true, true, 0, 0, 0, 'confident', style3);
        } else if (tier === 2) {
            // Tier 2: Camera tilts, crew steps back and looks angry
            const prog = Math.min(t*2, 1);
            const tilt = prog * 0.35;
            const step = prog * 60;  // step away distance
            this.drawCameraRig(g, cx, cy, tilt, 0);
            // Crew moved further right, angry poses
            this.drawCrewPerson(g, crew1X + step, cy, 0x4a4a5a, false, false, 0, 1, 0, 'standing', style1);
            this.drawCrewPerson(g, crew2X + step*0.7, cy, 0x5a4a3a, false, false, 0, 1, 0, 'standing', style2);
            this.drawCrewPerson(g, crew3X + step*0.4, cy, 0x2a2a3a, true, true, 0, 0, 0, 'confident', style3);
        } else if (tier === 3) {
            // Tier 3: Camera topples, crew scrambles away
            const prog = Math.min(t*1.5, 1);
            const tilt = prog * 1.57;
            const drop = prog * 30;
            const scatter = prog * 120;
            this.drawCameraRig(g, cx, cy, tilt, drop);
            this.drawCrewPerson(g, crew1X + scatter, cy, 0x4a4a5a, false, false, 0, 2, 0, 'standing', style1);
            this.drawCrewPerson(g, crew2X + scatter*0.8, cy, 0x5a4a3a, false, false, 0, 2, 0, 'standing', style2);
            this.drawCrewPerson(g, crew3X + scatter*0.5, cy, 0x2a2a3a, true, true, 0, 1, 0, 'confident', style3);
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
                    this.drawCrewPerson(g, arcX, cy, 0x4a4a5a, false, false, 0, 2, 0, 'standing', style1);
                } else {
                    // Blood pool FIRST (underneath body) — centered on body
                    if (settleT > 0) {
                        const growFactor = 1.0 + Math.min(t * 0.25, 2.0);
                        const bloodW = H * 0.12 * growFactor;
                        const bloodH = H * 0.04 * growFactor;
                        g.fillStyle(0x8b0000, 0.6);
                        const headCX = koX - H*0.17;
                        g.fillEllipse(headCX, cy - H*0.01, bloodW, bloodH);
                        g.fillStyle(0x5a0000, 0.5);
                        g.fillEllipse(headCX, cy - H*0.01, bloodW * 0.5, bloodH * 0.6);
                    }
                    // Knocked out — lying face down (drawn ON TOP of blood)
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

            // === FOCUS PULLER — crawling away, then collapses (full person scale) ===
            {
                const S = 1.0; // full size — same as standing crew
                if (impactT < 0.3) {
                    this.drawCrewPerson(g, crew2X + impactT * 80, cy, 0x5a4a3a, false, false, 0, 2, 0, 'standing', style2);
                } else {
                    // Crawling phase: crawl → stop + vomit → collapse
                    const crawlTime = Math.max(0, t - 0.5);
                    const vomiting = crawlTime > 3.5 && crawlTime <= 7.0;
                    const collapsed = crawlTime > 7.0;
                    const crawlDist = Math.min(crawlTime, 3.5) * H * 0.20;
                    const crawlX = crew2X + 100 + crawlDist;
                    const bob = (collapsed || vomiting) ? 0 : Math.sin(t * 7) * 5;
                    const limb = (collapsed || vomiting) ? 0 : Math.sin(t * 5);

                    if (collapsed) {
                        // Persistent vomit puddle — big final size
                        const vPudX = crawlX + H*0.21;
                        g.fillStyle(0x8a9a2a, 0.7);
                        g.fillEllipse(vPudX, cy + H*0.01, H*0.20, H*0.08);
                        g.fillStyle(0x6a7a1a, 0.5);
                        g.fillEllipse(vPudX, cy + H*0.01, H*0.12, H*0.05);
                        // Face down on ground — head stays on RIGHT (same as crawl direction)
                        const lieX = crawlX;
                        // Torso
                        g.lineStyle(H*0.045, 0x5a4a3a, 1);
                        g.beginPath(); g.moveTo(lieX - H*0.18, cy - H*0.02); g.lineTo(lieX + H*0.18, cy - H*0.03); g.strokePath();
                        // Legs trailing LEFT
                        g.lineStyle(H*0.035, 0x5a4a3a, 1);
                        g.beginPath();
                        g.moveTo(lieX - H*0.18, cy - H*0.02); g.lineTo(lieX - H*0.30, cy - H*0.01);
                        g.moveTo(lieX - H*0.16, cy); g.lineTo(lieX - H*0.28, cy + H*0.015);
                        g.strokePath();
                        // Shoes on LEFT
                        g.fillStyle(0x1a1a1a, 1);
                        g.fillCircle(lieX - H*0.30, cy - H*0.01, H*0.016);
                        g.fillCircle(lieX - H*0.28, cy + H*0.015, H*0.016);
                        // Arms splayed forward (RIGHT)
                        g.lineStyle(H*0.025, 0xd4a87c, 1);
                        g.beginPath();
                        g.moveTo(lieX + H*0.16, cy - H*0.03); g.lineTo(lieX + H*0.24, cy + H*0.01);
                        g.moveTo(lieX + H*0.12, cy - H*0.01); g.lineTo(lieX + H*0.20, cy - H*0.06);
                        g.strokePath();
                        // Head on RIGHT (same direction as crawling)
                        g.fillStyle(0x3a2a1a, 1);
                        g.fillCircle(lieX + H*0.22, cy - H*0.03, H*0.045);
                        g.fillStyle(0xd4a87c, 0.5);
                        g.fillCircle(lieX + H*0.23, cy - H*0.01, H*0.03);
                    } else if (vomiting) {
                        // Stopped crawling, throwing up
                        const vomitProg = (crawlTime - 3.5) / 1.5; // 0 to 1
                        const torsoY = cy - H*0.16;
                        const heaveOff = Math.sin(vomitProg * Math.PI * 4) * H*0.02; // heaving motion
                        // Torso — on all fours, head drooping
                        g.lineStyle(H*0.08, 0x5a4a3a, 1);
                        g.beginPath(); g.moveTo(crawlX - H*0.14, torsoY); g.lineTo(crawlX + H*0.14, torsoY + heaveOff); g.strokePath();
                        // Legs
                        g.lineStyle(H*0.04, 0x5a4a3a, 1);
                        g.beginPath();
                        g.moveTo(crawlX - H*0.14, torsoY); g.lineTo(crawlX - H*0.20, cy);
                        g.moveTo(crawlX - H*0.08, torsoY); g.lineTo(crawlX - H*0.14, cy);
                        g.strokePath();
                        // Arms bracing
                        g.lineStyle(H*0.03, 0xd4a87c, 1);
                        g.beginPath();
                        g.moveTo(crawlX + H*0.12, torsoY + heaveOff); g.lineTo(crawlX + H*0.18, cy);
                        g.moveTo(crawlX + H*0.08, torsoY + heaveOff); g.lineTo(crawlX + H*0.14, cy);
                        g.strokePath();
                        // Head drooping down
                        const hx = crawlX + H*0.19, hy = torsoY + H*0.02 + heaveOff;
                        g.fillStyle(0x3a2a1a, 1);
                        g.fillCircle(hx, hy, H*0.045);
                        g.fillStyle(0xd4a87c, 1);
                        g.fillCircle(hx + H*0.005, hy + H*0.015, H*0.035);
                        // Vomit puddle growing on the ground — gets big
                        if (vomitProg > 0.1) {
                            const vSize = (vomitProg - 0.1) * H * 0.25;
                            g.fillStyle(0x8a9a2a, 0.7);
                            g.fillEllipse(hx + H*0.02, cy + H*0.01, vSize, vSize * 0.4);
                            g.fillStyle(0x6a7a1a, 0.5);
                            g.fillEllipse(hx + H*0.02, cy + H*0.01, vSize * 0.6, vSize * 0.3);
                        }
                        // Vomit stream from mouth
                        if (vomitProg > 0.1 && vomitProg < 0.8) {
                            const streamLen = H * 0.06 * Math.sin(vomitProg * Math.PI);
                            g.lineStyle(H*0.012, 0x8a9a2a, 0.8);
                            g.beginPath(); g.moveTo(hx + H*0.02, hy + H*0.03); g.lineTo(hx + H*0.02, hy + H*0.03 + streamLen); g.strokePath();
                        }
                    } else {
                        // Crawling on all fours — FULL SIZE
                        const torsoY = cy - H*0.16 + bob;
                        // Torso
                        g.lineStyle(H*0.08, 0x5a4a3a, 1);
                        g.beginPath(); g.moveTo(crawlX - H*0.14, torsoY); g.lineTo(crawlX + H*0.14, torsoY); g.strokePath();
                        // Back legs (knees on ground)
                        g.lineStyle(H*0.04, 0x5a4a3a, 1);
                        g.beginPath();
                        g.moveTo(crawlX - H*0.14, torsoY); g.lineTo(crawlX - H*0.22 + limb*H*0.05, cy);
                        g.moveTo(crawlX - H*0.08, torsoY); g.lineTo(crawlX - H*0.14 - limb*H*0.05, cy);
                        g.strokePath();
                        // Front arms
                        g.lineStyle(H*0.03, 0xd4a87c, 1);
                        g.beginPath();
                        g.moveTo(crawlX + H*0.12, torsoY); g.lineTo(crawlX + H*0.22 - limb*H*0.04, cy);
                        g.moveTo(crawlX + H*0.08, torsoY); g.lineTo(crawlX + H*0.16 + limb*H*0.04, cy);
                        g.strokePath();
                        g.fillStyle(0xd4a87c, 1);
                        g.fillCircle(crawlX + H*0.22 - limb*H*0.04, cy, H*0.016);
                        g.fillCircle(crawlX + H*0.16 + limb*H*0.04, cy, H*0.016);
                        // Head — terrified
                        const hx = crawlX + H*0.19, hy = torsoY - H*0.03;
                        g.fillStyle(0x3a2a1a, 1);
                        g.fillCircle(hx, hy, H*0.045);
                        g.fillStyle(0xd4a87c, 1);
                        g.fillCircle(hx + H*0.01, hy + H*0.008, H*0.038);
                        // Wide terrified eyes
                        g.fillStyle(0xffffff, 1);
                        g.fillCircle(hx + H*0.015, hy - H*0.005, H*0.012);
                        g.fillCircle(hx + H*0.03, hy - H*0.005, H*0.012);
                        g.fillStyle(0x222222, 1);
                        g.fillCircle(hx + H*0.017, hy - H*0.003, H*0.005);
                        g.fillCircle(hx + H*0.032, hy - H*0.003, H*0.005);
                        // Open mouth (screaming)
                        g.fillStyle(0x331111, 0.8);
                        g.fillCircle(hx + H*0.02, hy + H*0.02, H*0.010);
                    }
                }
            }

            // === DIRECTOR — pacing far right, screaming, BOTH arms broken (forearms dangle) ===
            {
                // Pacing back and forth, further from the action
                const paceBase = crew3X + (isBulldoze ? H*1.2 : H*0.8);
                const pace = Math.sin(t * 1.5) * H*0.25; // pacing back and forth
                const dirX = paceBase + pace;
                const skin = 0xd4a87c, dirCol = 0x2a2a3a, hair = 0x3a2a1a;
                const dirHipY = cy - H*0.28, dirShY = cy - H*0.64;
                // Legs — walking motion while pacing
                const legSwing = Math.sin(t * 3) * H*0.03;
                g.lineStyle(H*0.035, dirCol, 1);
                g.beginPath();
                g.moveTo(dirX - H*0.03, dirHipY); g.lineTo(dirX - H*0.04 - legSwing, cy);
                g.moveTo(dirX + H*0.03, dirHipY); g.lineTo(dirX + H*0.04 + legSwing, cy);
                g.strokePath();
                // Shoes
                g.fillStyle(0x1a1a1a, 1);
                g.fillRect(dirX - H*0.06 - legSwing, cy - H*0.008, H*0.05, H*0.02);
                g.fillRect(dirX + H*0.02 + legSwing, cy - H*0.008, H*0.05, H*0.02);
                // Torso — slight sway
                const bodySway = Math.sin(t * 2) * H*0.01;
                g.lineStyle(H*0.10, dirCol, 1);
                g.beginPath(); g.moveTo(dirX, dirHipY); g.lineTo(dirX + bodySway, dirShY); g.strokePath();
                // BOTH ARMS BROKEN — upper arms flail, forearms always dangle DOWN
                const wave = Math.sin(t * 6) * H*0.06;
                const wave2 = Math.sin(t * 6 + 2) * H*0.06;
                // Left upper arm — flailing
                const lElbowX = dirX - H*0.12 + wave;
                const lElbowY = dirShY + H*0.02;
                g.lineStyle(H*0.026, dirCol, 1);
                g.beginPath(); g.moveTo(dirX - H*0.08, dirShY); g.lineTo(lElbowX, lElbowY); g.strokePath();
                // Left FOREARM — dangling straight DOWN from elbow (broken!)
                g.lineStyle(H*0.022, skin, 1);
                g.beginPath(); g.moveTo(lElbowX, lElbowY); g.lineTo(lElbowX + Math.sin(t*8)*H*0.01, lElbowY + H*0.14); g.strokePath();
                g.fillStyle(skin, 1);
                g.fillCircle(lElbowX + Math.sin(t*8)*H*0.01, lElbowY + H*0.14, H*0.012);
                // Right upper arm — flailing opposite
                const rElbowX = dirX + H*0.12 + wave2;
                const rElbowY = dirShY + H*0.02;
                g.lineStyle(H*0.026, dirCol, 1);
                g.beginPath(); g.moveTo(dirX + H*0.08, dirShY); g.lineTo(rElbowX, rElbowY); g.strokePath();
                // Right FOREARM — dangling straight DOWN from elbow (broken!)
                g.lineStyle(H*0.022, skin, 1);
                g.beginPath(); g.moveTo(rElbowX, rElbowY); g.lineTo(rElbowX + Math.sin(t*9)*H*0.01, rElbowY + H*0.14); g.strokePath();
                g.fillStyle(skin, 1);
                g.fillCircle(rElbowX + Math.sin(t*9)*H*0.01, rElbowY + H*0.14, H*0.012);
                // Neck + Head
                g.fillStyle(skin, 1);
                g.fillRect(dirX - H*0.014, dirShY - H*0.05, H*0.028, H*0.05);
                const headR = H*0.05;
                const headY = dirShY - H*0.10;
                g.fillStyle(hair, 1);
                g.fillCircle(dirX, headY, headR);
                g.fillRect(dirX - headR*0.9, headY - headR*0.7, headR*1.8, headR*0.5);
                g.fillStyle(skin, 1);
                g.fillCircle(dirX, headY + headR*0.15, headR*0.82);
                // Beret
                g.fillStyle(0x1a1a2a, 1);
                g.fillCircle(dirX, headY - headR*0.4, headR*0.7);
                g.fillRect(dirX - headR*0.8, headY - headR*0.5, headR*1.6, headR*0.3);
                // Screaming face — wide open mouth, angry eyes
                g.fillStyle(0xffffff, 1);
                g.fillCircle(dirX - headR*0.3, headY, headR*0.18);
                g.fillCircle(dirX + headR*0.3, headY, headR*0.18);
                g.fillStyle(0x222222, 1);
                g.fillCircle(dirX - headR*0.28, headY - headR*0.02, headR*0.09);
                g.fillCircle(dirX + headR*0.28, headY - headR*0.02, headR*0.09);
                // Angry eyebrows
                g.lineStyle(H*0.005, hair, 0.8);
                g.beginPath();
                g.moveTo(dirX - headR*0.45, headY - headR*0.10); g.lineTo(dirX - headR*0.15, headY - headR*0.20);
                g.moveTo(dirX + headR*0.15, headY - headR*0.20); g.lineTo(dirX + headR*0.45, headY - headR*0.10);
                g.strokePath();
                // Open mouth (screaming)
                g.fillStyle(0x331111, 1);
                g.fillCircle(dirX, headY + headR*0.40, headR*0.22);
                g.fillStyle(0xcc4444, 0.4);
                g.fillCircle(dirX, headY + headR*0.42, headR*0.14);
            }
        }
    }

    drawCameraRig(g, cx, cy, tilt, drop) {
        const H = CONFIG.PERSON_HEIGHT;
        const S = H / 300;
        const py = cy - H*0.40 + drop;

        // Tripod legs (thicker, sturdier)
        g.lineStyle(6*S, 0x3a3a3a, 1);
        g.beginPath();
        g.moveTo(cx, py); g.lineTo(cx - 60*S, cy);
        g.moveTo(cx, py); g.lineTo(cx + 60*S, cy);
        g.moveTo(cx, py); g.lineTo(cx + 10*S, cy);
        g.strokePath();
        // Tripod feet
        g.fillStyle(0x333333, 1);
        g.fillRect(cx - 65*S, cy - 3*S, 14*S, 5*S);
        g.fillRect(cx + 53*S, cy - 3*S, 14*S, 5*S);
        // Tripod head
        g.fillStyle(0x2a2a2a, 1);
        g.fillCircle(cx, py, 14*S);

        // Camera mounting arm
        const armLen = 55*S;
        const bx = cx + Math.sin(tilt) * armLen;
        const by = py - Math.cos(tilt) * armLen + drop;

        // === ARRI ALEXA-STYLE CAMERA BODY ===
        // Main body — dark rectangular block
        const bw = 65*S, bh = 45*S;
        g.fillStyle(0x2a2a30, 1);
        g.fillRect(bx - bw/2, by - bh/2, bw, bh);
        // Body bevels/panels
        g.fillStyle(0x333340, 1);
        g.fillRect(bx - bw/2 + 3*S, by - bh/2 + 3*S, bw - 6*S, bh/3);
        g.fillStyle(0x222228, 1);
        g.fillRect(bx - bw/2, by + bh/6, bw, bh/3);
        // Body edge highlight
        g.lineStyle(1, 0x444455, 0.5);
        g.strokeRect(bx - bw/2, by - bh/2, bw, bh);

        // Top handle/cage
        g.lineStyle(4*S, 0x333338, 1);
        g.beginPath();
        g.moveTo(bx - bw*0.3, by - bh/2); g.lineTo(bx - bw*0.3, by - bh/2 - 18*S);
        g.lineTo(bx + bw*0.3, by - bh/2 - 18*S); g.lineTo(bx + bw*0.3, by - bh/2);
        g.strokePath();

        // Antennas (2 thin sticks on top)
        g.lineStyle(2*S, 0x444448, 1);
        g.beginPath();
        g.moveTo(bx - bw*0.15, by - bh/2 - 18*S); g.lineTo(bx - bw*0.15 - 3*S, by - bh/2 - 40*S);
        g.moveTo(bx + bw*0.15, by - bh/2 - 18*S); g.lineTo(bx + bw*0.15 + 3*S, by - bh/2 - 40*S);
        g.strokePath();
        // Antenna tips
        g.fillStyle(0x555560, 1);
        g.fillCircle(bx - bw*0.15 - 3*S, by - bh/2 - 40*S, 2*S);
        g.fillCircle(bx + bw*0.15 + 3*S, by - bh/2 - 40*S, 2*S);

        // === LENS BARREL (pointing LEFT toward player) ===
        const lensLen = 55*S;
        const lx = bx - Math.cos(tilt) * (bw/2 + lensLen);
        const ly = Math.min(by + Math.sin(tilt) * (bw/2 + lensLen), cy - 5); // clamp above ground
        const lmx = bx - Math.cos(tilt) * bw/2;
        const lmy = Math.min(by + Math.sin(tilt) * bw/2, cy - 5);
        // Lens barrel (dark cylinder)
        g.lineStyle(28*S, 0x222228, 1);
        g.beginPath(); g.moveTo(lmx, lmy); g.lineTo(lx, ly); g.strokePath();
        // Lens barrel rings
        g.lineStyle(30*S, 0x2a2a32, 1);
        const rmx = (lmx + lx) / 2, rmy = (lmy + ly) / 2;
        g.beginPath(); g.moveTo(rmx - 3*S, rmy); g.lineTo(rmx + 3*S, rmy); g.strokePath();
        // Front glass element
        g.fillStyle(0x1a1a22, 1);
        g.fillCircle(lx, ly, 16*S);
        g.fillStyle(0x2a3a5a, 0.7);
        g.fillCircle(lx, ly, 13*S);
        g.fillStyle(0x4466aa, 0.5);
        g.fillCircle(lx, ly, 9*S);
        // Lens glint
        g.fillStyle(0xaaccff, 0.3);
        g.fillCircle(lx - 4*S, ly - 4*S, 4*S);

        // === VIEWFINDER (arm extending right+up, with small monitor) ===
        const vArmX = bx + Math.cos(tilt) * bw*0.4;
        const vArmY = by - bh/2 - 8*S;
        const vx = vArmX + 25*S;
        const vy = vArmY - 15*S;
        g.lineStyle(3*S, 0x333338, 1);
        g.beginPath(); g.moveTo(vArmX, vArmY); g.lineTo(vx, vy); g.strokePath();
        // Small monitor screen
        g.fillStyle(0x222226, 1);
        g.fillRect(vx - 12*S, vy - 10*S, 24*S, 18*S);
        g.fillStyle(0x334455, 0.4);
        g.fillRect(vx - 10*S, vy - 8*S, 20*S, 14*S);

        // Tally light (red recording indicator)
        g.fillStyle(0xff2222, 0.9);
        g.fillCircle(bx + bw/2 - 5*S, by - bh/2 + 5*S, 3*S);

        // Side panel details (buttons/ports)
        g.fillStyle(0x444450, 0.6);
        g.fillRect(bx + bw/2 - 8*S, by - 5*S, 6*S, 4*S);
        g.fillRect(bx + bw/2 - 8*S, by + 3*S, 6*S, 4*S);
    }

    drawCrewPerson(g, baseX, baseY, bodyCol, hasBeret, hasMonitor, scatter, panic, fly, pose, personStyle) {
        const H = CONFIG.PERSON_HEIGHT;
        const ps = personStyle || {};
        const skin = ps.skin || 0xd4a87c;
        const skinDark = ps.skinDark || (((skin >> 16 & 0xff) * 0.8 | 0) << 16 | ((skin >> 8 & 0xff) * 0.8 | 0) << 8 | ((skin & 0xff) * 0.8 | 0));
        const hair = ps.hair || 0x3a2a1a;
        const bodyDark = ((bodyCol >> 16 & 0xff) * 0.75 | 0) << 16 | ((bodyCol >> 8 & 0xff) * 0.75 | 0) << 8 | ((bodyCol & 0xff) * 0.75 | 0);
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
            // Annoyed — hands on hips, leaning back
            g.lineStyle(H*0.026, bodyCol, 1);
            g.beginPath();
            g.moveTo(shoulderX - H*0.08, shoulderY); g.lineTo(shoulderX - H*0.10, shoulderY + H*0.10);
            g.moveTo(shoulderX + H*0.08, shoulderY); g.lineTo(shoulderX + H*0.10, shoulderY + H*0.10);
            g.strokePath();
            g.lineStyle(H*0.020, skin, 1);
            g.beginPath();
            g.moveTo(shoulderX - H*0.10, shoulderY + H*0.10); g.lineTo(hipX - H*0.04, hipY);
            g.moveTo(shoulderX + H*0.10, shoulderY + H*0.10); g.lineTo(hipX + H*0.04, hipY);
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
        else if (this.playerState === 'stopped' || this.playerState === 'crashed') {
            // Get slope angle at player position for body tilt
            const seg = SEGMENTS[this.currentSegment];
            const slopeAngle = seg ? seg.angle : 0;
            this.drawLying(g, x, y, slopeAngle);
        }
        else this.drawRolling(g, x, y, rotation);
    }

    drawStanding(g, x, y) {
        const H = CONFIG.PERSON_HEIGHT;
        const c = this.costume || COSTUMES[0];
        const ps = this.playerSkin || { skin: 0xd4a87c, skinDark: 0xb08860, hair: 0x2a1a0a };
        const skin = ps.skin, skinDark = ps.skinDark;
        const shirt = c.shirt, shirtDark = ((shirt >> 16 & 0xff) * 0.75 | 0) << 16 | ((shirt >> 8 & 0xff) * 0.75 | 0) << 8 | ((shirt & 0xff) * 0.75 | 0);
        const pants = c.pants, pantsDark = ((pants >> 16 & 0xff) * 0.75 | 0) << 16 | ((pants >> 8 & 0xff) * 0.75 | 0) << 8 | ((pants & 0xff) * 0.75 | 0);
        const hair = ps.hair || 0x2a1a0a, shoe = 0x1a1a1a;
        const headR = H * 0.058;

        // === READY STANCE — feet planted, upper body sways ===
        const crouch = H * 0.10;
        const sway = this.bodySway || 0; // upper body sway (feet stay planted)
        const lean = H * 0.02 + sway; // torso shifts with sway

        // Feet positions — FIXED, never move
        const footLX = x - H * 0.06;
        const footRX = x + H * 0.06;
        const footY = y;

        // Hip position — moves with sway
        const hipX = x + lean;
        const hipY = y - H*0.42 + crouch;

        // Knee positions — always FORWARD (toward right/positive X) of the hip-foot line
        const kneeLX = footLX + H*0.02; // knee slightly forward of foot
        const kneeLY = y - H*0.20 + crouch*0.3;
        const kneeRX = footRX + H*0.02; // knee slightly forward of foot
        const kneeRY = y - H*0.20 + crouch*0.3;

        // Shadow
        g.fillStyle(0x000000, 0.2);
        g.fillEllipse(x, y + 4, H * 0.16, H * 0.02);

        // Shoes — planted
        g.fillStyle(shoe, 1);
        g.fillRect(footLX - H*0.02, footY - H*0.01, H*0.06, H*0.03);
        g.fillRect(footRX - H*0.02, footY - H*0.01, H*0.06, H*0.03);
        g.fillStyle(0x333333, 1);
        g.fillRect(footLX - H*0.02, footY + H*0.015, H*0.06, H*0.008);
        g.fillRect(footRX - H*0.02, footY + H*0.015, H*0.06, H*0.008);

        // Legs — left (back): hip → knee → foot. Knee always forward.
        g.lineStyle(H*0.038, pantsDark, 1);
        g.beginPath();
        g.moveTo(hipX - H*0.02, hipY); g.lineTo(kneeLX, kneeLY);
        g.strokePath();
        g.lineStyle(H*0.032, pantsDark, 1);
        g.beginPath();
        g.moveTo(kneeLX, kneeLY); g.lineTo(footLX, footY + 2);
        g.strokePath();
        // Legs — right (front): hip → knee → foot. Knee always forward.
        g.lineStyle(H*0.038, pants, 1);
        g.beginPath();
        g.moveTo(hipX + H*0.02, hipY); g.lineTo(kneeRX, kneeRY);
        g.strokePath();
        g.lineStyle(H*0.032, pants, 1);
        g.beginPath();
        g.moveTo(kneeRX, kneeRY); g.lineTo(footRX, footY + 2);
        g.strokePath();

        // Belt
        g.fillStyle(0x2a2222, 1);
        g.fillRect(x - H*0.055 + lean, y - H*0.44 + crouch, H*0.11, H*0.018);
        // Belt buckle
        g.fillStyle(0x888877, 1);
        g.fillRect(x - H*0.01 + lean, y - H*0.438 + crouch, H*0.02, H*0.014);

        // Torso — slightly rotated right
        g.fillStyle(shirt, 1);
        g.fillRect(x - H*0.06 + lean, y - H*0.70 + crouch, H*0.12, H*0.27);
        // Torso shadow (right side)
        g.fillStyle(shirtDark, 0.4);
        g.fillRect(x + H*0.02 + lean, y - H*0.70 + crouch, H*0.04, H*0.27);
        // Collar
        g.fillStyle(skin, 1);
        g.beginPath();
        g.moveTo(x - H*0.035 + lean, y - H*0.70 + crouch);
        g.lineTo(x + lean, y - H*0.66 + crouch);
        g.lineTo(x + H*0.035 + lean, y - H*0.70 + crouch);
        g.closePath();
        g.fillPath();

        // Shoulders
        g.fillStyle(shirt, 1);
        g.fillRect(x - H*0.09 + lean, y - H*0.70 + crouch, H*0.18, H*0.035);
        g.fillStyle(shirtDark, 0.3);
        g.fillRect(x - H*0.09 + lean, y - H*0.67 + crouch, H*0.18, H*0.01);

        // Arms out at ~45 degrees, forearms slightly forward
        // Back arm (left) — upper arm out to left-back at 45deg
        g.lineStyle(H*0.028, shirtDark, 1);
        g.beginPath();
        g.moveTo(x - H*0.09 + lean, y - H*0.68 + crouch); g.lineTo(x - H*0.17, y - H*0.56 + crouch);
        g.strokePath();
        // Forearm slightly forward
        g.lineStyle(H*0.022, skinDark, 1);
        g.beginPath();
        g.moveTo(x - H*0.17, y - H*0.56 + crouch); g.lineTo(x - H*0.13, y - H*0.46 + crouch);
        g.strokePath();
        g.fillStyle(skinDark, 1);
        g.fillCircle(x - H*0.13, y - H*0.46 + crouch, H*0.016);

        // Front arm (right) — upper arm out to right at 45deg
        g.lineStyle(H*0.03, shirt, 1);
        g.beginPath();
        g.moveTo(x + H*0.09 + lean, y - H*0.68 + crouch); g.lineTo(x + H*0.19 + lean, y - H*0.56 + crouch);
        g.strokePath();
        // Forearm slightly forward
        g.lineStyle(H*0.024, skin, 1);
        g.beginPath();
        g.moveTo(x + H*0.19 + lean, y - H*0.56 + crouch); g.lineTo(x + H*0.16 + lean, y - H*0.46 + crouch);
        g.strokePath();
        g.fillStyle(skin, 1);
        g.fillCircle(x + H*0.16 + lean, y - H*0.46 + crouch, H*0.018);

        // Neck
        g.fillStyle(skin, 1);
        g.fillRect(x - H*0.018 + lean, y - H*0.76 + crouch, H*0.036, H*0.06);

        // Head — turned to look right
        const headX = x + lean + H*0.01;
        const headY = y - H*0.82 + crouch;
        g.fillStyle(skin, 1);
        g.fillCircle(headX, headY, headR);
        // Hair
        const isFemale = this.playerGender === 'female';
        g.fillStyle(hair, 1);
        g.fillCircle(headX, headY - H*0.03, headR * 0.92);
        g.fillRect(headX - headR, headY - H*0.06, headR*2, headR*0.5);
        if (isFemale) {
            g.fillRect(headX - headR*1.05, headY - H*0.04, headR*0.3, headR*1.8);
            g.fillRect(headX + headR*0.75, headY - H*0.04, headR*0.3, headR*1.8);
            g.lineStyle(headR*0.4, hair, 1);
            g.beginPath();
            g.moveTo(headX, headY - H*0.04);
            g.lineTo(headX - headR*0.3, headY + H*0.07);
            g.lineTo(headX - headR*0.2, headY + H*0.14);
            g.strokePath();
        }
        g.fillStyle(skin, 1);
        g.fillCircle(headX, headY + H*0.02, headR * 0.85);
        // Ear (right side — visible since head turned right)
        g.fillStyle(skinDark, 1);
        g.fillCircle(headX + headR*0.9, headY, headR*0.2);
        // Eyes — shifted right (looking right)
        g.fillStyle(0xffffff, 1);
        g.fillCircle(headX - headR*0.15, headY, headR*0.2);
        g.fillCircle(headX + headR*0.42, headY, headR*0.2);
        g.fillStyle(0x443322, 1);
        g.fillCircle(headX - headR*0.08, headY, headR*0.12);
        g.fillCircle(headX + headR*0.48, headY, headR*0.12);
        g.fillStyle(0x111111, 1);
        g.fillCircle(headX - headR*0.05, headY, headR*0.06);
        g.fillCircle(headX + headR*0.50, headY, headR*0.06);
        // Eyebrows
        g.lineStyle(H*0.005, hair, 0.7);
        g.beginPath();
        g.moveTo(headX - headR*0.32, headY - H*0.02); g.lineTo(headX + headR*0.02, headY - H*0.025);
        g.moveTo(headX + headR*0.28, headY - H*0.025); g.lineTo(headX + headR*0.60, headY - H*0.02);
        g.strokePath();
        // Nose (pointing right)
        g.lineStyle(1, skinDark, 0.4);
        g.beginPath();
        g.moveTo(headX + headR*0.15, headY + H*0.01); g.lineTo(headX + headR*0.25, headY + H*0.005);
        g.strokePath();
        // Mouth — slight determined expression
        g.lineStyle(H*0.004, 0x995544, 0.6);
        g.beginPath();
        g.moveTo(headX - headR*0.05, headY + H*0.03); g.lineTo(headX + headR*0.30, headY + H*0.025);
        g.strokePath();

        // === PAD VISUALS — bumps under clothing ===
        const pv = this.padVisuals || {};
        const padShade = (color, amt) => {
            const r2 = Math.min(255, (color >> 16 & 0xff) + amt);
            const g2 = Math.min(255, (color >> 8 & 0xff) + amt);
            const b2 = Math.min(255, (color & 0xff) + amt);
            return (r2 << 16) | (g2 << 8) | b2;
        };

        if (pv.full) {
            // Full body suit — puffy outline around torso, arms, legs (adjusted for ready stance)
            const puffW = H * 0.018;
            g.fillStyle(padShade(shirt, 15), 0.45);
            // Puffy torso outline
            g.fillRect(x - H*0.06 - puffW + lean, y - H*0.70 + crouch, H*0.12 + puffW*2, H*0.27);
            // Puffy shoulders
            g.fillRect(x - H*0.09 - puffW + lean, y - H*0.70 + crouch, H*0.18 + puffW*2, H*0.035);
            // Puffy upper legs
            g.lineStyle(H*0.052, padShade(pants, 12), 0.35);
            g.beginPath();
            g.moveTo(x - H*0.02 + lean, y - H*0.42 + crouch); g.lineTo(footLX - H*0.01, y - H*0.18 + crouch*0.3);
            g.moveTo(x + H*0.02 + lean, y - H*0.42 + crouch); g.lineTo(footRX + H*0.01, y - H*0.18 + crouch*0.3);
            g.strokePath();
            // Puffy lower legs
            g.lineStyle(H*0.045, padShade(pants, 12), 0.35);
            g.beginPath();
            g.moveTo(footLX - H*0.01, y - H*0.18 + crouch*0.3); g.lineTo(footLX, y + 2);
            g.moveTo(footRX + H*0.01, y - H*0.18 + crouch*0.3); g.lineTo(footRX, y + 2);
            g.strokePath();
            // Puffy arms
            g.lineStyle(H*0.042, padShade(shirt, 15), 0.35);
            g.beginPath();
            g.moveTo(x - H*0.09 + lean, y - H*0.68 + crouch); g.lineTo(x - H*0.17, y - H*0.56 + crouch);
            g.moveTo(x + H*0.09 + lean, y - H*0.68 + crouch); g.lineTo(x + H*0.19 + lean, y - H*0.56 + crouch);
            g.strokePath();
        }

        if (pv.knees > 0) {
            // Knee bumps on both legs — size based on bulk
            const kb = pv.knees;
            const kneeBumpR = H * (0.012 + kb * 0.006);
            const kneeColor = padShade(pants, 18);
            g.fillStyle(kneeColor, 0.7);
            // Left knee
            g.fillCircle(footLX - H*0.01, y - H*0.18 + crouch*0.3, kneeBumpR);
            // Right knee
            g.fillCircle(footRX + H*0.01, y - H*0.18 + crouch*0.3, kneeBumpR);
        }

        if (pv.elbows > 0) {
            // Elbow bumps on both arms
            const eb = pv.elbows;
            const elbowBumpR = H * (0.010 + eb * 0.007);
            const elbowColor = padShade(shirt, 20);
            g.fillStyle(elbowColor, 0.7);
            // Back elbow
            g.fillCircle(x - H*0.17, y - H*0.56 + crouch, elbowBumpR);
            // Front elbow
            g.fillCircle(x + H*0.19 + lean, y - H*0.56 + crouch, elbowBumpR);
        }

        if (pv.hips > 0) {
            // Wider hip bumps
            const hb = pv.hips;
            const hipBumpW = H * (0.010 + hb * 0.008);
            const hipColor = padShade(pants, 14);
            g.fillStyle(hipColor, 0.55);
            // Left hip bulge
            g.fillEllipse(x - H*0.06 - hipBumpW*0.3 + lean, y - H*0.43 + crouch, hipBumpW, H*0.04);
            // Right hip bulge
            g.fillEllipse(x + H*0.06 + hipBumpW*0.3 + lean, y - H*0.43 + crouch, hipBumpW, H*0.04);
        }

        if (pv.back > 0) {
            // Big hump on the back — spine protector makes back 30% bigger
            const bb = pv.back;
            const backBumpW = H * (0.03 + bb * 0.02);
            const backBumpH = H * (0.08 + bb * 0.04);
            const backColor = padShade(shirt, 10);
            g.fillStyle(backColor, 0.6);
            g.fillEllipse(x - H*0.08 + lean, y - H*0.58 + crouch, backBumpW, backBumpH);
            g.fillEllipse(x - H*0.07 + lean, y - H*0.52 + crouch, backBumpW * 0.8, backBumpH * 0.7);
        }

        if (pv.forearms > 0) {
            const fb = pv.forearms;
            const fThick = H * (0.035 + fb * 0.012); // much thicker than normal forearm lines (0.022-0.024)
            const fColor = padShade(skin, 15);
            // Back forearm pad — overlay on elbow-to-hand segment
            g.lineStyle(fThick, fColor, 0.75);
            g.beginPath();
            g.moveTo(x - H*0.17, y - H*0.56 + crouch); g.lineTo(x - H*0.13, y - H*0.46 + crouch);
            g.strokePath();
            // Front forearm pad — overlay on elbow-to-hand segment
            g.lineStyle(fThick, fColor, 0.75);
            g.beginPath();
            g.moveTo(x + H*0.19 + lean, y - H*0.56 + crouch); g.lineTo(x + H*0.16 + lean, y - H*0.46 + crouch);
            g.strokePath();
        }

        if (pv.shins > 0) {
            const sb = pv.shins;
            const sThick = H * (0.045 + sb * 0.014); // much thicker than normal shin lines (0.032)
            const sColor = padShade(pants, 16);
            // Left shin pad — overlay on knee-to-foot segment
            g.lineStyle(sThick, sColor, 0.7);
            g.beginPath();
            g.moveTo(kneeLX, kneeLY); g.lineTo(footLX, footY + 2);
            g.strokePath();
            // Right shin pad — overlay on knee-to-foot segment
            g.lineStyle(sThick, sColor, 0.7);
            g.beginPath();
            g.moveTo(kneeRX, kneeRY); g.lineTo(footRX, footY + 2);
            g.strokePath();
        }

        if (pv.butt > 0) {
            const bb = pv.butt;
            const buttBumpW = H * (0.015 + bb * 0.010);
            const buttColor = padShade(pants, 12);
            g.fillStyle(buttColor, 0.55);
            g.fillEllipse(x - H*0.03 + lean, y - H*0.38 + crouch, buttBumpW, H*0.04 + bb * H*0.01);
            g.fillEllipse(x + H*0.03 + lean, y - H*0.38 + crouch, buttBumpW, H*0.04 + bb * H*0.01);
        }
    }

    drawLying(g, x, y, slopeAngle) {
        slopeAngle = slopeAngle || 0;
        const c = this.costume || COSTUMES[0];
        const ps = this.playerSkin || { skin: 0xd4a87c, skinDark: 0xb08860, hair: 0x2a1a0a };
        const skin = ps.skin, skinDark = ps.skinDark;
        const shirt = c.shirt, shirtDark = ((shirt >> 16 & 0xff) * 0.75 | 0) << 16 | ((shirt >> 8 & 0xff) * 0.75 | 0) << 8 | ((shirt & 0xff) * 0.75 | 0);
        const pants = c.pants, pantsDark = ((pants >> 16 & 0xff) * 0.75 | 0) << 16 | ((pants >> 8 & 0xff) * 0.75 | 0) << 8 | ((pants & 0xff) * 0.75 | 0);
        const hair = ps.hair || 0x2a1a0a, shoe = 0x1a1a1a;
        const H = CONFIG.PERSON_HEIGHT;
        const pv = this.padVisuals || {};
        const fullThick = pv.full ? 1.8 : 1.0; // Michelin Man in lying pose too
        // Bigger crashes = player lies still longer (crash tier multiplies the beat)
        const beatMult = this.crashTier > 0 ? 1 + this.crashTier * 0.4 : 1;
        const beatDur = CONFIG.STOP_BEAT_DURATION * beatMult / 1000;
        const showThumb = this.stopTime > beatDur;
        const thumbProg = showThumb ? Math.min((this.stopTime - beatDur) * 0.9, 1) : 0;

        // Shadow
        g.fillStyle(0x000000, 0.18);
        g.fillEllipse(x, y + 4, H*0.14, H*0.02);

        // Animation phases: 0-0 = lying, then thumbProg 0-0.4 = getting up, 0.4-1 = sitting + arm
        const getUpProg = showThumb ? Math.min(thumbProg / 0.4, 1) : 0; // 0=flat, 1=sitting
        const armProg = showThumb ? Math.max((thumbProg - 0.5) / 0.5, 0) : 0;

        if (!showThumb || getUpProg < 1) {
            // === LYING or GETTING UP — interpolate from flat to sitting ===
            const p = getUpProg; // 0=flat on ground, 1=fully sitting
            const by = y - H*0.04;

            // Torso angle: starts at slope angle (lying on stairs), ends sitting upright
            const torsoAngle = slopeAngle * (1 - p) + p * -1.2;
            const torsoLen = H * 0.22;
            const hipX = x - H*0.04;
            const hipY = by;
            const shoulderX = hipX + Math.cos(torsoAngle) * torsoLen;
            const shoulderY = hipY + Math.sin(torsoAngle) * torsoLen;

            // Legs — follow slope when flat, transition to bent when sitting
            const legLen = H * 0.30;
            // When flat: legs extend down the slope from hips
            const flatLegX = hipX - Math.cos(slopeAngle) * legLen;
            const flatLegY = hipY - Math.sin(slopeAngle) * legLen;
            // When sitting: legs extend forward
            const sitLegX = x + H*0.20;
            const sitLegY = by + 3;
            const legEndX = flatLegX + p * (sitLegX - flatLegX);
            const legEndY = flatLegY + p * (sitLegY - flatLegY);
            g.lineStyle(H*0.04 * fullThick, pants, 1);
            g.beginPath(); g.moveTo(hipX, hipY); g.lineTo(legEndX, legEndY); g.strokePath();
            g.lineStyle(H*0.035 * fullThick, pantsDark, 1);
            g.beginPath(); g.moveTo(hipX, hipY + H*0.03); g.lineTo(legEndX - H*0.02, legEndY + H*0.03); g.strokePath();
            // Shoes
            g.fillStyle(shoe, 1);
            g.fillRect(legEndX - H*0.03, legEndY - H*0.01, H*0.05, H*0.03);
            g.fillRect(legEndX - H*0.05, legEndY + H*0.02, H*0.05, H*0.03);

            // Torso — rotates from horizontal to upright
            g.fillStyle(shirt, 1);
            g.lineStyle(H*0.11 * fullThick, shirt, 1);
            g.beginPath(); g.moveTo(hipX, hipY); g.lineTo(shoulderX, shoulderY); g.strokePath();

            // Arms — from splayed to resting at sides
            const armRestX = shoulderX + (1 - p) * H*0.08 - p * H*0.06;
            const armRestY = shoulderY - (1 - p) * H*0.04 + p * H*0.12;
            g.lineStyle(H*0.025, skin, 1);
            g.beginPath(); g.moveTo(shoulderX, shoulderY); g.lineTo(armRestX, armRestY); g.strokePath();
            // Support arm (propping up during get-up)
            if (p > 0.1 && p < 0.9) {
                g.lineStyle(H*0.025, skin, 1);
                g.beginPath();
                g.moveTo(shoulderX - H*0.06, shoulderY);
                g.lineTo(shoulderX - H*0.12, by + H*0.01);
                g.strokePath();
            }

            // Neck + Head
            const headR = H * 0.05;
            const neckX = shoulderX + Math.cos(torsoAngle - 0.2) * H*0.06;
            const neckY = shoulderY + Math.sin(torsoAngle - 0.2) * H*0.06;
            g.fillStyle(skin, 1);
            g.fillRect(Math.min(shoulderX, neckX), Math.min(shoulderY, neckY) - H*0.01, H*0.03, H*0.05);
            // Head
            const headX = neckX + Math.cos(torsoAngle - 0.3) * H*0.04;
            const headY = neckY + Math.sin(torsoAngle - 0.3) * H*0.04;
            if (p < 0.3) {
                // Lying flat — face DOWN, only hair visible from above
                g.fillStyle(hair, 1);
                g.fillCircle(headX, headY, headR);
                // Small ear visible on the side
                g.fillStyle(skin, 1);
                g.fillCircle(headX, headY + headR*0.7, headR*0.2);
            } else {
                // Getting up / sitting — face becomes visible
                const faceShow = (p - 0.3) / 0.7; // 0 to 1
                // Hair on back of head
                g.fillStyle(hair, 1);
                g.fillCircle(headX, headY, headR);
                // Face rotating into view
                g.fillStyle(skin, 1);
                g.fillCircle(headX + headR*0.2*faceShow, headY + headR*0.15, headR*0.82);
                // Eyes
                if (faceShow > 0.3) {
                    const ef = (faceShow - 0.3) / 0.7;
                    g.fillStyle(0xffffff, ef);
                    g.fillCircle(headX - headR*0.25, headY + headR*0.05, headR*0.12);
                    g.fillCircle(headX + headR*0.25, headY + headR*0.05, headR*0.12);
                    g.fillStyle(0x443322, ef);
                    g.fillCircle(headX - headR*0.22, headY + headR*0.07, headR*0.06);
                    g.fillCircle(headX + headR*0.22, headY + headR*0.07, headR*0.06);
                }
            }
        } else {
            // === FULLY SITTING — thumbs up pose ===
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
            g.lineStyle(H*0.036 * fullThick, pantsDark, 1);
            g.beginPath();
            g.moveTo(hipX + H*0.01, hipY); g.lineTo(x + H*0.19, by + H*0.005);
            g.strokePath();
            // Front leg
            g.lineStyle(H*0.04 * fullThick, pants, 1);
            g.beginPath();
            g.moveTo(hipX, hipY); g.lineTo(x + H*0.21, by - H*0.01);
            g.strokePath();
            // Shoes
            g.fillStyle(shoe, 1);
            g.fillRect(x + H*0.19, by - H*0.005, H*0.045, H*0.02);
            g.fillRect(x + H*0.17, by + H*0.005, H*0.045, H*0.02);

            // === JACKET — filled polygon covering torso+hips as one piece ===
            const jPuff = pv.full ? 1.3 : 1.0;
            g.fillStyle(shirt, 1);
            g.beginPath();
            // Right shoulder
            g.moveTo(shoulderX + H*0.065*jPuff, shoulderY);
            // Down the right side of torso
            g.lineTo(hipX + H*0.055*jPuff, hipY - H*0.02);
            // Across the hip/waist (jacket bottom)
            g.lineTo(hipX - H*0.04*jPuff, hipY + H*0.01);
            // Up the left side (back)
            g.lineTo(shoulderX - H*0.065*jPuff, shoulderY + H*0.02);
            // Across the shoulders
            g.lineTo(shoulderX + H*0.065*jPuff, shoulderY);
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

            // === THUMBS UP ARM (right) — extends out at ~15° above horizontal ===
            const rsx = shoulderX + H*0.06;
            const rsy = shoulderY + H*0.01;
            if (armProg > 0) {
                // Arm extends mostly outward (right) with slight upward angle (~15°)
                const elbowX = rsx + H*0.10 * armProg;
                const elbowY = rsy - H*0.03 * armProg;
                const wristX = elbowX + H*0.10 * armProg;
                const wristY = elbowY - H*0.03 * armProg;

                // Upper arm (sleeve)
                g.lineStyle(H*0.032, shirt, 1);
                g.beginPath(); g.moveTo(rsx, rsy); g.lineTo(elbowX, elbowY); g.strokePath();
                // Forearm
                g.lineStyle(H*0.025, skin, 1);
                g.beginPath(); g.moveTo(elbowX, elbowY); g.lineTo(wristX, wristY); g.strokePath();

                // FIST — simple circle, bigger than the arm
                const fistR = H*0.028;
                const fistCX = wristX;
                const fistCY = wristY;
                g.fillStyle(skin, 1);
                g.fillCircle(fistCX, fistCY, fistR);
                // Slight shadow on bottom
                g.fillStyle(skinDark, 0.2);
                g.fillCircle(fistCX, fistCY + fistR*0.25, fistR*0.7);

                // THUMB — pointing UP from the top-left of the fist
                if (armProg > 0.3) {
                    const tp = (armProg - 0.3) / 0.7;
                    const thumbLen = H*0.025 * tp;
                    const thumbW = H*0.022;
                    const thumbX = fistCX - fistR*0.6;
                    const thumbTopY = fistCY - fistR - thumbLen;
                    g.fillStyle(skin, 1);
                    // Thumb shaft
                    g.fillRect(thumbX - thumbW/2, thumbTopY, thumbW, thumbLen + fistR*0.5);
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
        const c = this.costume || COSTUMES[0];
        const ps = this.playerSkin || { skin: 0xd4a87c, skinDark: 0xb08860, hair: 0x2a1a0a };
        const skin = ps.skin, skinDark = ps.skinDark;
        const shirt = c.shirt, shirtDark = ((shirt >> 16 & 0xff) * 0.7 | 0) << 16 | ((shirt >> 8 & 0xff) * 0.7 | 0) << 8 | ((shirt & 0xff) * 0.7 | 0);
        const pants = c.pants, pantsDark = ((pants >> 16 & 0xff) * 0.7 | 0) << 16 | ((pants >> 8 & 0xff) * 0.7 | 0) << 8 | ((pants & 0xff) * 0.7 | 0);
        const hair = ps.hair || 0x2a1a0a, shoe = 0x1a1a1a;
        const cos = Math.cos(rotation), sin = Math.sin(rotation);
        const rot = (px, py) => ({ x: x + cos*px - sin*py, y: y + sin*px + cos*py });
        const pv = this.padVisuals || {};
        const fullPuff = pv.full ? 1.6 : 1.0; // 60% bigger circles when full suit — Michelin Man
        const fullThick = pv.full ? 1.8 : 1.0; // 80% thicker limb lines when full suit

        // Shadow
        g.fillStyle(0x000000, 0.15);
        g.fillEllipse(x, y + r + 4, r * 0.8, 6);

        // === BARREL ROLL — smooth rounded back with visible limbs ===
        // Tuck factor: 0=normal, 1=tight (boost), -1=open (brake)
        const tk = this.rollTuck || 0;
        // Big visual change: tight=cannonball (boost, tk=1), open=starfish-ish (brake, tk=-1)
        // Negate so positive tk pulls limbs IN (tighter), negative pushes them OUT (opener)
        const s = -tk * r * 0.35;

        // KEY BODY POSITIONS — dramatically adjusted by tuck state
        const hipPos      = rot(0, r*0.38 + s*0.4);
        const kneePos     = rot(r*0.30 + s*1.2, -r*0.05 + s*0.8);    // knees swing way out when open
        const footPos     = rot(r*0.12 + s*1.0, -r*0.35 + s*0.7);    // feet extend when open
        const headPos     = rot(r*0.08 + s*0.4, -r*0.42 - s*0.5);    // head lifts when open
        const shoulderPos = rot(-r*0.18 - s*0.2, -r*0.35);
        const elbowPos    = rot(r*0.15 + s*0.8, r*0.10 + s*0.5);     // elbows flare out
        const handPos     = rot(r*0.25 + s*0.9, -r*0.12 + s*0.6);

        // --- 1. BACK — 5 circles forming a CURVED arc (bulges out in middle) ---
        g.fillStyle(shirt, 1);
        for (let i = 0; i <= 4; i++) {
            const t = i / 4;
            // Middle circles bulge outward — sin curve makes a rounded back
            const bulge = Math.sin(t * Math.PI) * r * 0.20;
            const bx = rot(-r*0.25 - bulge, -r*0.40 + t * r * 0.80);
            const rad = (r * 0.22 + Math.sin(t * Math.PI) * r * 0.04) * fullPuff;
            g.fillCircle(bx.x, bx.y, rad);
        }
        // Subtle shadow on outer edge
        g.fillStyle(shirtDark, 0.15);
        const shadowP = rot(-r*0.45, 0);
        g.fillCircle(shadowP.x, shadowP.y, r * 0.15);

        // --- 2. THIGHS — hip to knees ---
        g.lineStyle(r * 0.18 * fullThick, pants, 1);
        g.beginPath(); g.moveTo(hipPos.x, hipPos.y); g.lineTo(kneePos.x, kneePos.y); g.strokePath();
        g.fillStyle(pants, 1);
        g.fillCircle(kneePos.x, kneePos.y, r * 0.12 * fullPuff);

        // --- 3. SHINS — knee up to feet ---
        g.lineStyle(r * 0.14 * fullThick, pants, 1);
        g.beginPath(); g.moveTo(kneePos.x, kneePos.y); g.lineTo(footPos.x, footPos.y); g.strokePath();

        // --- 4. SHOES ---
        g.fillStyle(shoe, 1);
        g.fillCircle(footPos.x, footPos.y, r * 0.10);

        // --- 5. HEAD — tucked at top ---
        const headR = r * 0.22;
        g.lineStyle(r * 0.10, skin, 1);
        g.beginPath(); g.moveTo(shoulderPos.x, shoulderPos.y); g.lineTo(headPos.x, headPos.y); g.strokePath();
        g.fillStyle(hair, 1);
        g.fillCircle(headPos.x, headPos.y, headR);
        // Ponytail for female
        if (this.playerGender === 'female') {
            const tailEnd = rot(r*0.25, -r*0.55);
            g.lineStyle(headR*0.35, hair, 1);
            g.beginPath(); g.moveTo(headPos.x, headPos.y); g.lineTo(tailEnd.x, tailEnd.y); g.strokePath();
        }

        // --- 6. ARMS — drawn LAST so they appear IN FRONT of body ---
        // Upper arm (sleeve)
        g.lineStyle(r * 0.12 * fullThick, shirt, 1);
        g.beginPath(); g.moveTo(shoulderPos.x, shoulderPos.y); g.lineTo(elbowPos.x, elbowPos.y); g.strokePath();
        // Forearm (skin)
        g.lineStyle(r * 0.10 * fullThick, skin, 1);
        g.beginPath(); g.moveTo(elbowPos.x, elbowPos.y); g.lineTo(handPos.x, handPos.y); g.strokePath();
        // Hand
        g.fillStyle(skin, 1);
        g.fillCircle(handPos.x, handPos.y, r * 0.08 * fullPuff);
    }

    // ================================================================
    // UI
    // ================================================================
    drawMeter() {
        const g = this.meterGfx; g.clear();
        if (this.playerState !== 'idle') { this.meterLabel.setVisible(false); return; }
        this.meterLabel.setVisible(true);
        // Meter extends from top to near bottom of screen
        const mx = 30, my = 85, mw = 28, mh = CONFIG.HEIGHT - 95;
        g.fillStyle(0x1a1a28, 0.9); g.fillRect(mx, my, mw, mh);

        // --- SWEET SPOT ZONES (behind the fill) ---
        const ld = this.levelData;
        const spot = ld.sweetSpot;
        const gw = ld.greenW;
        const yw = ld.yellowExtra;
        // Yellow zone (wider, behind green)
        const yTop = my + mh * (1 - Math.min(1, spot + gw + yw));
        const yBot = my + mh * (1 - Math.max(0, spot - gw - yw));
        g.fillStyle(0xcccc22, 0.20); g.fillRect(mx+2, yTop, mw-4, yBot - yTop);
        // Green zone (tighter)
        const gTop = my + mh * (1 - Math.min(1, spot + gw));
        const gBot = my + mh * (1 - Math.max(0, spot - gw));
        g.fillStyle(0x22cc44, 0.30); g.fillRect(mx+2, gTop, mw-4, gBot - gTop);

        g.lineStyle(1, 0x444466, 0.8); g.strokeRect(mx, my, mw, mh);

        // Current fill
        const fillY = my + mh * (1 - this.meterValue);
        g.fillStyle(0xddddf0, 0.4); g.fillRect(mx+2, fillY, mw-4, mh*this.meterValue);
        // Indicator line
        g.lineStyle(2, 0xffffff, 0.9);
        g.beginPath(); g.moveTo(mx, fillY); g.lineTo(mx+mw, fillY); g.strokePath();
        // Arrow
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
        // Prevent double-updates in same frame (rAF + Phaser both calling)
        const frame = Math.round(time);
        if (frame === this._lastFrame) return;
        this._lastFrame = frame;
        const dt = Math.min(delta, 33) / 1000;
        switch (this.playerState) {
            case 'idle': this.updateIdle(time, dt); break;
            case 'rolling': this.updateRolling(time, dt); break;
            case 'stopped': case 'crashed': this.updateStopped(time, dt); break;
        }
        this.updateCamera();
        this.drawMeter();
        this.drawUI();
    }

    updateIdle(time, dt) {
        this.meterTime += dt;
        // Oscillate between MIN_POWER_FLOOR and 1.0
        // Speed increases with level: L1=2.0 (slow), L12=5.0 (fast)
        // L1=1.0 (very slow), L4=1.6, L8=2.5, L12=3.5
        const levelSpeedMult = 1.0 + (this.currentLevel / 11) * 2.5;
        const floor = CONFIG.MIN_POWER_FLOOR;
        const raw = 0.5 + 0.5 * Math.sin(this.meterTime * levelSpeedMult);
        this.meterValue = floor + raw * (1 - floor);
        this.bounceTime += dt;
        this.bodySway = Math.sin(this.bounceTime * 2.5) * 6; // passed to drawStanding for upper body only
        this.drawPlayer(SEGMENTS[0].startX, SEGMENTS[0].startY - 2, 0);
    }

    updateRolling(time, dt) {
        const seg = SEGMENTS[this.currentSegment];
        const sinA = Math.sin(seg.angle);
        const friction = CONFIG.BASE_FRICTION * (1 - sinA * CONFIG.SLOPE_FRICTION_REDUCTION);
        const gravity = CONFIG.GRAVITY_ASSIST * sinA;
        let ca = 0, edm = 1;

        // Touch zone detection: left half = brake, right half = boost
        // Uses raw screen position so it works even outside the game canvas (portrait mode)
        let touchBrake = false, touchBoost = false;
        const pointer = this.input.activePointer;
        if (pointer && pointer.isDown) {
            // Use raw screen position for full-screen touch zones
            const rawX = pointer.event ? (pointer.event.clientX || pointer.event.touches?.[0]?.clientX) : null;
            const screenMid = window.innerWidth / 2;
            if (rawX != null) {
                if (rawX < screenMid) { touchBrake = true; }
                else { touchBoost = true; }
            } else {
                // Fallback to game coords
                if (pointer.x < CONFIG.WIDTH / 2) { touchBrake = true; }
                else { touchBoost = true; }
            }
        }

        // Track tuck state for animation: -1=opening up (brake), 0=normal, 1=tucking tight (boost)
        if (this.cursors.right.isDown || touchBoost) { ca = CONFIG.BOOST_ACCEL; edm = CONFIG.BOOST_ENERGY_MULT; this.rollTuck = 1; }
        else if (this.cursors.left.isDown || touchBrake) { ca = CONFIG.BRAKE_ACCEL; edm = CONFIG.BRAKE_ENERGY_MULT; this.rollTuck = -1; }
        else {
            // Natural tuck based on acceleration — tighter on steep slopes, open when decelerating
            const netAccel = gravity - friction;
            const naturalTuck = netAccel > 0 ? 0.3 : -0.3;
            this.rollTuck = (this.rollTuck || 0) * 0.9 + naturalTuck * 0.1;
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
        const onFlat = seg.angle === 0;
        const rollSpeed = onFlat ? 0.6 : 1; // on flat ground, still rolling but slower
        this.rollRotation += (dist / circ) * Math.PI * 2 * rollSpeed;
        // Draw ball sitting ON the surface — center offset by radius + buffer
        // Extra offset on stairs prevents clipping through step geometry
        const extraOff = onFlat ? 0 : 12;
        const drawYOff = CONFIG.PLAYER_RADIUS + extraOff;
        this.drawPlayer(pos.x, pos.y - drawYOff, this.rollRotation);

        if (this.playerVelocity <= 0 || this.playerEnergy <= 0) { this.playerVelocity = 0; this.playerState = 'stopped'; this.stopTime = 0; this.onPlayerStopped(); return; }
        if (this.playerWorldX >= this.levelData.cameraX) {
            // On the ground rolling into the camera = crash
            this.playerState = 'crashed'; this.stopTime = 0; this.onPlayerCrashed();
        }
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

        const dm = Math.abs(this.playerWorldX - ld.markX) / CONFIG.PIXELS_PER_FOOT;
        const rawHc = CONFIG.LEVEL_BASE_COST + dm * CONFIG.ACCURACY_COST_MULT;
        const hc = Math.max(1, rawHc - this.protection * 0.3); // pads reduce damage
        this.currentHealth = Math.max(0, this.currentHealth - hc);
        this.scoreData = { distFeet: dm, isPerfect: Math.abs(this.playerWorldX - ld.markX) < CONFIG.PERFECT_THRESHOLD_PX, crashed: false, healthCost: hc };
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
        // Place the player just past the camera — they stop in the wreckage, not far away
        this.playerWorldX = this.levelData.cameraX + 60;
        this.playerWorldY = this.levelData.endY;

        const opx = simDist;
        const dm = Math.abs(this.playerWorldX - this.levelData.markX) / CONFIG.PIXELS_PER_FOOT;
        const th = CONFIG.CRASH_TIER_THRESHOLDS;
        let tier = 1; for (let i = th.length-1; i >= 0; i--) { if (opx >= th[i]) { tier = i+1; break; } }
        tier = Math.min(tier, 5); this.crashTier = tier; this.crashAnimTime = 0;
        const chc = CONFIG.CRASH_TIER_HEALTH_COSTS[tier-1];
        const sp = CONFIG.CRASH_TIER_SCORE_PENALTIES[tier-1];
        const rawHc = CONFIG.LEVEL_BASE_COST + (dm+sp) * CONFIG.ACCURACY_COST_MULT + chc;
        const hc = Math.max(1, rawHc - this.protection * 0.5); // pads reduce crash damage
        this.currentHealth = Math.max(0, this.currentHealth - hc);
        this.scoreData = { distFeet: dm+sp, isPerfect: false, crashed: true, crashTier: tier, healthCost: hc };
        this.showScore();
    }

    showScore() {
        const d = this.scoreData;
        const failed = d.crashed || d.distFeet > 5.1;
        // Higher levels pay much more — low early, high late
        const levelPay = 5 + this.currentLevel * 15 + this.currentLevel * this.currentLevel * 3; // L1=$5, L2=$23, L3=$47, L5=$110, L8=$227, L12=$461
        let baseEarned = failed ? 0 : (d.isPerfect ? levelPay : Math.max(0, Math.round(levelPay - d.distFeet * 2.5)));
        // Any successful completion earns at least $2 (enough for Newspaper & Tape)
        if (!failed && baseEarned < 2) baseEarned = 2;
        let earned = d.isPerfect ? baseEarned * 2 : baseEarned;
        // L1 caps at $9
        if (this.currentLevel === 0) earned = Math.min(earned, 9);
        this.currency += earned;
        this.showingScore = false;
        // Delay ALL text until after the lying-still beat
        this.time.delayedCall(CONFIG.STOP_BEAT_DURATION, () => {
            this.scoreText.setText(d.isPerfect ? '★ PERFECT! ★' : `${feetToStr(d.distFeet)} from mark`).setVisible(true);
            if (d.crashed) {
                const tn = ['','HIT!','LEAN-BACK!','TOPPLE!','FULL CRASH!','BULLDOZE!!'];
                this.crashText.setText(`CRASHED! — ${tn[d.crashTier]}`).setVisible(true);
            }
        });
        this.time.delayedCall(CONFIG.THUMBS_UP_DURATION, () => {
            this.showingScore = true;
            const hs = `Health: ${Math.round(this.currentHealth)}/${CONFIG.BASE_HEALTH}  (-${Math.round(d.healthCost)})`;
            const cs = earned > 0 ? `+$${earned}  (Total: $${this.currency})` : `Total: $${this.currency}`;
            if (this.currentHealth <= 0) {
                this.promptText.setText(`You're too beat up to continue.\nYou survived to Level ${this.currentLevel+1}.`).setVisible(true).setColor('#ff6666');
            } else if (failed) {
                if (d.crashed) {
                    this.promptText.setText(`${hs}`).setVisible(true).setColor('#ffaa66');
                } else {
                    this.promptText.setText(`GOING AGAIN!`).setVisible(true).setColor('#ffffff');
                }
            } else {
                this.promptText.setText(`${hs}\n${cs}`).setVisible(true).setColor('#aaaacc');
            }
        });
    }

    updateStopped(time, dt) {
        this.stopTime += dt;
        this.drawPlayer(this.playerWorldX, this.playerWorldY - 2, 0);
        if (this.crashTier > 0) {
            this.crashAnimTime += dt;
            this.drawCrewScene(this.crashTier, Math.min(this.crashAnimTime/2.5, 1));
        } else if (this.scoreData && this.scoreData.isPerfect) {
            this.crashAnimTime = (this.crashAnimTime || 0) + dt;
            this.drawCrewCelebration(this.crashAnimTime);
        } else if (this.scoreData && !this.scoreData.crashed && this.scoreData.distFeet <= 1.1) {
            // Close to mark — crew nods approvingly
            this.crashAnimTime = (this.crashAnimTime || 0) + dt;
            this.drawCrewNodding(this.crashAnimTime);
        }
    }

    drawCrewCelebration(t) {
        const g = this.crewGfx; g.clear();
        const H = CONFIG.PERSON_HEIGHT;
        const ld = this.levelData;
        const cy = ld.endY;
        const camX = ld.cameraX;

        // Camera rig stays upright
        this.drawCameraRig(g, camX, cy, 0, 0);

        // Crew positions
        const crew1X = camX + 80;
        const crew2X = camX + 160;
        const crew3X = camX + 240;

        // All three crew members celebrating — arms up, bouncing
        const bounce1 = Math.abs(Math.sin(t * 4)) * H * 0.04;
        const bounce2 = Math.abs(Math.sin(t * 4 + 1)) * H * 0.04;
        const bounce3 = Math.abs(Math.sin(t * 4 + 2)) * H * 0.04;

        // Clapping hands animation
        const clap1 = Math.sin(t * 8) > 0;
        const clap2 = Math.sin(t * 8 + 1) > 0;
        const clap3 = Math.sin(t * 8 + 2) > 0;

        const style1 = { skin: 0x8d5524, hair: 0x0a0808 };
        const style2 = { skin: 0xc68642, hair: 0x2a1a0a };
        const style3 = { skin: 0xf5d0a9, hair: 0x3a2a1a };

        this.drawCelebPerson(g, crew1X, cy - bounce1, 0x4a4a5a, t, clap1, style1);
        this.drawCelebPerson(g, crew2X, cy - bounce2, 0x5a4a3a, t, clap2, style2);
        this.drawCelebPerson(g, crew3X, cy - bounce3, 0x2a2a3a, t, clap3, style3);
    }

    drawCelebPerson(g, x, cy, clothCol, t, clapping, style) {
        const H = CONFIG.PERSON_HEIGHT;
        const skin = style.skin, hair = style.hair;
        const hipY = cy - H*0.28, shY = cy - H*0.64;

        // Legs
        g.lineStyle(H*0.035, clothCol, 1);
        g.beginPath();
        g.moveTo(x - H*0.03, hipY); g.lineTo(x - H*0.04, cy);
        g.moveTo(x + H*0.03, hipY); g.lineTo(x + H*0.04, cy);
        g.strokePath();
        // Shoes
        g.fillStyle(0x1a1a1a, 1);
        g.fillRect(x - H*0.06, cy - H*0.008, H*0.05, H*0.02);
        g.fillRect(x + H*0.02, cy - H*0.008, H*0.05, H*0.02);
        // Torso
        g.lineStyle(H*0.10, clothCol, 1);
        g.beginPath(); g.moveTo(x, hipY); g.lineTo(x, shY); g.strokePath();

        // Arms — clapping above head!
        const armAngle = clapping ? 0.3 : -0.3;
        const lHandX = x - H*0.04 + armAngle * H*0.08;
        const rHandX = x + H*0.04 - armAngle * H*0.08;
        const handY = shY - H*0.20;
        // Left arm up
        g.lineStyle(H*0.026, clothCol, 1);
        g.beginPath(); g.moveTo(x - H*0.08, shY); g.lineTo(lHandX, handY); g.strokePath();
        g.lineStyle(H*0.022, skin, 1);
        g.beginPath(); g.moveTo(lHandX, handY); g.lineTo(lHandX + H*0.02, handY - H*0.04); g.strokePath();
        // Right arm up
        g.lineStyle(H*0.026, clothCol, 1);
        g.beginPath(); g.moveTo(x + H*0.08, shY); g.lineTo(rHandX, handY); g.strokePath();
        g.lineStyle(H*0.022, skin, 1);
        g.beginPath(); g.moveTo(rHandX, handY); g.lineTo(rHandX - H*0.02, handY - H*0.04); g.strokePath();
        // Hands
        g.fillStyle(skin, 1);
        g.fillCircle(lHandX + H*0.02, handY - H*0.04, H*0.012);
        g.fillCircle(rHandX - H*0.02, handY - H*0.04, H*0.012);

        // Head
        const headR = H*0.05;
        const headY = shY - H*0.10;
        g.fillStyle(skin, 1);
        g.fillRect(x - H*0.014, shY - H*0.05, H*0.028, H*0.05);
        g.fillStyle(hair, 1);
        g.fillCircle(x, headY, headR);
        g.fillStyle(skin, 1);
        g.fillCircle(x, headY + headR*0.15, headR*0.82);
        // Happy face — big smile!
        g.fillStyle(0xffffff, 1);
        g.fillCircle(x - headR*0.3, headY, headR*0.16);
        g.fillCircle(x + headR*0.3, headY, headR*0.16);
        g.fillStyle(0x222222, 1);
        g.fillCircle(x - headR*0.28, headY - headR*0.02, headR*0.08);
        g.fillCircle(x + headR*0.28, headY - headR*0.02, headR*0.08);
        // Big smile
        g.lineStyle(H*0.004, 0x995544, 0.8);
        g.beginPath();
        g.arc(x, headY + headR*0.25, headR*0.25, 0.2, Math.PI - 0.2);
        g.strokePath();
    }

    drawCrewNodding(t) {
        const g = this.crewGfx; g.clear();
        const H = CONFIG.PERSON_HEIGHT;
        const ld = this.levelData;
        const cy = ld.endY;
        const camX = ld.cameraX;
        this.drawCameraRig(g, camX, cy, 0, 0);

        const crew1X = camX + 80, crew2X = camX + 160, crew3X = camX + 240;
        const style1 = { skin: 0x8d5524, hair: 0x0a0808 };
        const style2 = { skin: 0xc68642, hair: 0x2a1a0a };
        const style3 = { skin: 0xf5d0a9, hair: 0x3a2a1a };
        const cols = [0x4a4a5a, 0x5a4a3a, 0x2a2a3a];
        const styles = [style1, style2, style3];
        const xs = [crew1X, crew2X, crew3X];

        for (let i = 0; i < 3; i++) {
            const x = xs[i], cl = cols[i], st = styles[i];
            const skin = st.skin, hair = st.hair;
            const hipY = cy - H*0.28, shY = cy - H*0.64;
            const headR = H*0.05;

            // Legs
            g.lineStyle(H*0.035, cl, 1);
            g.beginPath();
            g.moveTo(x - H*0.03, hipY); g.lineTo(x - H*0.04, cy);
            g.moveTo(x + H*0.03, hipY); g.lineTo(x + H*0.04, cy);
            g.strokePath();
            g.fillStyle(0x1a1a1a, 1);
            g.fillRect(x - H*0.06, cy - H*0.008, H*0.05, H*0.02);
            g.fillRect(x + H*0.02, cy - H*0.008, H*0.05, H*0.02);
            // Torso
            g.lineStyle(H*0.10, cl, 1);
            g.beginPath(); g.moveTo(x, hipY); g.lineTo(x, shY); g.strokePath();
            // Arms folded / at sides
            g.lineStyle(H*0.026, cl, 1);
            g.beginPath();
            g.moveTo(x - H*0.08, shY); g.lineTo(x - H*0.10, shY + H*0.14);
            g.moveTo(x + H*0.08, shY); g.lineTo(x + H*0.10, shY + H*0.14);
            g.strokePath();
            g.lineStyle(H*0.022, skin, 1);
            g.beginPath();
            g.moveTo(x - H*0.10, shY + H*0.14); g.lineTo(x - H*0.06, shY + H*0.22);
            g.moveTo(x + H*0.10, shY + H*0.14); g.lineTo(x + H*0.06, shY + H*0.22);
            g.strokePath();
            // Neck
            g.fillStyle(skin, 1);
            g.fillRect(x - H*0.014, shY - H*0.05, H*0.028, H*0.05);
            // Head — fast nodding
            const nod = Math.sin(t * 8 + i * 1.5) * H*0.022;
            const headY = shY - H*0.10 + nod;
            g.fillStyle(hair, 1);
            g.fillCircle(x, headY, headR);
            g.fillStyle(skin, 1);
            g.fillCircle(x, headY + headR*0.15, headR*0.82);
            // Eyes — look toward neighboring crew member, pupils track nod
            const eyeNod = nod * 0.8; // eyes follow the nod
            // Middle guy looks left, outer guys look inward
            const lookDir = i === 0 ? 1 : i === 2 ? -1 : (Math.sin(t * 2) > 0 ? -1 : 1);
            const eyeShiftX = lookDir * headR * 0.06;
            g.fillStyle(0xffffff, 1);
            g.fillCircle(x - headR*0.3, headY, headR*0.14);
            g.fillCircle(x + headR*0.3, headY, headR*0.14);
            g.fillStyle(0x222222, 1);
            g.fillCircle(x - headR*0.28 + eyeShiftX, headY + eyeNod * 0.3, headR*0.07);
            g.fillCircle(x + headR*0.28 + eyeShiftX, headY + eyeNod * 0.3, headR*0.07);
            // Approving smile
            g.lineStyle(H*0.003, 0x995544, 0.6);
            g.beginPath();
            g.arc(x, headY + headR*0.28, headR*0.18, 0.3, Math.PI - 0.3);
            g.strokePath();
        }
    }
}

// ============================================================
// STORE SCENE
// ============================================================
const PADS = [
    // Specialty (early)
    { name: 'Newspaper & Tape', cost: 2, protection: 1, minLevel: 0, category: 'Specialty', desc: 'Desperate times... $1.50 from the corner store.', bulk: 2, location: 'knees' },
    // Knees & Elbows
    { name: 'Foam Knee Pads', cost: 10, protection: 2, minLevel: 0, category: 'Knees & Elbows', desc: 'Basic foam. Cheap but flimsy.', bulk: 1, location: 'knees' },
    { name: 'Rollerblade Elbow Pads', cost: 20, protection: 3, minLevel: 2, category: 'Knees & Elbows', desc: 'Big chunky elbow protection.', bulk: 3, location: 'elbows' },
    // Head
    { name: 'Wig w/ Hidden Pads', cost: 40, protection: 4, minLevel: 3, category: 'Head', desc: 'Fashion meets function.', bulk: 0, location: 'head' },
    // Back & Core
    { name: 'D3O Hip Pads', cost: 75, protection: 6, minLevel: 4, category: 'Back & Core', desc: 'Smart foam. Hardens on impact.', bulk: 1, location: 'hips' },
    { name: 'Hard Shell Knee', cost: 120, protection: 8, minLevel: 5, category: 'Knees & Elbows', desc: 'Serious knee protection.', bulk: 2, location: 'knees' },
    { name: 'Forearm Guards', cost: 90, protection: 5, minLevel: 5, category: 'Arms & Legs', desc: 'Makes your forearms bulky.', bulk: 2, location: 'forearms' },
    { name: 'Shin Guards', cost: 80, protection: 5, minLevel: 4, category: 'Arms & Legs', desc: 'Soccer-style shin protection.', bulk: 2, location: 'shins' },
    { name: 'Padded Shorts', cost: 100, protection: 6, minLevel: 6, category: 'Back & Core', desc: 'Extra cushion for the pushin.', bulk: 2, location: 'butt' },
    { name: 'Spine Protector', cost: 200, protection: 12, minLevel: 7, category: 'Back & Core', desc: 'Keeps your back intact.', bulk: 2, location: 'back' },
    // Specialty (late)
    { name: 'Full Body Suit', cost: 400, protection: 18, minLevel: 9, category: 'Specialty', desc: 'The Michelin Man look.', bulk: 3, location: 'full' },
];

class StoreScene extends Phaser.Scene {
    constructor() { super('StoreScene'); }

    init(data) {
        this.health = data.health;
        this.level = data.level;
        this.currency = data.currency;
        this.ownedPads = data.ownedPads || [];
        this.protection = data.protection || 0;
        this.skinTone = data.skinTone;
        this.playerGender = data.playerGender;
        this.restWeek = data.restWeek || false;
    }

    create() {
        this.add.rectangle(CONFIG.WIDTH/2, CONFIG.HEIGHT/2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x1a1a2a);

        // Scrollable container for the store items
        const headerH = 120;
        const footerH = 80;
        const scrollH = CONFIG.HEIGHT - headerH - footerH;

        // Header — fixed
        if (this.restWeek && !this._restDismissed) {
            // Full-screen diagonal rest overlay — tap to dismiss
            const overlay = this.add.rectangle(CONFIG.WIDTH/2, CONFIG.HEIGHT/2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x0a2a0a, 0.85);
            overlay.setDepth(100);
            // Diagonal green banner
            const banner = this.add.rectangle(CONFIG.WIDTH/2, CONFIG.HEIGHT/2, CONFIG.WIDTH * 1.5, 160, 0x1a5a1a);
            banner.setAngle(-15);
            banner.setDepth(101);
            banner.setStrokeStyle(4, 0x44cc44);
            const title = this.add.text(CONFIG.WIDTH/2, CONFIG.HEIGHT/2 - 25, "END OF THE WEEK", {
                fontSize: '52px', fontFamily: 'Georgia, serif', color: '#88ffaa', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 5,
            }).setOrigin(0.5).setDepth(102).setAngle(-15);
            const sub = this.add.text(CONFIG.WIDTH/2, CONFIG.HEIGHT/2 + 30, "Your health has been restored.\nGood luck this week!", {
                fontSize: '28px', fontFamily: 'Arial', color: '#aaddbb', align: 'center',
                stroke: '#000000', strokeThickness: 3,
            }).setOrigin(0.5).setDepth(102).setAngle(-15);
            const tap = this.add.text(CONFIG.WIDTH/2, CONFIG.HEIGHT - 80, "TAP TO CONTINUE", {
                fontSize: '22px', fontFamily: 'Arial', color: '#88aa88',
            }).setOrigin(0.5).setDepth(102);
            // Dismiss on tap/click
            overlay.setInteractive();
            overlay.on('pointerdown', () => {
                this._restDismissed = true;
                overlay.destroy(); banner.destroy(); title.destroy(); sub.destroy(); tap.destroy();
            });
        }
        this.add.text(CONFIG.WIDTH/2, 30, 'PAD STORE', {
            fontSize: '42px', fontFamily: 'Georgia, serif', color: '#ccccee',
            stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5);
        this.add.text(CONFIG.WIDTH/2, 80, `Cash: $${this.currency}  |  Health: ${Math.round(this.health)}/${CONFIG.BASE_HEALTH}  |  Protection: ${this.protection}`, {
            fontSize: '22px', fontFamily: 'Arial', color: '#8888aa',
        }).setOrigin(0.5);

        // Build items into a container for scrolling
        // Sort pads into sections: NEW (just unlocked), available (for purchase), owned (in stunt bag)
        const container = this.add.container(0, headerH);
        let curY = 10;
        const itemH = 160;

        // Categorize pads
        const newPads = [];      // just unlocked at this level, not owned
        const availPads = [];    // available but not new, not owned
        const ownedPads = [];    // already purchased
        PADS.forEach((pad, i) => {
            if (pad.minLevel != null && this.level < pad.minLevel) return; // not yet available
            if (this.ownedPads.includes(i)) {
                ownedPads.push({ pad, i });
            } else if (pad.minLevel != null && pad.minLevel >= this.level) {
                newPads.push({ pad, i });
            } else {
                availPads.push({ pad, i });
            }
        });

        // Helper to render a pad item
        const renderPad = (pad, i, owned) => {
            const y = curY;
            const canBuy = !owned && this.currency >= pad.cost;
            const bg = this.add.rectangle(CONFIG.WIDTH/2, y + itemH/2, CONFIG.WIDTH - 30, itemH - 10, owned ? 0x2a3a2a : 0x1e1e2e);
            bg.setStrokeStyle(2, owned ? 0x44aa44 : 0x333355);
            container.add(bg);
            container.add(this.add.text(40, y + 14, pad.name, {
                fontSize: '38px', fontFamily: 'Arial', color: owned ? '#66cc66' : '#ccccdd',
            }));
            container.add(this.add.text(40, y + 60, pad.desc, {
                fontSize: '24px', fontFamily: 'Arial', color: '#666688',
            }));
            const dmgReduction = (pad.protection * 0.3).toFixed(1);
            container.add(this.add.text(40, y + 95, `+${pad.protection} protection  •  -${dmgReduction} damage/level`, {
                fontSize: '22px', fontFamily: 'Arial', color: '#88cc88',
            }));
            if (owned) {
                container.add(this.add.text(CONFIG.WIDTH - 120, y + itemH/2, 'EQUIPPED', {
                    fontSize: '28px', fontFamily: 'Arial', color: '#44aa44', fontStyle: 'bold',
                }).setOrigin(0.5));
            } else {
                const btnColor = canBuy ? 0x3a5a3a : 0x3a2a2a;
                const btn = this.add.rectangle(CONFIG.WIDTH - 120, y + itemH/2, 180, 70, btnColor);
                btn.setStrokeStyle(3, canBuy ? 0x66cc66 : 0x664444);
                container.add(btn);
                container.add(this.add.text(CONFIG.WIDTH - 120, y + itemH/2, `$${pad.cost}`, {
                    fontSize: '34px', fontFamily: 'Arial', color: canBuy ? '#88ff88' : '#884444', fontStyle: 'bold',
                }).setOrigin(0.5));
                if (canBuy) {
                    btn.setInteractive({ useHandCursor: true });
                    btn.on('pointerdown', () => {
                        this.currency -= pad.cost;
                        this.ownedPads.push(i);
                        this.protection += pad.protection;
                        this.scene.restart({
                            health: this.health, level: this.level,
                            currency: this.currency, ownedPads: this.ownedPads,
                            protection: this.protection, skinTone: this.skinTone, playerGender: this.playerGender
                        });
                    });
                }
            }
            curY += itemH;
        };

        // === NEW section ===
        if (newPads.length > 0) {
            const newBanner = this.add.rectangle(CONFIG.WIDTH/2, curY + 18, CONFIG.WIDTH - 30, 36, 0x4a2a0a);
            newBanner.setStrokeStyle(2, 0xffaa44);
            container.add(newBanner);
            container.add(this.add.text(CONFIG.WIDTH/2, curY + 18, 'NEW', {
                fontSize: '26px', fontFamily: 'Arial', color: '#ffcc44', fontStyle: 'bold', letterSpacing: 6,
            }).setOrigin(0.5));
            curY += 44;
            newPads.forEach(({ pad, i }) => renderPad(pad, i, false));
        }

        // === Available section ===
        if (availPads.length > 0) {
            container.add(this.add.text(40, curY, 'AVAILABLE', {
                fontSize: '26px', fontFamily: 'Arial', color: '#5566aa', letterSpacing: 4,
            }));
            curY += 38;
            availPads.forEach(({ pad, i }) => renderPad(pad, i, false));
        }

        // === In Your Stunt Bag section ===
        if (ownedPads.length > 0) {
            curY += 10;
            const bagBanner = this.add.rectangle(CONFIG.WIDTH/2, curY + 18, CONFIG.WIDTH - 30, 36, 0x1a2a1a);
            bagBanner.setStrokeStyle(2, 0x44aa44);
            container.add(bagBanner);
            container.add(this.add.text(CONFIG.WIDTH/2, curY + 18, 'IN YOUR STUNT BAG', {
                fontSize: '24px', fontFamily: 'Arial', color: '#66cc66', fontStyle: 'bold', letterSpacing: 4,
            }).setOrigin(0.5));
            curY += 44;
            ownedPads.forEach(({ pad, i }) => renderPad(pad, i, true));
        }

        // Enable scrolling via drag — track last pointer Y for smooth dragging
        const totalContentH = curY + 20;
        const maxScroll = Math.max(0, totalContentH - scrollH);
        let dragLastY = 0;
        let isDragging = false;
        this.input.on('pointerdown', (pointer) => {
            // Only start drag if in the scroll area (not on continue button)
            if (pointer.y > headerH && pointer.y < CONFIG.HEIGHT - footerH) {
                dragLastY = pointer.y;
                isDragging = true;
            }
        });
        this.input.on('pointermove', (pointer) => {
            if (isDragging && pointer.isDown && maxScroll > 0) {
                const dy = pointer.y - dragLastY;
                dragLastY = pointer.y;
                container.y = Phaser.Math.Clamp(container.y + dy, headerH - maxScroll, headerH);
            }
        });
        this.input.on('pointerup', () => { isDragging = false; });
        // Scroll wheel
        this.input.on('wheel', (pointer, gameObjects, dx, dy) => {
            if (maxScroll > 0) {
                container.y = Phaser.Math.Clamp(container.y - dy * 0.5, headerH - maxScroll, headerH);
            }
        });

        // "Let's Roll" button — near bottom but safely visible in landscape
        const btnY = Math.min(CONFIG.HEIGHT - 35, curY + headerH + 30);
        const contBtn = this.add.rectangle(CONFIG.WIDTH/2, btnY, 360, 55, 0x3a3a6a);
        contBtn.setStrokeStyle(3, 0x6666cc);
        contBtn.setInteractive({ useHandCursor: true });
        this.add.text(CONFIG.WIDTH/2, btnY, "LET'S ROLL BABY!", {
            fontSize: '26px', fontFamily: 'Arial', color: '#aaaaff', fontStyle: 'bold',
        }).setOrigin(0.5);
        contBtn.on('pointerdown', () => {
            this.scene.start('PlayScene', {
                health: this.health, level: this.level,
                currency: this.currency, ownedPads: this.ownedPads,
                protection: this.protection, skinTone: this.skinTone, playerGender: this.playerGender
            });
        });

        // Also allow spacebar to continue
        const goNext = () => {
            this.scene.start('PlayScene', {
                health: this.health, level: this.level,
                currency: this.currency, ownedPads: this.ownedPads,
                protection: this.protection, skinTone: this.skinTone, playerGender: this.playerGender
            });
        };
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', goNext);

        // If nothing left to buy, tap anywhere to continue
        const canBuyAnything = PADS.some((pad, i) => !this.ownedPads.includes(i) && this.level >= (pad.minLevel || 0) && this.currency >= pad.cost);
        if (!canBuyAnything) {
            this.add.text(CONFIG.WIDTH/2, CONFIG.HEIGHT - 80, 'Nothing to buy — tap anywhere!', {
                fontSize: '18px', fontFamily: 'Arial', color: '#888899',
            }).setOrigin(0.5);
            this.input.on('pointerdown', goNext);
        }
    }
}

// ============================================================
const game = new Phaser.Game({
    type: Phaser.AUTO, width: CONFIG.WIDTH, height: CONFIG.HEIGHT,
    backgroundColor: CONFIG.BG_COLOR, parent: document.body,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { touch: true, activePointers: 3 },
    scene: [PlayScene, StoreScene],
});
