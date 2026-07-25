/**
 * /v2 — "Enter the M" scroll choreography.
 *
 * One module owns all motion on the /v2 route. The page is SSR-complete
 * and readable without JS (static stacked scenes); this module upgrades
 * it into a pinned, scrubbed film by adding `.v2-live` and building one
 * GSAP timeline per scene inside a gsap.context (reverted on teardown).
 *
 * - Scrubbed timelines animate transforms/opacity/clip-path only.
 * - Everything is built after document.fonts.ready so measurements
 *   (letter positions, glyph boxes) are final.
 * - Breakpoints rebuild via gsap.matchMedia; prefers-reduced-motion
 *   never enters live mode at all.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const ROOT_SEL = "[data-v2]";
const VW = () => window.innerWidth;
const VH = () => window.innerHeight;

const q = <T extends HTMLElement = HTMLElement>(
	sel: string,
	within: ParentNode = document,
): T | null => within.querySelector<T>(sel);
const qa = <T extends HTMLElement = HTMLElement>(
	sel: string,
	within: ParentNode = document,
): T[] => Array.from(within.querySelectorAll<T>(sel));

let ctx: gsap.Context | null = null;

function teardown() {
	ctx?.revert();
	ctx = null;
	document.documentElement.classList.remove("v2-live", "v2-loading");
}

/* ------------------------------------------------------------------ */
/* Pinned scene helper — one scrubbed timeline per scene               */
/* ------------------------------------------------------------------ */

function pin(
	scene: HTMLElement,
	endPct: number,
	id: string,
	build: (tl: gsap.core.Timeline) => void,
) {
	const tl = gsap.timeline({
		defaults: { ease: "none" },
		scrollTrigger: {
			trigger: scene,
			start: "top top",
			end: `+=${endPct}%`,
			scrub: 1,
			pin: true,
			anticipatePin: 1,
			id,
			invalidateOnRefresh: true,
		},
	});
	build(tl);
	return tl;
}

/* ------------------------------------------------------------------ */
/* 00/01 — Hero: MALIN → the M becomes a portal                        */
/* ------------------------------------------------------------------ */

function buildHero(root: HTMLElement) {
	const scene = q("[data-v2-hero]", root);
	if (!scene) return;
	const m = q("[data-v2-hero-m]", scene)!;
	const alin = q("[data-v2-alin]", scene)!;
	const dhamsara = q("[data-v2-dhamsara]", scene)!;
	const metaIns = qa(".hero-meta-item .rev-in", scene);
	const tagline = q("[data-v2-tagline]", scene)!;
	const cue = q("[data-v2-scrollcue]", scene)!;
	const portal = q("[data-v2-portal]", scene)!;
	const inner = q("[data-v2-portal-inner]", scene)!;
	const gridScales = qa(".p-grid-scale", scene);

	/* Measure the letterform M so the logomark portal can take over at
	 * the exact same screen position and zoom rate. */
	const sceneR = scene.getBoundingClientRect();
	const mr = m.getBoundingClientRect();
	const mCx = mr.left - sceneR.left + mr.width / 2;
	const mCy = mr.top - sceneR.top + mr.height / 2;
	/* Span height is the 0.82em line box; the M cap height is ~0.72em. */
	const capH = mr.height * (0.72 / 0.82);
	const s0 = capH / 723; // logomark scale matching the letter at rest

	/* The channel point (590,361) is the transform origin, so anchoring
	 * it on the letter's center keeps every later scale centered there. */
	gsap.set(inner, {
		x: mCx - 590,
		y: mCy - 361,
		scale: s0,
		transformOrigin: "590px 361px",
	});
	gsap.set(gridScales, { scale: 1 / s0, transformOrigin: "590px 361px" });
	gsap.set(portal, { autoAlpha: 0 });
	gsap.set(m, { transformOrigin: "50% 50%" });
	gsap.set(metaIns, { yPercent: 110 });

	const ZOOM = 3.4; // letter scale at the portal swap
	const SWAP_T = 70; // timeline position of the swap (%)
	const ZOOM_START = 35;
	const ZOOM_DUR = 45;
	// Letter scale at SWAP_T on its linear ramp (matches portal catch-up).
	const sAtSwap = 1 + (ZOOM - 1) * ((SWAP_T - ZOOM_START) / ZOOM_DUR);
	// Final pass-through scale: the channel (~156 viewBox units wide)
	// grows well past the viewport so the strokes sweep out of frame.
	const sPass = () => (Math.max(VW(), VH() * 1.5) / 156) * 2.2;

	pin(scene, 150, "v2-hero", (tl) => {
		// Metadata enters through clipped reveals
		tl.to(metaIns, { yPercent: 0, duration: 12, stagger: 3 }, 2);
		tl.to([tagline, cue], { autoAlpha: 0, y: -14, duration: 12 }, 10);
		// "ALIN" tracks beyond the viewport while the M remains
		tl.to(alin, { x: () => VW() * 1.15, duration: 40 }, 15);
		tl.to(dhamsara, { autoAlpha: 0, y: () => VH() * 0.04, duration: 16 }, 30);
		// The M scales toward the camera
		tl.to(m, { scale: ZOOM, duration: ZOOM_DUR }, ZOOM_START);
		tl.to(metaIns, { autoAlpha: 0, duration: 10 }, 55);
		// The letterform resolves into the logomark mask
		tl.to(portal, { autoAlpha: 1, duration: 5 }, SWAP_T);
		tl.to(m, { autoAlpha: 0, duration: 6 }, SWAP_T + 4);
		tl.fromTo(
			inner,
			{ scale: s0 * sAtSwap },
			{ scale: s0 * ZOOM, duration: 10 },
			SWAP_T,
		);
		// The camera passes between the strokes
		tl.to(inner, { scale: sPass, duration: 20, ease: "power1.in" }, 80);
		// Counter-scale the hairline grid so its lines stay ~1px on screen
		tl.fromTo(
			gridScales,
			{ scale: 1 / (s0 * sAtSwap) },
			{ scale: 1 / (s0 * ZOOM), duration: 10 },
			SWAP_T,
		);
		tl.to(gridScales, { scale: () => 1 / sPass(), duration: 20, ease: "power1.in" }, 80);
		tl.to(portal, { autoAlpha: 0, duration: 4 }, 96);
	});
}

