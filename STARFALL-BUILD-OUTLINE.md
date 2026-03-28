# STARFALL — Build Outline & Scope Sequence

## Game Summary

A side-scrolling stunt game where the player barrel-rolls down stairs and tries to land on a mark. Too much power and you crash into the film camera. Too little and you slide to a stop. Set on a film set with a visible crew (camera operator, focus puller, director). The player is a stunt performer who accumulates injuries across levels, buys protective pads, and progresses through increasingly complex stair configurations until their body gives out.

The game is structured as a **run**. Health persists across levels. When you take too much damage, the run ends and you start over from level 1. Each run is an attempt to get as far as possible.

---

## Core Physics Model

This section defines how the game works mechanically. Every phase builds on these rules.

### The Power Meter

The power meter is a single oscillating bar that the player stops with spacebar/click/tap. It sets **two things simultaneously**:

- **Initial velocity** — how fast the player launches into the roll
- **Total energy budget** — how much energy the player has for the entire descent

High power = fast launch + large energy pool. Low power = slow start + small energy pool. The player makes one decision and lives with it.

### What Stops the Player

Two forces drain the player during a roll:

1. **Friction** — constant drag that reduces momentum. Steeper stairs have less friction (gravity assists). Shallower stairs have more friction (gravity fights the roll). Flat sections have maximum friction.
2. **Energy drain** — the energy meter ticks down as the player rolls. Steeper stairs drain energy slower. Shallower stairs drain energy faster.

The player stops when **either** momentum reaches zero (friction wins) **or** energy reaches zero (budget spent). On steep stairs, energy tends to outlast momentum — the player arrives fast but may overshoot. On shallow stairs, energy tends to run out first — the player slows to a stop and may undershoot.

### Mid-Roll Controls

These are **minor adjustments**, not course corrections. The power meter is the game. Mid-roll controls are fine-tuning.

- **Right arrow**: Slight speed boost (pencil roll animation). Burns energy faster.
- **Left arrow**: Slight brake (spread-out animation). Conserves energy but increases friction.
- **Up arrow / spacebar**: Small jump. Useful for clearing obstacles in later levels.

A player who sets the power meter perfectly should not need mid-roll controls to hit the mark. A player who's slightly off can nudge toward the target. A player who's way off cannot fix it mid-roll.

### Scoring

Score is based on **distance from the mark**. Undershooting and overshooting are penalized equally — 3 meters short and 3 meters long produce the same score.

**Exception**: Crashing into the camera is a separate penalty on top of the distance score. The camera crash is always bad. There is no bonus for spectacular destruction. The five crash tiers exist to give the player feedback on how badly they overshot, not to reward them for it.

### Health & Injury (Run Structure)

Health persists across the entire run. Every level costs some health. Crashing costs more. Bad landings cost more than clean ones.

- **Health meter** is always visible at the top of the screen during gameplay, alongside the energy meter.
- **Injury effects**: As health drops, the player's pre-roll idle animation degrades (limping, holding their side, slower bounce).
- **Ragdoll threshold**: If health drops too low during a level, the player collapses into a ragdoll and slides limply down the remaining stairs. **This ends the run.** Game over. Return to the title screen and start a new run from level 1.
- **Pads** (purchased between levels) reduce health loss. The pad economy is the player's tool for extending their run.

This creates a roguelike-style structure: each run is an attempt to get as far as possible, and smart pad purchases extend your survival.

---

## PHASE 1 — Core Loop Prototype

**Goal:** Playable single-screen stair fall with power meter, energy system, and landing zone. No art polish, no store, no crew characters. Prove the mechanic is fun.

### Build Steps

