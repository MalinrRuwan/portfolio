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

	about: [
		"I'm Malin. Splits time between web development, DevOps, and machine learning and electronics. I like tools that are simple, ownable, and well-made. ",
		"Right now I'm studying, building small projects across the stack, and writing down what I learn along the way.",
	],

	/** "Stack" section — grouped columns. */
	stack: [
		{
			label: "Web",
			items: ["TypeScript", "React", "Astro", "Node.js", "Tailwind CSS", "TanStack", "GraphQL"],
		},
		{
			label: "Systems",
			items: ["Python", "Java", "SQL", "Docker", "Git", "MongoDB", "Redis"],
		},
		{
			label: "Hardware & ML",
			items: ["C / C++", "PyTorch", "Linux", "TensorFlow", "OpenCV",  "KiCad"],
		},
	],

	/** Résumé link — point this at a PDF when ready. */
	resumeUrl: "https://rxresu.me/malinrruwan/resume-1",

  volunteering: [
    {
			period: "2025 — Present",
			title: "ICTS - Assistant Secretary",
			description:
				"Currently serving as the Assistant Secretary for Information and communication technology society, University of Sri Jayewardenepura.",
    },
    {
			period: "2025 — Present",
			title: "Gavel - Media Co-Director",
			description:
				"Creating digital content for the Gavel executive committee.",
		},
		{
			period: "2024- Present",
			title: "IEEE Student Branch",
			description:
				"Organizing workshops and tech talks for the student community and an active volunteer member",
    },
    {
			period: "2026",
			title: "Gavel - Speechmaster 2026  - Media Crew Head",
			description:
				"Served as a Media Crew head for Speech Master 2025, organized by the Gavel Club of University of Sri Jayewardenepura. Lead the media crew to ensure a successful event outcome.",
    },
    {
			period: "2026",
			title: "J'Pura Expedition 3.0 - Project Chair",
			description:
				"Worked as the Project Chair for J'Pura Expedition 3.0, leading all the crews to successful outcome.",
    },
    {
			period: "2025",
			title: "J'Pura Expedition 2.0 - Committee Head (Delegates handeling Committee)",
			description:
				"Contributed as a Delegate Committee Crew Head and Committee Member. Played a key role in optimising operational processes for smoother execution. Responsible for managing delegate logistics (650+ attendees) and crew coordination.",
    },
    {
			period: "2025",
			title: "Beauty of Cloud - Web development crew",
			description:
				"Served as a Web Development Crew Member for the Beauty of Cloud event series, organised by the Computer Society Chapter of the IEEE Student Branch of University of Sri Jayewardenepura. Contributed in developing https://beautyof.cloud",
		},
    {
			period: "2025",
			title: "Gavel - Speechmaster 2025  - Media Crew Member",
			description:
				"Served as a Design Crew Member for Speech Master 2025, organized by the Gavel Club of University of Sri Jayewardenepura. Created engaging and attractive flyers, contributing to the event's visibility and success through dedicated graphic design efforts.",
    },
    {
			period: "2025",
			title: "Road to Legacy - Crew Member (Technical Crew)",
			description:
				"Served as a Technical Crew Member for Road to Legacy 2.0, a collaborative initiative by students from USJ, UCSC, and UoM. I manage the technical aspects of the event, supporting its mission to bridge the industry-university gap and foster tech entrepreneurship.",
    },


	] satisfies TimelineEntry[],

	education: [
		{
			period: "2024 — Present",
			title: "BICT (Hons) Networking Specialisation",
			description:
				"Studying across computer science and electronics, with coursework in software engineering, embedded systems, and machine learning.",
		},
	] satisfies TimelineEntry[],

	socials: [
		{ label: "GitHub", url: "https://github.com/malinrruwan" },
		{ label: "LinkedIn", url: "https://www.linkedin.com/in/malindhamsara" },
    { label: "Email", url: "mailto:hello@malindhamsara.dev" },
		{ label: "Twitter", url: "https://twitter.com/malindhamsara" }
	] satisfies Social[],

	/** Contact page — the preferred channel is listed first. */
	email: "hello@malindhamsara.dev",
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