/* ------------------------------------------------------------------ */
/* 02 — Inside the M: sheared planes, measurement rules, the stack     */
/* ------------------------------------------------------------------ */

function buildInside(root: HTMLElement) {
	const scene = q("[data-v2-inside]", root);
	if (!scene) return;
	const planes = qa(".plane", scene);
	const mfrag = q("[data-v2-mfrag]", scene);
	const measures = qa(".measure", scene);
	const measureLines = qa(".measure-line", scene);
	const measureLabels = qa(".measure-label", scene);
	const kicker = q("[data-v2-inside-kicker]", scene)!;
	const stack = q(".inside-stack", scene)!;
	const stackIns = qa("[data-v2-stack-line] .rev-in", scene);
	const core = q("[data-v2-core-bar]", scene)!;

	gsap.set(core, { xPercent: -50, yPercent: -50 });
	gsap.set(stackIns, { yPercent: 105 });
	gsap.set(measureLines, { scaleX: 0 });
	gsap.set(measureLabels, { autoAlpha: 0 });
	gsap.set(kicker, { autoAlpha: 0, y: 10 });

	pin(scene, 140, "v2-inside", (tl) => {
		// Planes drift at controlled depths
		const depths = [16, 26, 12, 22, 30];
		planes.forEach((p, i) => {
			const d = depths[i % depths.length];
			tl.fromTo(p, { yPercent: d }, { yPercent: -d, duration: 100 }, 0);
		});
		if (mfrag) tl.fromTo(mfrag, { yPercent: 4 }, { yPercent: -10, duration: 100 }, 0);
		tl.to(kicker, { autoAlpha: 1, y: 0, duration: 12 }, 4);
		tl.to(measureLines, { scaleX: 1, duration: 28, stagger: 6 }, 10);
		tl.to(measureLabels, { autoAlpha: 1, duration: 14, stagger: 6 }, 16);
		// The discipline stack assembles line by line
		stackIns.forEach((el, i) => {
			tl.fromTo(
				el,
				{ yPercent: 105, xPercent: i % 2 ? 4 : -4 },
				{ yPercent: 0, xPercent: 0, duration: 20 },
				14 + i * 12,
			);
		});
		// The stack recedes; the core stroke takes over
		tl.to(stack, { opacity: 0.22, duration: 18 }, 80);
		tl.to(measures, { autoAlpha: 0, duration: 12 }, 82);
		tl.to(core, { autoAlpha: 1, duration: 6 }, 80);
		// … un-shears, flattens into a hairline, extends across the frame
		tl.to(core, { skewX: 0, duration: 8 }, 82);
		tl.to(core, { scaleY: 0.002, y: () => VH() * 0.22, duration: 10 }, 90);
		tl.to(core, { scaleX: 7.4, duration: 6 }, 96);
	});
}