1. **Static stair geometry** — One staircase at 35° (realistic standard angle), flat landing at the bottom, mark on the ground, camera position at far right edge
2. **Player capsule** — Simple circle/capsule that spawns at the top of the stairs
3. **Idle bounce animation** — Player rocks back and forth at the top (runner-ready loop)
4. **Power meter** — Oscillating bar that the player stops with spacebar/click/tap. Sets initial velocity and total energy budget simultaneously. Oscillation speed tuned so it's hard to nail the exact power
5. **Energy meter UI** — Displayed at top of screen. Starts at the value set by the power meter. Drains as the player rolls. Drain rate varies by surface angle
6. **Health meter UI** — Displayed at top of screen alongside energy meter. Starts full at beginning of run. Decreases after each level based on performance. Placeholder values for Phase 1
7. **Launch & roll physics** — Player launches at set velocity, rolls down stairs. Friction reduces momentum continuously. Energy drains continuously. Player stops when momentum OR energy reaches zero
8. **Mid-roll controls** — Right arrow: slight speed boost, burns energy faster. Left arrow: slight brake, conserves energy. Up arrow / spacebar: small jump. All three are minor adjustments — a perfectly-set power meter should not require them
9. **Landing & scoring** — Player stops. Distance from mark calculated (absolute value — undershoot and overshoot penalized equally). Score displayed as text overlay
10. **Camera crash detection** — If player reaches the camera position, flag as crash. Overshoot distance recorded for crash tier logic (built in Phase 3). For now, just display "CRASHED" text
11. **Thumbs-up moment** — Player stops, faces camera, holds for 2 seconds while score text shows. Same pose regardless of outcome

### Review Checkpoint 1

**What to evaluate:**
- Is the power meter satisfying? Is the oscillation speed right?
- Does the dual-output (velocity + energy) feel coherent — can the player intuit that more power means more speed AND more fuel?
- Does friction vs. energy drain produce different outcomes on the same staircase depending on power level?
- Are mid-roll controls useful but not dominant? Can you tell the power meter is the real decision?
- Does the 2-second thumbs-up pause feel right or too long?
- Is the health meter readable alongside the energy meter without clutter?

**Key question:** Would you play this 10 times in a row trying to get a perfect score?

---

## PHASE 2 — Roll Animation & Player Character

**Goal:** Replace the capsule with an animated stunt performer. Two rolling silhouettes: thin (normal) and fat (heavily padded). Detail is reserved for the damage portrait — mid-roll readability is the priority.

### Build Steps

1. **Base character sprite** — Athletic figure in profile. Gender-neutral base rig. Visible as male or female depending on sprite swap (random per level in MVP)
2. **Thin silhouette — barrel roll** — Default tucked body rotating down stairs. This is the signature animation — iterate until it looks like a real stair fall
3. **Thin silhouette — pencil roll variant** — Triggered by right arrow (speed boost). Tighter, faster rotation. Visually distinct from barrel roll at game speed
4. **Thin silhouette — spread/brake variant** — Triggered by left arrow (brake). Arms extend, body opens, drag increases. Visually distinct at game speed
5. **Fat silhouette — barrel roll** — Same animation as thin but with bulkier body (heavy pad loadout). Reads as "padded up" at a glance
6. **Fat silhouette — pencil roll variant** — Fat version of the speed boost animation
7. **Fat silhouette — spread/brake variant** — Fat version of the brake animation
8. **Jump animation** — Clear lift-off, airborne pose, crash-back-into-roll transition. Must maintain roll speed visually. Same for thin and fat
9. **Slide animation** — When momentum/energy is nearly gone, player transitions from roll to slide/skid
10. **Ragdoll animation** — When health drops below threshold: player goes limp, tumbles loosely down remaining stairs. Clearly different from the controlled roll. This is the "game over" animation
11. **Complete stop animation** — Player runs out of energy/momentum, comes to rest
12. **Thumbs-up animation** — Player sits up, faces camera, gives thumbs up regardless of outcome
13. **Injured idle variants** — Pre-roll idle animation degrades as health drops: confident bounce → stiff bounce → limping rock → barely standing

### Review Checkpoint 2

**What to evaluate:**
- Does the barrel roll look like a real stunt fall?
- Can you tell thin from fat silhouette mid-roll at game speed?
- Are the three roll variants (barrel, pencil, spread) visually distinct?
- Does the jump feel snappy and return to roll smoothly?
- Does the ragdoll look helpless and clearly different from a controlled roll?
- Do the injured idle variants communicate health state without checking the meter?
- Does the thumbs-up land emotionally — funny, charming, or both?

**Key question:** Does watching the character roll feel satisfying even before you care about the score?

---

## PHASE 3 — Camera Crash System

**Goal:** Build the five tiers of camera impact and the film crew characters. Crashes are purely negative — escalating tiers communicate how badly the player overshot and apply increasing score penalties.

### Build Steps

