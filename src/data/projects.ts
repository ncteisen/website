export interface Project {
	title: string;
	description: string;
	href: string;
	label: string;
	external: boolean;
	featured: boolean;
	featuredOnMobile?: boolean;
	accent: string;
}

export const projects: Project[] = [
	{
		title: "Sarah's Puzzle",
		description: 'Crossword puzzle I made to propose to my wife.',
		href: 'http://sarahspuzzle.com/',
		label: 'sarahs-puzzle',
		external: true,
		featured: true,
		accent: '#d6a561',
	},
	{
		title: 'Hypertext Library',
		description: 'Literature-based web project I built in college after a class on Ulysses.',
		href: 'https://www.hypertextlibrary.com/',
		label: 'hypertext-library',
		external: true,
		featured: true,
		accent: '#8aa0d6',
	},
	{
		title: '2049 Puzzle',
		description: '2048-inspired puzzle game built on the Roblox platform.',
		href: 'https://www.roblox.com/games/88880963125700/2049-Puzzle',
		label: '2049-puzzle',
		external: true,
		featured: false,
		accent: '#d77f5f',
	},
	{
		title: 'Sarah Jumps',
		description: 'Doodle Jump-inspired game built in 2024 to explore the then-new power of AI-assisted development.',
		href: '/projects/sarah-jumps',
		label: 'sarah-jumps',
		external: false,
		featured: false,
		accent: '#83b8a1',
	},
	{
		title: 'Codex Pets',
		description: 'A virtual habitat I built for my Codex pets.',
		href: '/projects/pets',
		label: 'codex-pets',
		external: false,
		featured: false,
		featuredOnMobile: true,
		accent: '#8f9f86',
	},
	{
		title: 'Zingg',
		description: 'Social game I built during the pandemic to stay connected with friends.',
		href: 'https://playzingg.com/',
		label: 'zingg',
		external: true,
		featured: true,
		accent: '#b28ad6',
	},
	{
		title: 'Old Website',
		description: "The previous version of this site. I'm a digital archivist.",
		href: '/old',
		label: 'old-website',
		external: false,
		featured: false,
		accent: '#6d8fbd',
	},
];