/* ------------------------------------------------------------------ */
/* 03 — Three disciplines: 0 → 01 → 02 → 03, then the 3 floods paper   */
/* ------------------------------------------------------------------ */

function buildDisc(root: HTMLElement, isMobile: boolean) {
	const scene = q("[data-v2-disc]", root);
	if (!scene) return;
	const kicker = q("[data-v2-disc-kicker]", scene)!;
	const zero = q("[data-v2-disc-zero]", scene)!;
	const units = qa("[data-v2-disc-unit]", scene);
	const panels = qa("[data-v2-disc-panel]", scene);
	const three = q("[data-v2-three-reveal]", scene)!;
	const threeSpan = q("span", three)!;

	// Panels/spans carry CSS centering transforms — clear the baked px
	// translation before re-applying it as GSAP xPercent/yPercent.
	gsap.set([zero, ...units], { x: 0, y: 0, xPercent: -50, yPercent: -50 });
	gsap.set(panels, { x: 0, y: 26, xPercent: -50, autoAlpha: 0 });
	gsap.set(zero, { zIndex: 3 });
	gsap.set(threeSpan, { x: 0, y: 0, xPercent: -50, yPercent: -50 });
	gsap.set(three, { autoAlpha: 0 });

	// Paper flood scale for the giant "3" (glyph must cover the viewport).
	const spanR = threeSpan.getBoundingClientRect();
	const flood = () =>
		Math.max(VW() / Math.max(1, spanR.width), VH() / Math.max(1, spanR.height)) * 2.4;

	pin(scene, isMobile ? 200 : 220, "v2-work", (tl) => {
		// Unit digits enter at ~10/40/64, exit ~28 timeline units later.
		const enters = [10, 40, 64];

		if (isMobile) {
			// Vertical accumulation: units rise from below, exit above.
			units.forEach((u) => gsap.set(u, { y: VH() * 0.9, scale: 0.85 }));
			tl.to(zero, { scale: 0.45, y: () => -VH() * 0.28, duration: 15 }, 10);
			units.forEach((u, i) => {
				tl.to(u, { y: 0, duration: 12 }, enters[i]);
				if (i < 2) tl.to(u, { y: () => -VH() * 0.9, duration: 10 }, enters[i] + 28);
				else tl.to(u, { autoAlpha: 0, duration: 2 }, 84);
			});
		} else {
			// Horizontal sequence: units pan through the slot beside the 0.
			units.forEach((u) => gsap.set(u, { x: VW() * 1.1 }));
			tl.to(zero, { scale: 0.62, x: () => -VW() * 0.1, duration: 15 }, 10);
			units.forEach((u, i) => {
				tl.to(u, { x: 0, duration: 12 }, enters[i]);
				if (i < 2) tl.to(u, { x: () => -VW() * 1.1, duration: 10 }, enters[i] + 28);
				else tl.to(u, { autoAlpha: 0, duration: 2 }, 84);
			});
		}

		panels.forEach((p, i) => {
			const enter = enters[i] + 8;
			tl.to(p, { autoAlpha: 1, y: 0, duration: 8 }, enter);
			tl.to(p, { autoAlpha: 0, y: -18, duration: 6 }, i < 2 ? enter + 24 : 86);
		});

		// The final 3 enlarges into a paper mask, flooding the ink away
		tl.to([zero, kicker], { autoAlpha: 0, duration: 6 }, 86);
		tl.to(three, { autoAlpha: 1, duration: 3 }, 84);
		tl.fromTo(threeSpan, { scale: 1 }, { scale: flood, duration: 13, ease: "power1.in" }, 84);
		// 97–100: hold on paper; scene 04 rises seamlessly.
	});
}

/* ------------------------------------------------------------------ */
/* 04 — Practice: MAKE → OWN → MEASURE typographic transformations     */
/* ------------------------------------------------------------------ */

