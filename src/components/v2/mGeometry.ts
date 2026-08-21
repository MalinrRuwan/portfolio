/**
 * Geometry of the M monogram (mirrors src/components/SiteLogo.astro).
 * The mark is three sheared parallelogram strokes — wing / core / wing —
 * leaning forward at ~30° from vertical. All v2 portal geometry derives
 * from these constants.
 */

export const M_VIEWBOX = "0 0 1516 723";
export const M_WIDTH = 1516;
export const M_HEIGHT = 723;

export const M_PATH_WING_L =
  "M6.92729 718L419.036 4H717.927L305.819 718H6.92729Z";
export const M_PATH_WING_R =
  "M1171.04 716.496C1553.04 716.496 1693.04 4 1168.04 4L755.927 718L1171.04 716.496Z";
export const M_PATH_CORE =
  "M461.927 718H760.819L1172.93 4H874.035L461.927 718Z";

/**
 * Center of the channel between the left wing and the core stroke, in
 * viewBox units — the point the camera passes through in scene 01.
 * Wing1 right edge: x 305.8 (bottom) → 717.9 (top)
 * Core  left edge:  x 461.9 (bottom) → 874.0 (top)
 */
export const M_CHANNEL = { x: 590, y: 361 };

/** CSS skewX angle matching the logo's forward italic lean. */
export const M_SKEW = -30;
