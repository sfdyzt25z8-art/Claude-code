/**
 * The shared simulation code (physics, AI, track geometry) operates in the
 * same "pixel-scale" world units the 2D view always has (track widths ~200,
 * car radius ~20, etc) — deliberately unchanged so it can be reused as-is for
 * 3D. `CarMesh3D`/`TrackMesh3D`, however, are built in realistic meter-scale
 * units (a ~4.2 unit long car) so lighting, camera distances, and geometry
 * detail all behave like a normal Three.js scene. This is the single
 * conversion factor between the two: multiply a simulation-space value by
 * `WORLD_SCALE` to get Three.js world units.
 */
export const WORLD_SCALE = 0.05;