function buildPractice(root: HTMLElement) {
	const scene = q("[data-v2-practice]", root);
	if (!scene) return;
	const beats = {
		make: q('[data-v2-beat="make"]', scene)!,
		own: q('[data-v2-beat="own"]', scene)!,
		measure: q('[data-v2-beat="measure"]', scene)!,
	};
	const kick = (b: HTMLElement) => q(".beat-kick", b)!;
	const copy = (b: HTMLElement) => q(".beat-copy", b)!;
	const wordMake = q("[data-v2-make]", scene)!;
	const wordOwn = q("[data-v2-own]", scene)!;
	const wordMeasure = q("[data-v2-measure]", scene)!;
	const makeLetters = qa(".w-l", wordMake);
	const measureIns = qa(".rev-in", wordMeasure);
	const cols = qa(".col", scene);
	const mplanes = qa(".mplane", scene);
	const flash = q("[data-v2-flash]", scene)!;

	gsap.set([wordMake, wordOwn, wordMeasure], { xPercent: -50, yPercent: -50 });
	gsap.set(wordOwn, { autoAlpha: 0, y: 18 });
	gsap.set([kick(beats.own), copy(beats.own), kick(beats.measure), copy(beats.measure)], {
		autoAlpha: 0,
	});
	gsap.set(measureIns, { yPercent: 106 });
	gsap.set(cols, { left: 0 });

	/* Measure MAKE's letter centers — the word collapses into hairline
	 * columns at exactly these positions (edges + centers = 6 columns). */
	const sceneR = scene.getBoundingClientRect();
	const makeR = wordMake.getBoundingClientRect();
	const colMakeX = [
		makeR.left - sceneR.left,
		...makeLetters.map((l) => {
			const r = l.getBoundingClientRect();
			return r.left - sceneR.left + r.width / 2;
		}),
		makeR.right - sceneR.left,
	];

	/* OWN's negative space: gaps before/between/after its letters. */
	const ownLetters = qa(".w-l", wordOwn);
	const ownRects = ownLetters.map((l) => l.getBoundingClientRect());
	const gapXs: number[] = [];
	if (ownRects.length) {
		gapXs.push(ownRects[0].left - sceneR.left - ownRects[0].width * 0.55);
		for (let i = 0; i < ownRects.length - 1; i++) {
			gapXs.push((ownRects[i].right + ownRects[i + 1].left) / 2 - sceneR.left);
		}
		const last = ownRects[ownRects.length - 1];
		gapXs.push(last.right - sceneR.left + last.width * 0.55);
	}
	const colOwnX =
		gapXs.length >= 2
			? [gapXs[0] - VW() * 0.06, ...gapXs, gapXs[gapXs.length - 1] + VW() * 0.06]
			: colMakeX.slice();

	// Plane rects mirror the .mplane CSS (left 21 / 43.5 / 66vw).
	const planeLeftX = [0.21, 0.435, 0.66].map((v) => v * VW());
	const colPlane = [0, 0, 1, 1, 2, 2]; // column → plane grouping

	pin(scene, 260, "v2-practice", (tl) => {
		// MAKE expands its letter widths
		tl.to(wordMake, { scaleX: 1.1, duration: 20 }, 1);
		// Hard ink flash marks the beat
		tl.to(flash, { autoAlpha: 1, duration: 0.8 }, 21);
		tl.to(flash, { autoAlpha: 0, duration: 1.8 }, 22);
		// Letters collapse into hairlines; columns continue them
		tl.to(makeLetters, { scaleX: 0.02, duration: 10, stagger: 1.2 }, 24);
		cols.forEach((c, i) => {
			gsap.set(c, { x: colMakeX[i] ?? 0 });
			tl.to(c, { opacity: 1, duration: 6 }, 30 + i * 0.8);
		});
		tl.to(wordMake, { autoAlpha: 0, duration: 4 }, 36);
		tl.to([kick(beats.make), copy(beats.make)], { autoAlpha: 0, duration: 5 }, 37);
		// The columns become OWN's negative space
		cols.forEach((c, i) => {
			tl.to(c, { x: colOwnX[i] ?? 0, duration: 10, ease: "power1.inOut" }, 39);
		});
		tl.to(wordOwn, { autoAlpha: 1, y: 0, duration: 8 }, 43);
		tl.to([kick(beats.own), copy(beats.own)], { autoAlpha: 1, duration: 6 }, 45);
		tl.to(flash, { autoAlpha: 1, duration: 0.8 }, 51);
		tl.to(flash, { autoAlpha: 0, duration: 1.8 }, 52);
		tl.to(wordOwn, { autoAlpha: 0, y: -16, duration: 7 }, 54);
		tl.to([kick(beats.own), copy(beats.own)], { autoAlpha: 0, duration: 5 }, 55);
		// Columns shear and widen into the logo's parallelogram planes
		cols.forEach((c, i) => {
			tl.to(
				c,
				{
					x: planeLeftX[colPlane[i]],
					scaleX: VW() * 0.13,
					scaleY: 72 / 58,
					y: VH() * 0.02,
					skewX: -30,
					duration: 12,
					ease: "power1.inOut",
				},
				56,
			);
		});
		tl.to(cols, { opacity: 0, duration: 3 }, 69);
		tl.to(mplanes, { opacity: 1, duration: 3 }, 69.5);
		// MEASURE types in as the planes sink into a plinth beneath the
		// word — keeps the letters clear of the solid core plane.
		tl.to(measureIns, { yPercent: 0, duration: 10, stagger: 1.6 }, 72);
		tl.to(mplanes, { y: () => VH() * 0.42, duration: 14, ease: "power1.inOut" }, 72);
		tl.to([kick(beats.measure), copy(beats.measure)], { autoAlpha: 1, duration: 6 }, 76);
		// Settle
		tl.to(wordMeasure, { scale: 1.02, duration: 14 }, 86);
	});
}