1. **Camera rig at level end** — Film camera on a tripod/dolly at the right edge of the level. On fixed-screen levels, this is the right edge of the screen. On scrolling levels, it's past the mark at the end of the geometry
2. **Camera operator** — Standing behind camera, identifiable pose, idle animation
3. **Focus puller** — Next to camera, hand on a dial, turning it (idle animation loop)
4. **Director** — Behind the crew, wearing a beret, holding a monitor, idle animation
5. **Crash Tier 1: Wobble** — Player barely passes the mark. Camera wobbles slightly. Crew doesn't react much. Minor score penalty
6. **Crash Tier 2: Lean-back** — Camera leans back noticeably, rocks back to upright. Crew flinches. Moderate score penalty
7. **Crash Tier 3: Topple** — Camera leans past tipping point and falls over. Crew scrambles. Significant score penalty
8. **Crash Tier 4: Full crash** — Player hits hard. Camera, tripod, everything goes down. Crew knocked back. Heavy score penalty
9. **Crash Tier 5: Bulldoze** — Player rolls straight through everything. Crew goes flying. Total destruction. Maximum score penalty
10. **Crash tier selection logic** — Map overshoot distance past camera position to crash tier thresholds. Fixed distance thresholds (not relative to level length)
11. **Crash health cost** — Each crash tier costs additional health on top of the normal level health cost. Higher tiers cost more. Tier 5 might end a run on its own
12. **Camera distance from mark** — The camera sits a fixed distance past the mark on every level. This keeps the overshoot-to-crash window consistent regardless of level length

### Review Checkpoint 3

**What to evaluate:**
- Are the five crash tiers visually distinct from each other?
- Does the escalation feel proportional — can you tell a Tier 2 from a Tier 4 at a glance?
- Can you identify the camera operator, focus puller, and director at game resolution?
- Does the crew feel alive (idle animations, reactions)?
- Is the fixed camera-to-mark distance producing fair crash thresholds across different levels?
- Do the crash health costs feel punishing enough to avoid, but not so brutal that one mistake ends every run?

**Key question:** Does crashing feel like a consequence the player learns to avoid, not a spectacle they seek out?

---

## PHASE 4 — Multiple Stair Levels & Scrolling

**Goal:** Add level variety through different stair angles, introduce the side-scrolling camera, and establish the level progression structure.

### Build Steps

1. **Level data format** — Define a level as: stair segments (each with angle and length), landing zone length, mark position, camera position (fixed distance past mark), and screen mode (fixed or scrolling)
2. **Standard stairs (35°)** — Realistic baseline angle. Balanced friction and energy drain. Already built in Phase 1
3. **Steep stairs (50°+)** — Low friction, slow energy drain. Player moves fast and arrives with energy to spare. Challenge is using LESS power to avoid overshooting. Levels designed so the correct low-power range exists
4. **Shallow stairs (20°)** — High friction, fast energy drain. Player can stall out. Need more initial power but not so much that they overshoot on the flat landing
5. **Fixed-screen levels** — Early levels. Entire staircase visible on one screen. Player can see the mark, camera, and full layout before and during the roll
6. **Side-scrolling levels** — Later levels. Staircase extends beyond one screen width. Camera follows the player horizontally (Mario-style). Mark and camera rig are visible only as the player approaches the end
7. **Level intro screen** — Shows the FULL level profile (zoomed out) before the player starts, even on scrolling levels. Player sees the complete stair layout, angles, mark position, and can plan their power
8. **Level progression** — Linear progression through levels. Each level unlocked by completing the previous one
9. **Scoring system** — Distance from mark (primary). Letter grade or star rating. Score feeds into currency for the pad store
10. **Level complete screen** — Score breakdown overlaid on the thumbs-up moment. Shows distance from mark, crash penalty (if any), health cost for the level, and remaining health

### Review Checkpoint 4

**What to evaluate:**
- Do the three angle ranges (20°, 35°, 50°+) feel genuinely different to play?
- Does steep feel like a restraint exercise (use LESS power) and shallow feel like a reach problem (use MORE power)?
- Does the side-scrolling camera feel smooth? Can the player track their position relative to the mark?
- Is the level intro preview useful for planning power on scrolling levels?
- Is the transition from fixed-screen to scrolling levels a noticeable difficulty bump?
- How many levels feel right for a first release?

