/**
 * Structured profile data for the home page resume-style sections.
 *
 * Posts and projects live in the CMS (edit them in the admin panel at
 * /_emdash/admin). This file holds the structured, rarely-changing resume
 * data that doesn't fit a rich-text collection — edit it like code.
 */

export interface Social {
	label: string;
	url: string;
}

export interface TimelineEntry {
	period: string;
	title: string;
	description: string;
}

export const profile = {
	/** Shown inside the black "Based in …" pill next to the name. */
	location: "Colombo, Sri Lanka",

	/** "A Little About me" paragraphs. */
	about: [
		"I'm Malin — a student who splits time between web development, electronics, and machine learning. I like tools that are simple, ownable, and well-made, which is probably why this site runs on a CMS I can read the source of.",
		"Right now I'm studying, building small projects across the stack, and writing down what I learn along the way.",
	],

	/** "Stack" section — grouped columns. */
	stack: [
		{
			label: "Web",
			items: ["TypeScript", "React", "Astro", "Node.js", "Tailwind CSS"],
		},
		{
			label: "Systems",
			items: ["Python", "Java", "SQL", "Docker", "Git"],
		},
		{
			label: "Hardware & ML",
			items: ["C / C++", "KiCad", "PyTorch", "Linux"],
		},
	],

	/** Résumé link — point this at a PDF when ready. */
	resumeUrl: "/resume.pdf",

	volunteering: [
		{
			period: "2025 — Present",
			title: "IEEE Student Branch",
			description:
				"Organizing workshops and tech talks for the student community — everything from intro-to-git sessions to hands-on PCB design.",
		},
		{
			period: "2024 — Present",
			title: "STEM Outreach",
			description:
				"Helping run electronics and programming demos for school students visiting the university.",
		},
	] satisfies TimelineEntry[],

	education: [
		{
			period: "2023 — Present",
			title: "BSc (Hons) — Undergraduate Studies",
			description:
				"Studying across computer science and electronics, with coursework in software engineering, embedded systems, and machine learning.",
		},
	] satisfies TimelineEntry[],

	socials: [
		{ label: "GitHub", url: "https://github.com/malinruwanpathirana" },
		{ label: "LinkedIn", url: "https://www.linkedin.com/in/malinruwanpathirana" },
		{ label: "Email", url: "mailto:hello@malindhamsara.com" },
	] satisfies Social[],

	/** Contact page — the preferred channel is listed first. */
	email: "hello@malindhamsara.com",
};

/** Initials used for the avatar fallback monogram. */
export function initials(name: string): string {
	return name
		.split(/\s+/)
		.map((part) => part[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase();
}