/* ------------------------------------------------------------------ */
/* 05 — M index: spec rows pass the vertex and invert                  */
/* ------------------------------------------------------------------ */

function buildIndex(root: HTMLElement) {
	const scene = q("[data-v2-index]", root);
	if (!scene) return;
	const m = q("[data-v2-index-m]", scene)!;
	const rows = q("[data-v2-index-rows]", scene)!;
	const rowEls = qa("[data-v2-index-row]", scene);
	const inverts = qa(".row-invert", rows);
	const baseline = q("[data-v2-index-baseline]", scene)!;
	if (!rowEls.length) return;

	const H = VH();
	const sceneR = scene.getBoundingClientRect();
	gsap.set(m, { yPercent: -50, scale: 1.03, transformOrigin: "50% 50%" });

	/* The M's central vertex — measured, so the mobile layout (M higher)
	 * stays exact. Timeline units are pixels: 1 unit scrolled = 1px. */
	const mR = m.getBoundingClientRect();
	const vertexY = mR.top - sceneR.top + mR.height / 2;
	const rowH = rowEls[0].getBoundingClientRect().height;
	const n = rowEls.length;
	const rowsH = rowH * n;
	const startY = vertexY - rowH / 2;
	const travel = rowH * (n - 1);
	const tail = H * 0.45;

	gsap.set(rows, { y: startY });
	gsap.set(inverts, { clipPath: "inset(0% 100% 0% 0%)" });

	pin(scene, 180, "v2-index", (tl) => {
		tl.to(m, { scale: 1, duration: travel + tail }, 0);
		tl.to(rows, { y: startY - travel, duration: travel }, 0);

		// Each row inverts (paper↔ink block wipe) as it crosses the vertex.
		rowEls.forEach((_, i) => {
			const inv = inverts[i];
			const center = i * rowH;
			const w = rowH * 0.32;
			tl.to(inv, { clipPath: "inset(0% 0% 0% 0%)", duration: w }, Math.max(0, center - rowH * 0.16));
			// The last row stays inverted — it compresses into the hairline.
			if (i < n - 1) {
				tl.to(inv, { clipPath: "inset(0% 0% 0% 100%)", duration: w }, center + rowH * 0.5);
			}
		});

		// All rows compress into one hairline at the vertex.
		const yAtCompress = startY - travel;
		const originPct = ((vertexY - yAtCompress) / rowsH) * 100;
		tl.set(rows, { transformOrigin: `50% ${originPct}%` }, travel);
		tl.to(rows, { scaleY: 0.015, autoAlpha: 0, duration: tail * 0.7, ease: "power1.in" }, travel + tail * 0.1);
		tl.to(baseline, { scaleX: 1, duration: tail * 0.55 }, travel + tail * 0.3);
	});
}

/* ------------------------------------------------------------------ */
/* 06 — Climax: inside the counter → statement → the name              */
/* ------------------------------------------------------------------ */