**Key question:** Does changing the stair angle alone create enough variety, or do we need multi-segment stairs sooner?

---

## PHASE 5 — Injury System & Pad Store

**Goal:** Build the progression economy. Health persists across the run. Pads reduce damage and extend survival. The damage portrait is the post-level payoff screen.

### Build Steps

1. **Health cost per level** — Base cost for completing any level. Modified by: distance from mark (worse accuracy = more damage), crash tier (if applicable), stair angle (steeper = slightly more impact damage)
2. **Injury thresholds** — At 75% health: subtle limp in idle. At 50%: noticeable stiffness, slower idle bounce. At 25%: barely standing, holding side. Below ragdoll threshold: game over
3. **Ragdoll trigger** — If health drops below the threshold during a level, player ragdolls. Run ends. Return to title screen
4. **Store screen** — Accessible between levels. Grid of pad options with prices
5. **Currency** — Earned from level scores. Better scores = more money. Currency persists across the run but resets when the run ends
6. **Pad categories with stats:**
   - **Starter: Foam McDavid** — Cheap, minimal protection, no speed effect
   - **Mid-tier: D3O** — Better protection, slight bulk
   - **Hard shell** — Strong protection, slight speed penalty
   - **Joke: Newspaper & duct tape** — Cheap, minimal protection, funny visual
   - **Joke: Wig with hidden pads** — Cosmetic absurdity, minimal stats
7. **Thin/fat silhouette trigger** — Pad loadout determines which rolling silhouette is used. Light pads or no pads = thin. Heavy/stacked pads = fat. Binary switch, not gradual
8. **Pad stat effects** — Protection (reduces health cost per level), speed modifier (slight penalty for bulky pads), cost. Real trade-offs: heavy protection = slower = harder to reach mark on shallow stairs
9. **Post-level damage portrait** — After the thumbs-up, cut to a large character view facing camera. This is the "how'd you do" screen
10. **Damage portrait: Good run** — Minor scuff marks, pads in place, confident posture
11. **Damage portrait: Rough run** — Wardrobe torn, pads shifted (knee pad around ankle, elbow pad hanging off), visible scrapes, hunched posture
12. **Damage portrait: Disaster run** — Wardrobe shredded, pads missing or dangling, visible injuries, terrible posture (leaning on one leg, holding side). Still giving the thumbs up
13. **Damage tier logic** — Map level performance + crash tier to a damage tier that selects the portrait variant. Three tiers of damage portrait (good / rough / disaster)
14. **Score overlay on portrait** — The damage portrait is the background for the score breakdown. Player reads their score while looking at their beat-up character
15. **Health remaining callout** — Score screen prominently shows remaining health and how much this level cost. Creates tension: "I have 30% health left and 4 levels to go"

### Review Checkpoint 5

**What to evaluate:**
- Does the health system create run tension without feeling unfair?
- Is the ragdoll game-over devastating enough to make players careful but not so punishing they quit?
- Is the store fun to browse or does it feel like a gate?
- Does the thin/fat silhouette switch happen at the right pad threshold?
- Does the pad speed penalty create a real dilemma on shallow stairs?
- Does the damage portrait make you wince on a bad run?
- Does the "health remaining" callout create tension about the next level?
- Can a smart player survive significantly longer than a reckless one through pad choices?

**Key question:** Does the run structure (persistent health + pad economy + ragdoll game-over) make each level feel like it matters?

---

## PHASE 6 — Screen Flow & UX Sequencing

**Goal:** Lock in the full screen-to-screen experience. Every transition, every pause, every screen. Plan on iterating multiple times — pacing is everything.

### Build Steps

