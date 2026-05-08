export interface Project {
	title: string;
	description: string;
	href: string;
	label: string;
	external: boolean;
	featured: boolean;
	visualLabel: string;
	accent: string;
	image?: string;
}

export const projects: Project[] = [
	{
		title: "Sarah's Puzzle",
		description: 'Crossword puzzle I made to propose to my wife.',
		href: 'http://sarahspuzzle.com/',
		label: 'sarahs-puzzle',
		external: true,
		featured: true,
		visualLabel: 'Crossword',
		accent: '#d6a561',
	},
	{
		title: 'Hypertext Library',
		description: 'Literature-based web project I built in college after a class on Ulysses.',
		href: 'https://www.hypertextlibrary.com/',
		label: 'hypertext-library',
		external: true,
		featured: true,
		visualLabel: 'Library',
		accent: '#8aa0d6',
	},
	{
		title: '2049 Puzzle',
		description: '2048-inspired puzzle game built on the Roblox platform.',
		href: 'https://www.roblox.com/games/88880963125700/2049-Puzzle',
		label: '2049-puzzle',
		external: true,
		featured: false,
		visualLabel: '2049',
		accent: '#d77f5f',
	},
	{
		title: 'Sarah Jumps',
		description: 'Doodle Jump-inspired game built in 2024 to explore the then-new power of AI-assisted development.',
		href: '/projects/sarah-jumps',
		label: 'sarah-jumps',
		external: false,
		featured: false,
		visualLabel: 'Arcade',
		accent: '#83b8a1',
	},
	{
		title: 'Codex Pets',
		description: 'A virtual simulation habitat for all my Codex pets.',
		href: '/projects/pets',
		label: 'codex-pets',
		external: false,
		featured: false,
		visualLabel: 'Habitat',
		accent: '#8f9f86',
	},
	{
		title: 'Zingg',
		description: 'Online social game I built during the pandemic to stay connected with college friends.',
		href: 'https://playzingg.com/',
		label: 'zingg',
		external: true,
		featured: true,
		visualLabel: 'Game Night',
		accent: '#b28ad6',
	},
	{
		title: 'Old Website',
		description: "The previous version of this site. I'm a digital archivist.",
		href: '/old',
		label: 'old-website',
		external: false,
		featured: false,
		visualLabel: 'Archive',
		accent: '#6d8fbd',
	},
];
