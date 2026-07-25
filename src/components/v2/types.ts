/** Shared prop shapes for the v2 film scenes. */

export interface FragProject {
	title: string;
	year?: string;
	href: string;
	summary?: string;
}

export interface FragPost {
	title: string;
	href: string;
}

export interface Discipline {
	num: string;
	name: string;
	label: string;
	projects: FragProject[];
	post?: FragPost;
}