1. **Screen map** — Document every screen and transition: Title → Start Run → Level Intro (full preview) → Pre-Roll (idle bounce + power meter) → Gameplay (roll + energy/health meters) → Thumbs-Up (2 sec, unskippable) → Damage Portrait + Score (skippable after score displays) → Continue / Visit Store → next Level Intro
2. **Transition timing** — Thumbs-up: 2 seconds, unskippable. Damage portrait: 3–4 seconds or until tap (after score finishes displaying). Level intro: 2 seconds or until tap. Map every duration
3. **Store placement** — Appears after every level but is OPTIONAL to enter. "Continue" and "Visit Store" buttons on the score screen. Keeps flow fast for confident players but reminds injured players the store exists
4. **Retry flow** — Player wants to replay the same level. Quick retry from the score screen. Minimize friction
5. **Run start flow** — Title → "Start Run" → Level 1 intro. No level select during a run — levels are sequential
6. **Run end flow** — Ragdoll animation → "Run Over" screen showing: levels completed, total score, farthest level reached. "Try Again" returns to title
7. **First-time experience** — Brief animated demo of the power meter on the very first level (show the meter, highlight the tap zone, show a ghost roll). One time only, skippable
8. **Health warning** — When health drops below 30%, flash the health meter or show a warning on the level intro. Player knows they're in danger
9. **Flow iteration pass 1** — Play through 5 levels. Time everything. Note where it drags
10. **Flow iteration pass 2** — Adjust based on pass 1. Tighten or lengthen
11. **Flow iteration pass 3** — Final tuning for feel

### Review Checkpoint 6

**What to evaluate:**
- Does the run flow feel snappy or sluggish between levels?
- Is the thumbs-up → damage portrait → score → optional store sequence the right number of screens?
- Can the player get back into gameplay fast enough on retry?
- Does the optional store feel accessible without being intrusive?
- Does the run-end screen make you want to try again immediately?
- Is the first-time power meter tutorial clear without being condescending?
- Does the health warning create useful tension or just anxiety?

**Key question:** If you handed the phone to someone who's never seen the game, would they understand the flow without explanation?

---

## PHASE 7 — High Scores & Leaderboard

**Goal:** Add competitive context. Leaderboards compare players on the same levels with no loadout advantage — scores are purely about precision.

### Build Steps

