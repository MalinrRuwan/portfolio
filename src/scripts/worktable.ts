/**
 * /worktable — launch-film scroll choreography.
 *
 * The film lives in a tall "runway" section with a viewport-sized sticky
 * stage. Scrubbing the runway expands the 16:9 frame until it fills the
 * screen, holds it there, then returns it to its box so the download section
 * can scroll in behind it. Autoplay is driven by an IntersectionObserver so
 * the video only plays while it is actually on screen.
 *
 * Boots on first parse and on Astro's page-load event (the shared
 * ClientRouter can arrive from other routes); reverts before a swap.
 * prefers-reduced-motion never enters the cinematic at all.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ROOT_SEL = "[data-wt-film]";

let ctx: gsap.Context | null = null;
let cleanups: Array<() => void> = [];

interface FilmParts {
	section: HTMLElement;
	stage: HTMLElement;
	frame: HTMLElement;
	video: HTMLVideoElement | null;
}

function build({ section, stage, frame, video }: FilmParts) {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		// Static composition: let the native controls drive the film.
		if (video) video.controls = true;
		return;
	}

	// Gives the runway its scroll distance (see worktable.astro styles).
	document.documentElement.classList.add("wt-film-live");

	// Matches the frame's CSS: min(72rem, 100vw - 3rem), 16:9, rounded-lg.
	const boxed = () => {
		const width = Math.min(72 * 16, stage.clientWidth - 48);
		return {
			width,
			height: (width * 9) / 16,
			borderRadius: 12,
		};
	};
	const full = () => ({
		width: stage.clientWidth,
		height: stage.clientHeight,
		borderRadius: 0,
	});
	// The boxed frame rests a touch above the viewport centre and settles to
	// the exact centre as it expands, so the full-screen phase stays true.
	const restY = () => -Math.round(stage.clientHeight * 0.05);

	ctx = gsap.context(() => {
		gsap.set(frame, {
			width: () => boxed().width,
			height: () => boxed().height,
			borderRadius: 12,
			y: () => restY(),
		});

		const tl = gsap.timeline({
			defaults: { ease: "none" },
			scrollTrigger: {
				trigger: section,
				start: "top top",
				end: "bottom bottom",
				scrub: 0.6,
				invalidateOnRefresh: true,
			},
		});

		// 0 → 40: expand to fill the viewport.
		tl.fromTo(
			frame,
			{
				width: () => boxed().width,
				height: () => boxed().height,
				borderRadius: 12,
			},
			{
				width: () => full().width,
				height: () => full().height,
				borderRadius: 0,
				y: 0,
				duration: 40,
			},
			0,
		);
		// 40 → 60: hold full-screen while the user keeps scrolling.
		tl.to(
			frame,
			{
				width: () => full().width,
				height: () => full().height,
				duration: 20,
			},
			40,
		);
		// 60 → 100: return it to the box for the download section.
		tl.to(
			frame,
			{
				width: () => boxed().width,
				height: () => boxed().height,
				borderRadius: 12,
				y: () => restY(),
				duration: 40,
			},
			60,
		);
	}, section);

	if (video) {
		// Autoplay muted while the frame is on screen; pause when it leaves.
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[entries.length - 1];
				if (!entry) return;
				if (entry.isIntersecting) {
					video.play().catch(() => {});
				} else {
					video.pause();
				}
			},
			{ threshold: 0.4 },
		);
		observer.observe(frame);
		cleanups.push(() => observer.disconnect());

		const sound = section.querySelector<HTMLButtonElement>("[data-wt-sound]");
		if (sound) {
			const sync = () => {
				sound.dataset.muted = String(video.muted);
				sound.setAttribute(
					"aria-label",
					video.muted ? "Unmute the launch film" : "Mute the launch film",
				);
			};
			const onClick = () => {
				video.muted = !video.muted;
				sync();
				if (!video.muted) video.play().catch(() => {});
			};
			sound.addEventListener("click", onClick);
			sync();
			cleanups.push(() => sound.removeEventListener("click", onClick));
		}
	}

	ScrollTrigger.refresh();
}

function boot() {
	const section = document.querySelector<HTMLElement>(ROOT_SEL);
	if (!section || section.dataset.wtBooted === "true") return;
	const stage = section.querySelector<HTMLElement>(".wt-film-stage");
	const frame = section.querySelector<HTMLElement>("[data-wt-frame]");
	if (!stage || !frame) return;
	section.dataset.wtBooted = "true";
	build({
		section,
		stage,
		frame,
		video: section.querySelector<HTMLVideoElement>("[data-wt-video]"),
	});
}

function teardown() {
	ctx?.revert();
	ctx = null;
	cleanups.forEach((cleanup) => cleanup());
	cleanups = [];
	document.documentElement.classList.remove("wt-film-live");
	document.querySelectorAll<HTMLElement>(ROOT_SEL).forEach((section) => {
		delete section.dataset.wtBooted;
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
	boot();
}
document.addEventListener("astro:page-load", boot);
document.addEventListener("astro:before-swap", teardown);
window.addEventListener("pagehide", teardown);
