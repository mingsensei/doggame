// ─── Movement ────────────────────────────────────────────────────────────────
export const WALK_SPEED = 3       // m/s
export const RUN_SPEED = 7        // m/s
export const ROTATION_LERP = 0.15 // per frame, 0–1
export const GRAVITY = -20        // m/s²

// ─── Camera ──────────────────────────────────────────────────────────────────
export const CAMERA_DEFAULT_OFFSET = [0, 2.5, 5] as const
export const CAMERA_LERP = 0.08
export const CAMERA_MIN_ZOOM = 2
export const CAMERA_MAX_ZOOM = 10
export const CAMERA_FOV_DEFAULT = 60
export const CAMERA_FOV_RUN = 65
export const CAMERA_FOV_LERP = 0.05
export const CAMERA_MIN_ELEVATION = 10  // degrees
export const CAMERA_MAX_ELEVATION = 70  // degrees

// ─── Interaction ─────────────────────────────────────────────────────────────
export const INTERACTION_RADIUS = 1.5  // m

// ─── Animation crossfades ────────────────────────────────────────────────────
export const CROSSFADE_IDLE_TO_WALK = 0.2
export const CROSSFADE_WALK_TO_RUN = 0.15
export const CROSSFADE_TO_IDLE = 0.3
export const CROSSFADE_BARK = 0.15
export const CROSSFADE_PEE = 0.2

// ─── Dog behaviour ───────────────────────────────────────────────────────────
export const IDLE_SNIFF_DELAY = 5000   // ms before random idle variant
export const IDLE_SNIFF_CHANCE = 0.3   // 30% chance per check
export const BARK_DURATION = 1200      // ms
export const PEE_DURATION = 2500       // ms
export const SNIFF_DURATION = 2000     // ms

// ─── Audio ───────────────────────────────────────────────────────────────────
export const FOOTSTEP_WALK_INTERVAL = 500  // ms between steps
export const FOOTSTEP_RUN_INTERVAL = 270   // ms between steps

// ─── Performance ─────────────────────────────────────────────────────────────
export const SHADOW_MAP_SIZE = 1024
export const LOD_FULL_DETAIL = 15    // m
export const LOD_HALF_DETAIL = 40    // m

// ─── World generation ────────────────────────────────────────────────────────
export const WORLD_SIZE = 80          // half-extent, world is WORLD_SIZE*2 square
export const TREE_COUNT = 40
export const ROCK_COUNT = 30
export const BUSH_COUNT = 25