1. **Player identity** — Username creation (or generated guest name). Avatar tied to character appearance
2. **Per-level leaderboard** — Each level has its own high score table. Top 25 displayed. Scores are distance-from-mark (lower is better), so pad loadout doesn't affect the leaderboard — only accuracy matters
3. **Run leaderboard** — Ranked by farthest level reached in a single run, with tiebreaker on total score. Measures endurance + consistency
4. **Score submission** — Scores post automatically. Anti-cheat: server-side sanity checks on submitted values (score can't be negative, distance must be within level bounds, etc.)
5. **Leaderboard screen** — Accessible from title screen and from the post-level score screen. Shows player's rank, nearby scores, and the top spots
6. **Post-level rank context** — After the damage portrait + score, show: "You placed #47 out of 1,203 on this level"
7. **Run rank context** — On the run-end screen: "This run reached level 12 — top 15% of all runs"
8. **Friend / rival system (stretch)** — Follow other players, see their scores highlighted on leaderboards
9. **Daily / weekly challenges (stretch)** — Featured level with a fresh leaderboard. Drives repeat play
10. **Backend infrastructure** — Score storage, retrieval, ranking. Must handle concurrent reads without lag

### Leaderboard Fairness Note

Scores are **distance from mark** — a pure accuracy metric. Pad loadout affects health and survival (how far you get in a run) but does not affect the per-level distance score. This means per-level leaderboards are fair regardless of loadout. The run leaderboard inherently favors smart pad choices, which is intentional — surviving longer IS the skill being measured there.

### Review Checkpoint 7

**What to evaluate:**
- Does seeing other players' scores motivate retries?
- Is the leaderboard integrated smoothly into the screen flow without adding clutter?
- Does the post-level rank feel rewarding or deflating?
- Are per-level scores meaningfully differentiated (can you tell a good run from a great one)?
- Does the run leaderboard feel like a fair measure of skill + strategy?

**Key question:** Does the leaderboard turn a single-player game into a competitive one, or does it feel bolted on?

---

## PHASE 8 — Mobile Controls & Platform Polish

**Goal:** Playable on phones and tablets. Polish input across all platforms.

### Build Steps

1. **Touch power meter** — Tap to set power. Large touch target. Same mechanic
2. **On-screen controls** — Left/right swipe or D-pad for speed control. Swipe up for jump. Controls must not cover the action
3. **Control sensitivity tuning** — Touch may need different sensitivity than keyboard for mid-roll controls
4. **Screen scaling** — Game must look right in landscape on phones, tablets, and desktop. Side-scrolling camera scales to viewport width
5. **Input feedback** — Visual flash on control use. Haptic feedback on tap (mobile)
6. **Pause** — Pause button (mobile), Escape key (desktop). Run state preserved

### Review Checkpoint 8

**What to evaluate:**
- Are touch controls as satisfying as keyboard?
- Is the power meter hittable on a small phone screen?
- Do mid-roll swipe controls work without covering the rolling character?
- Does the game look good in landscape on various screen sizes?
- Does the level intro preview read well on a small screen?

**Key question:** Would you play this on your phone during a commute?

---

## PHASE 9 — Advanced Levels & Obstacles

**Goal:** Expand level design beyond single-angle staircases. This is where the game gets deep.

### Build Steps

1. **Multi-segment stairs** — Stairs that change angle mid-descent (steep to shallow, shallow to steep). Energy and friction change at transition points
2. **Landings / flat sections** — Flat platforms mid-staircase. Maximum friction, fast energy drain. Player must have enough momentum to cross them
3. **90° turns** — Player navigates a turn while rolling. Auto-turn with timing window (tap at the right moment to maintain speed through the turn)
4. **Obstacles on stairs** — Film set items to jump over (apple boxes, sandbags, C-stands). Contact costs health and kills momentum
5. **Moving mark** — Landing mark shifts position on a timer. Player must time their arrival
6. **Multiple marks** — Hit mark A, then redirect to mark B (combo levels). Score is average distance across both marks
7. **Ramp / jump sections** — Ramps that launch the player airborne. Maintaining roll through the air. Longer air time = more style but harder to control landing

### Review Checkpoint 9

**What to evaluate:**
- Do multi-segment stairs create interesting power-meter decisions?
- Are flat landings a fun obstacle or just frustrating energy sinks?
- Are 90° turns fair with the timing window mechanic?
- Can the player see obstacles coming in time to jump?
- Does the moving mark add tension or just randomness?
- Is there a difficulty curve or does it spike?

**Key question:** Are these additions to the core loop (power meter → roll → hit the mark), or are they replacing it?

---

## PHASE 10 — Character Builder (Post-MVP)

**Goal:** Let the player create their stunt performer. Body type may affect physics.

### Build Steps

1. **Gender selection** — Male / female body types
2. **Height slider** — Affects proportions. Possibly affects physics (taller = more momentum?)
3. **Weight / body shape slider** — Changes silhouette. Heavier = more momentum, harder to stop. Gameplay-affecting choice, not just cosmetic
4. **Hair color picker**
5. **Ethnicity / skin tone picker**
6. **Saved character** — Persists across runs
7. **Thin/fat rolling silhouettes adapt** — Both silhouettes must work across all body configurations
8. **Damage portrait adapts** — Injuries, torn wardrobe, pad displacement must look correct across body types
9. **Leaderboard fairness consideration** — If weight affects physics, per-level leaderboards may need to account for body type, or weight should be cosmetic-only for competitive fairness

### Review Checkpoint 10

**What to evaluate:**
- Do all body types animate correctly through barrel roll, pencil roll, spread, and jump?
- Does weight actually affect gameplay? Is that fun or does it create a dominant meta?
- Does the character builder feel respectful and inclusive?
- Do the thin/fat rolling silhouettes work across all body types?
- Does the damage portrait look right across all body configurations?

---

## Scope Summary

| Phase | What You Get | Cumulative State |
|-------|-------------|-----------------|
| 1 | Core mechanic proof | Playable prototype, one level, both meters visible |
| 2 | Real character + two rolling silhouettes | Looks like a game |
| 3 | Camera crash system + crew | Stakes and consequences |
| 4 | Multiple stair angles + scrolling camera | Real level progression |
| 5 | Injury, pad store, damage portrait | Run economy + post-level payoff |
| 6 | Screen flow & UX polish | The game feels right between levels |
| 7 | High scores & leaderboard | Competitive context |
| 8 | Mobile + platform polish | Ship-ready on all platforms |
| 9 | Advanced levels & obstacles | Deep content |
| 10 | Character builder | Personalization (post-MVP) |

**MVP = Phases 1–7.** Complete run-based game with core loop, animation, camera crashes, level variety, store, polished flow, and leaderboards.

**The most important phase is Phase 1.** If the power meter → roll → land mechanic isn't fun with a circle and a line, no amount of animation or content will save it. Nail that first.