function buildClimax(root: HTMLElement, isMobile: boolean) {
	const scene = q("[data-v2-climax]", root);
	if (!scene) return;
	const baseline = q("[data-v2-climax-baseline]", scene)!;
	const m = q("[data-v2-climax-m]", scene)!;
	const lock = q("[data-v2-climax-lock]", scene)!;
	const grid = qa(".cg", scene);
	const words = q("[data-v2-climax-words]", scene)!;
	const aside = q("[data-v2-climax-aside]", scene)!;
	const name = q("[data-v2-climax-name]", scene)!;

	gsap.set(m, { x: 0, y: 0, xPercent: -50, yPercent: -50, scale: isMobile ? 4.6 : 6 });
	gsap.set(words, { scale: 2.4 });
	gsap.set(name, { x: 0, y: 0, xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 1.3 });
	gsap.set(lock, { transformOrigin: "50% 50%" });
	gsap.set(aside, { y: 12 });

	pin(scene, 210, "v2-climax", (tl) => {
		// Scene 05's compressed hairline rests here, then dissolves
		tl.to(baseline, { autoAlpha: 0, duration: 5 }, 0);
		// The camera pulls out of the M's counter until the statement reads
		tl.to(m, { scale: 1.06, duration: 55 }, 0);
		tl.to(words, { scale: 1, duration: 55 }, 0);
		// The M becomes background texture; the words lock to a strict grid
		tl.to(m, { autoAlpha: 0.16, duration: 15 }, 55);
		tl.to(grid, { scaleX: 1, duration: 10, stagger: 2.5 }, 56);
		tl.to(aside, { autoAlpha: 1, y: 0, duration: 8 }, 66);
		// Everything compresses into MALIN DHAMSARA
		tl.to(lock, { scaleY: 0.012, autoAlpha: 0, duration: 10, ease: "power1.in" }, 78);
		tl.to(aside, { autoAlpha: 0, duration: 5 }, 78);
		tl.to(m, { autoAlpha: 0, duration: 8 }, 80);
		tl.to(name, { autoAlpha: 1, scale: 1, duration: 10, ease: "power1.out" }, 86);
		// 96–100: hold — ink field + the name, then scene 07 cuts to paper.
	});
}

/* ------------------------------------------------------------------ */
/* 07 — Final CTA: quiet settle (no pin)                               */
/* ------------------------------------------------------------------ */

function buildFinal(root: HTMLElement) {
	const scene = q("[data-v2-final]", root);
	if (!scene) return;
	const items = qa(
		".final-name, .final-status, .final-about, .final-cta-row, .final-links, .final-tech",
		scene,
	);
	gsap.set(items, { autoAlpha: 0, y: 16 });
	ScrollTrigger.create({
		trigger: scene,
		start: "top 72%",
		once: true,
		onEnter: () =>
			gsap.to(items, {
				autoAlpha: 1,
				y: 0,
				duration: 0.9,
				ease: "power2.out",
				stagger: 0.08,
			}),
	});
}

/* ------------------------------------------------------------------ */
/* Chrome: nav theme swaps, progress rail, smooth anchors              */
/* ------------------------------------------------------------------ */

function buildChrome(root: HTMLElement) {
	const nav = q("[data-v2-nav]");
	if (!nav) return null;
	const progress = q("[data-v2-progress]", nav);

	gsap.set(nav, { autoAlpha: 0, y: -6 });

	if (progress) {
		gsap.to(progress, {
			scaleX: 1,
			ease: "none",
			scrollTrigger: {
				trigger: document.body,
				start: "top top",
				end: "bottom bottom",
				scrub: 0.4,
			},
		});
	}

	// Hard theme swap per scene (no blend).
	qa(".v2-scene", root).forEach((scene) => {
		const theme = scene.classList.contains("scene-ink") ? "ink" : "paper";
		ScrollTrigger.create({
			trigger: scene,
			start: "top 78%",
			end: "bottom 22%",
			onEnter: () => nav.setAttribute("data-theme", theme),
			onEnterBack: () => nav.setAttribute("data-theme", theme),
		});
	});

	// Anchor links scroll to their scene's pin start.
	const pinIds: Record<string, string> = {
		"v2-practice": "v2-practice",
		"v2-work": "v2-work",
		"v2-index": "v2-index",
	};
	qa("[data-v2-anchor]").forEach((a) => {
		a.addEventListener("click", (e) => {
			e.preventDefault();
			const id = a.getAttribute("data-v2-anchor")!;
			const st = pinIds[id] ? ScrollTrigger.getById(pinIds[id]) : undefined;
			const target = st ? st.start + 2 : { y: `#${id}` };
			gsap.to(window, {
				duration: 1.3,
				ease: "power2.inOut",
				scrollTo: { ...(typeof target === "number" ? { y: target } : target), autoKill: true },
			});
		});
	});

	return nav;
}

/* ------------------------------------------------------------------ */
/* 00 — Loader: calibration ≤1.5s, hands the frame to the hero         */
/* ------------------------------------------------------------------ */

function runLoader(nav: HTMLElement | null) {
	const html = document.documentElement;
	const loader = q("[data-v2-loader]");
	if (!loader) return;

	if (!html.classList.contains("v2-loading")) {
		// Loader never engaged (or safety timer fired) — just show the nav.
		if (nav) gsap.set(nav, { autoAlpha: 1, y: 0 });
		return;
	}

	const num = q("[data-v2-loader-num]", loader)!;
	const ruleFill = q("[data-v2-loader-rule]", loader)!;
	const rule = q(".v2-loader-rule", loader)!;
	const nameEl = q(".v2-loader-name", loader)!;
	const pct = q(".v2-loader-pct", loader)!;
	const mark = q(".v2-loader-m", loader)!;

	const counter = { v: 0 };
	const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
	const ruleR = rule.getBoundingClientRect();

	const tl = gsap.timeline({
		onComplete: () => {
			html.classList.remove("v2-loading");
			gsap.set(loader, { display: "none" });
			/* The scroll lock hid the vertical scrollbar during setup, so
			 * pins were measured 15px too wide — re-measure now. */
			ScrollTrigger.refresh();
		},
	});

	tl.to(
		counter,
		{
			v: 100,
			duration: 0.85,
			ease: "power1.inOut",
			onUpdate: () => {
				num.textContent = String(Math.round(counter.v)).padStart(3, "0");
			},
		},
		0,
	);
	tl.to(ruleFill, { scaleX: 1, duration: 0.85, ease: "none" }, 0);
	// The calibration rule slides into the nav's hairline rail.
	tl.to(
		rule,
		{
			x: -ruleR.left,
			y: navBottom - ruleR.top,
			scaleX: VW() / Math.max(1, ruleR.width),
			transformOrigin: "left top",
			duration: 0.4,
			ease: "power2.inOut",
		},
		0.88,
	);
	tl.to([nameEl, pct], { autoAlpha: 0, duration: 0.22 }, 0.88);
	// The loader's M scales into the hero composition.
	tl.to(mark, { scale: 2.3, autoAlpha: 0, duration: 0.38, ease: "power2.in" }, 0.88);
	tl.to(loader, { autoAlpha: 0, duration: 0.28 }, 1.06);
	if (nav) tl.to(nav, { autoAlpha: 1, y: 0, duration: 0.36, ease: "power2.out" }, 1.14);
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

async function boot() {
	const root = q(ROOT_SEL);
	if (!root) return;

	// Reduced motion: the route stays a clean static composition.
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		document.documentElement.classList.remove("v2-loading");
		return;
	}

	// Cancel the shell's loader safety timer — we're in charge now.
	const safety = (window as unknown as { __v2loaderTimer?: number }).__v2loaderTimer;
	if (safety) window.clearTimeout(safety);

	await document.fonts.ready;

	// Upgrade scenes into film stages, then measure and build.
	document.documentElement.classList.add("v2-live");

	let nav: HTMLElement | null = null;
	ctx = gsap.context(() => {
		const mm = gsap.matchMedia();
		mm.add(
			{ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" },
			(context) => {
				const isMobile = Boolean(context.conditions?.mobile);
				buildHero(root);
				buildInside(root);
				buildDisc(root, isMobile);
				buildPractice(root);
				buildIndex(root);
				buildClimax(root, isMobile);
				buildFinal(root);
				nav = buildChrome(root);
			},
		);
	}, root);

	ScrollTrigger.refresh();
	ctx.add(() => runLoader(nav));
}

window.addEventListener("pagehide", teardown);
document.addEventListener("astro:before-swap", teardown);

boot();
