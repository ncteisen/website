type Position = [number, number];
type PolygonCoordinates = Position[][];

export interface DateMyGlobeMapFeature {
	type: 'Feature';
	properties: {
		label: string;
		role: 'context' | 'changed' | 'removed' | 'added';
	};
	geometry: {
		type: 'Polygon';
		coordinates: PolygonCoordinates;
	};
}

export interface DateMyGlobeMap {
	type: 'FeatureCollection';
	label: string;
	note: string;
	features: DateMyGlobeMapFeature[];
}

export interface DateMyGlobeEvent {
	id: string;
	name: string;
	year: number;
	question: string;
	beforeLabel: string;
	afterLabel: string;
	description: string;
	sourceLabel: string;
	sourceUrl: string;
	visualPlaceholder: {
		mode: 'name-change' | 'border-shift' | 'union' | 'split' | 'new-state';
		beforeNote: string;
		afterNote: string;
	};
	region: string;
	includeInChecklist?: boolean;
	mapViewport?: {
		west: number;
		south: number;
		east: number;
		north: number;
	};
	beforeMap?: DateMyGlobeMap;
	afterMap?: DateMyGlobeMap;
	mapSourceNote?: string;
}

const polygon = (
	label: string,
	role: DateMyGlobeMapFeature['properties']['role'],
	coordinates: Position[],
): DateMyGlobeMapFeature => ({
	type: 'Feature',
	properties: { label, role },
	geometry: {
		type: 'Polygon',
		coordinates: [[...coordinates, coordinates[0]]],
	},
});

const box = (
	label: string,
	role: DateMyGlobeMapFeature['properties']['role'],
	west: number,
	south: number,
	east: number,
	north: number,
): DateMyGlobeMapFeature => polygon(label, role, [
	[west, south],
	[east, south],
	[east, north],
	[west, north],
]);

export const dateMyGlobeEvents: DateMyGlobeEvent[] = [
	{
		id: 'viceroyalty-of-peru',
		name: 'Viceroyalty of Peru established',
		year: 1542,
		question: 'Does the globe show Peru as a major Spanish colonial territory?',
		beforeLabel: 'Pre-viceroyalty Americas',
		afterLabel: 'Spanish Peru',
		description: 'Spain organized much of its South American empire under the Viceroyalty of Peru in 1542, giving older globes a useful colonial-era marker.',
		sourceLabel: 'Wikipedia: Viceroyalty of Peru',
		sourceUrl: 'https://en.wikipedia.org/wiki/Viceroyalty_of_Peru',
		visualPlaceholder: {
			mode: 'border-shift',
			beforeNote: 'Looser early colonial labels',
			afterNote: 'Large Spanish Peru label',
		},
		region: 'South America',
	},
	{
		id: 'dutch-east-india-company',
		name: 'Dutch East India Company chartered',
		year: 1602,
		question: 'Does the globe show a Dutch presence or Dutch colonial labels around the East Indies?',
		beforeLabel: 'Pre-Dutch East Indies',
		afterLabel: 'Dutch East Indies era',
		description: 'The Dutch East India Company was chartered in 1602 and became a major force behind Dutch labels and possessions in maritime Asia.',
		sourceLabel: 'Wikipedia: Dutch East India Company',
		sourceUrl: 'https://en.wikipedia.org/wiki/Dutch_East_India_Company',
		visualPlaceholder: {
			mode: 'new-state',
			beforeNote: 'No Dutch East Indies cue',
			afterNote: 'Dutch colonial cue appears',
		},
		region: 'Southeast Asia',
	},
	{
		id: 'westphalia',
		name: 'Treaty of Westphalia',
		year: 1648,
		question: 'Does the globe reflect the Dutch Republic or Swiss Confederacy as independent entities?',
		beforeLabel: 'Pre-Westphalia Europe',
		afterLabel: 'Post-Westphalia Europe',
		description: 'The Peace of Westphalia in 1648 recognized Dutch and Swiss independence, making it a useful early modern European boundary marker.',
		sourceLabel: 'Wikipedia: Peace of Westphalia',
		sourceUrl: 'https://en.wikipedia.org/wiki/Peace_of_Westphalia',
		visualPlaceholder: {
			mode: 'border-shift',
			beforeNote: 'Imperial Europe',
			afterNote: 'Recognized Dutch and Swiss states',
		},
		region: 'Europe',
	},
	{
		id: 'great-britain',
		name: 'Kingdom of Great Britain created',
		year: 1707,
		question: 'Does the globe label Great Britain rather than separate England and Scotland?',
		beforeLabel: 'England and Scotland',
		afterLabel: 'Great Britain',
		description: 'The Acts of Union in 1707 joined England and Scotland into the Kingdom of Great Britain, a name change that often appears clearly on globes.',
		sourceLabel: 'Wikipedia: Acts of Union 1707',
		sourceUrl: 'https://en.wikipedia.org/wiki/Acts_of_Union_1707',
		visualPlaceholder: {
			mode: 'union',
			beforeNote: 'Two labels',
			afterNote: 'One Great Britain label',
		},
		region: 'Europe',
	},
	{
		id: 'united-states',
		name: 'United States declares independence',
		year: 1776,
		question: 'Does the globe show the United States as an independent country?',
		beforeLabel: 'British colonies',
		afterLabel: 'United States',
		description: 'The United States Declaration of Independence in 1776 provides one of the most recognizable dating clues for North America.',
		sourceLabel: 'Wikipedia: United States Declaration of Independence',
		sourceUrl: 'https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence',
		visualPlaceholder: {
			mode: 'name-change',
			beforeNote: 'British colonial label',
			afterNote: 'United States label',
		},
		region: 'North America',
	},
	{
		id: 'belgium',
		name: 'Belgium declares independence',
		year: 1830,
		question: 'Does the globe show Belgium as separate from the Netherlands?',
		beforeLabel: 'United Netherlands',
		afterLabel: 'Belgium',
		description: 'Belgium declared independence during the Belgian Revolution in 1830, creating a compact but visible European border clue.',
		sourceLabel: 'Wikipedia: Belgian Revolution',
		sourceUrl: 'https://en.wikipedia.org/wiki/Belgian_Revolution',
		visualPlaceholder: {
			mode: 'split',
			beforeNote: 'One Low Countries label',
			afterNote: 'Belgium separated',
		},
		region: 'Europe',
	},
	{
		id: 'canadian-confederation',
		name: 'Canadian Confederation',
		year: 1867,
		question: 'Does the globe label Canada as a confederated dominion?',
		beforeLabel: 'British North America',
		afterLabel: 'Canada',
		description: 'Canadian Confederation in 1867 created the Dominion of Canada, replacing many older British North America labels over time.',
		sourceLabel: 'Wikipedia: Canadian Confederation',
		sourceUrl: 'https://en.wikipedia.org/wiki/Canadian_Confederation',
		visualPlaceholder: {
			mode: 'name-change',
			beforeNote: 'British North America',
			afterNote: 'Canada label',
		},
		region: 'North America',
	},
	{
		id: 'germany-unification',
		name: 'Germany unified',
		year: 1871,
		question: 'Does the globe show a unified Germany rather than many German states?',
		beforeLabel: 'German states',
		afterLabel: 'German Empire',
		description: 'The unification of Germany in 1871 replaced a patchwork of German states with a unified German Empire on many maps and globes.',
		sourceLabel: 'Wikipedia: Unification of Germany',
		sourceUrl: 'https://en.wikipedia.org/wiki/Unification_of_Germany',
		visualPlaceholder: {
			mode: 'union',
			beforeNote: 'Many German states',
			afterNote: 'Unified Germany',
		},
		region: 'Europe',
	},
	{
		id: 'second-polish-republic',
		name: 'Second Polish Republic established',
		year: 1918,
		question: 'Does the globe show Poland as an independent state?',
		beforeLabel: 'Partitioned Poland',
		afterLabel: 'Independent Poland',
		description: 'Poland re-emerged as an independent state in 1918 after World War I, creating a strong clue for globes made after the old empires fell.',
		sourceLabel: 'Wikipedia: Second Polish Republic',
		sourceUrl: 'https://en.wikipedia.org/wiki/Second_Polish_Republic',
		visualPlaceholder: {
			mode: 'new-state',
			beforeNote: 'Partitioned among empires',
			afterNote: 'Poland appears',
		},
		region: 'Europe',
		includeInChecklist: true,
		mapViewport: { west: 10, south: 45, east: 35, north: 58 },
		beforeMap: {
			type: 'FeatureCollection',
			label: 'Before',
			note: 'Polish lands divided among neighboring empires.',
			features: [
				box('Germany', 'context', 10, 47, 17.5, 55.5),
				box('Austria-Hungary', 'context', 14, 45, 25, 50.5),
				box('Russian Empire', 'context', 22, 47, 35, 58),
				box('Partitioned Polish lands', 'removed', 17.5, 49, 24.5, 54.5),
			],
		},
		afterMap: {
			type: 'FeatureCollection',
			label: 'After',
			note: 'Poland appears as an independent state.',
			features: [
				box('Germany', 'context', 10, 47, 17.5, 55.5),
				box('Czechoslovakia', 'context', 15, 47, 23, 50),
				box('Soviet Russia', 'context', 25, 48, 35, 58),
				box('Poland', 'added', 17.5, 49, 24.5, 54.5),
			],
		},
		mapSourceNote: 'Simplified regional comparison informed by post-WWI settlement maps and CShapes-style country-period boundaries.',
	},
	{
		id: 'soviet-union',
		name: 'Soviet Union formed',
		year: 1922,
		question: 'Does the globe show the Soviet Union or USSR?',
		beforeLabel: 'Russian Empire aftermath',
		afterLabel: 'USSR',
		description: 'The Soviet Union was formed in 1922, and the USSR label is one of the clearest twentieth-century globe dating clues.',
		sourceLabel: 'Wikipedia: Treaty on the Creation of the USSR',
		sourceUrl: 'https://en.wikipedia.org/wiki/Treaty_on_the_Creation_of_the_USSR',
		visualPlaceholder: {
			mode: 'name-change',
			beforeNote: 'Russia and successor labels',
			afterNote: 'USSR label',
		},
		region: 'Eurasia',
		includeInChecklist: true,
		mapViewport: { west: 18, south: 38, east: 95, north: 72 },
		beforeMap: {
			type: 'FeatureCollection',
			label: 'Before',
			note: 'Russia and neighboring successor areas shown separately.',
			features: [
				box('Poland', 'context', 18, 49, 25, 55),
				box('Ukraine', 'removed', 25, 45, 38, 53),
				box('Caucasus', 'removed', 38, 38, 49, 45),
				box('Russia', 'context', 38, 50, 95, 72),
			],
		},
		afterMap: {
			type: 'FeatureCollection',
			label: 'After',
			note: 'A single USSR label spans Russia, Ukraine, and other republics.',
			features: [
				box('Poland', 'context', 18, 49, 25, 55),
				polygon('USSR', 'added', [
					[25, 45],
					[38, 38],
					[95, 46],
					[95, 72],
					[38, 72],
					[25, 56],
				]),
			],
		},
		mapSourceNote: 'Simplified from twentieth-century Eurasian political boundary references; intended to show the label/state change.',
	},
	{
		id: 'india-pakistan',
		name: 'Partition of India',
		year: 1947,
		question: 'Does the globe show India and Pakistan as separate countries?',
		beforeLabel: 'British India',
		afterLabel: 'India and Pakistan',
		description: 'The 1947 partition created independent India and Pakistan, replacing British India on postwar globes.',
		sourceLabel: 'Wikipedia: Partition of India',
		sourceUrl: 'https://en.wikipedia.org/wiki/Partition_of_India',
		visualPlaceholder: {
			mode: 'split',
			beforeNote: 'British India',
			afterNote: 'India and Pakistan',
		},
		region: 'South Asia',
		includeInChecklist: true,
		mapViewport: { west: 60, south: 5, east: 98, north: 36 },
		beforeMap: {
			type: 'FeatureCollection',
			label: 'Before',
			note: 'British India covers the subcontinent.',
			features: [
				box('Afghanistan', 'context', 60, 28, 72, 36),
				box('China', 'context', 78, 28, 98, 36),
				polygon('British India', 'removed', [
					[66, 24],
					[72, 34],
					[88, 28],
					[92, 22],
					[88, 8],
					[78, 6],
					[70, 10],
				]),
			],
		},
		afterMap: {
			type: 'FeatureCollection',
			label: 'After',
			note: 'India and Pakistan appear as separate countries.',
			features: [
				box('Afghanistan', 'context', 60, 28, 72, 36),
				box('China', 'context', 78, 28, 98, 36),
				polygon('Pakistan', 'added', [
					[61, 24],
					[68, 32],
					[74, 29],
					[72, 24],
					[66, 22],
				]),
				polygon('India', 'added', [
					[72, 28],
					[88, 27],
					[91, 21],
					[88, 8],
					[78, 6],
					[72, 16],
				]),
				box('East Pakistan', 'added', 88, 20, 93, 26),
			],
		},
		mapSourceNote: 'Simplified subcontinent view focused on the 1947 political split.',
	},
	{
		id: 'israel',
		name: 'Israel declares independence',
		year: 1948,
		question: 'Does the globe show Israel?',
		beforeLabel: 'Mandate Palestine',
		afterLabel: 'Israel',
		description: 'Israel declared independence in 1948, creating a small but often legible label in the eastern Mediterranean.',
		sourceLabel: 'Wikipedia: Israeli Declaration of Independence',
		sourceUrl: 'https://en.wikipedia.org/wiki/Israeli_Declaration_of_Independence',
		visualPlaceholder: {
			mode: 'new-state',
			beforeNote: 'Mandate Palestine',
			afterNote: 'Israel label',
		},
		region: 'Middle East',
		includeInChecklist: true,
		mapViewport: { west: 32, south: 28, east: 39, north: 35 },
		beforeMap: {
			type: 'FeatureCollection',
			label: 'Before',
			note: 'The area is labeled as Mandate Palestine.',
			features: [
				box('Mediterranean', 'context', 32, 28, 34, 35),
				box('Transjordan', 'context', 36, 29, 39, 34),
				polygon('Mandate Palestine', 'removed', [
					[34.2, 31],
					[35.3, 33.5],
					[35.8, 32],
					[35.4, 29.5],
					[34.7, 29.4],
				]),
			],
		},
		afterMap: {
			type: 'FeatureCollection',
			label: 'After',
			note: 'Israel appears on the eastern Mediterranean coast.',
			features: [
				box('Mediterranean', 'context', 32, 28, 34, 35),
				box('Jordan', 'context', 36, 29, 39, 34),
				polygon('Israel', 'added', [
					[34.4, 31.1],
					[35.2, 33.2],
					[35.6, 32],
					[35.2, 29.6],
					[34.8, 29.5],
				]),
				box('Palestinian areas', 'context', 35.2, 31.3, 35.8, 32.4),
			],
		},
		mapSourceNote: 'Simplified eastern Mediterranean crop focused on the 1948 label change.',
	},
	{
		id: 'bangladesh',
		name: 'Bangladesh independence',
		year: 1971,
		question: 'Does the globe show Bangladesh rather than East Pakistan?',
		beforeLabel: 'East Pakistan',
		afterLabel: 'Bangladesh',
		description: 'Bangladesh became independent in 1971, making the label a useful late twentieth-century clue.',
		sourceLabel: 'Wikipedia: Bangladesh Liberation War',
		sourceUrl: 'https://en.wikipedia.org/wiki/Bangladesh_Liberation_War',
		visualPlaceholder: {
			mode: 'name-change',
			beforeNote: 'East Pakistan',
			afterNote: 'Bangladesh',
		},
		region: 'South Asia',
		includeInChecklist: true,
		mapViewport: { west: 84, south: 18, east: 94, north: 29 },
		beforeMap: {
			type: 'FeatureCollection',
			label: 'Before',
			note: 'The region is labeled East Pakistan.',
			features: [
				box('India', 'context', 84, 20, 90, 29),
				box('Burma', 'context', 92, 18, 94, 26),
				polygon('East Pakistan', 'removed', [
					[88.1, 21],
					[90.4, 20.7],
					[92.2, 22.2],
					[91.5, 26.4],
					[88.8, 26.8],
					[87.4, 24.4],
				]),
			],
		},
		afterMap: {
			type: 'FeatureCollection',
			label: 'After',
			note: 'Bangladesh replaces East Pakistan.',
			features: [
				box('India', 'context', 84, 20, 90, 29),
				box('Myanmar', 'context', 92, 18, 94, 26),
				polygon('Bangladesh', 'added', [
					[88.1, 21],
					[90.4, 20.7],
					[92.2, 22.2],
					[91.5, 26.4],
					[88.8, 26.8],
					[87.4, 24.4],
				]),
			],
		},
		mapSourceNote: 'Simplified Bengal-region comparison focused on the 1971 name/state change.',
	},
	{
		id: 'german-reunification',
		name: 'German reunification',
		year: 1990,
		question: 'Does the globe show one Germany rather than East and West Germany?',
		beforeLabel: 'East and West Germany',
		afterLabel: 'Germany',
		description: 'German reunification in 1990 removed the East Germany and West Germany split from current political maps.',
		sourceLabel: 'Wikipedia: German reunification',
		sourceUrl: 'https://en.wikipedia.org/wiki/German_reunification',
		visualPlaceholder: {
			mode: 'union',
			beforeNote: 'Two Germany labels',
			afterNote: 'One Germany',
		},
		region: 'Europe',
		includeInChecklist: true,
		mapViewport: { west: 5, south: 47, east: 17, north: 56 },
		beforeMap: {
			type: 'FeatureCollection',
			label: 'Before',
			note: 'East Germany and West Germany are separate.',
			features: [
				box('France', 'context', 5, 47, 8, 51.5),
				box('Poland', 'context', 14, 49, 17, 55),
				box('West Germany', 'removed', 7, 47.5, 10.8, 54.8),
				box('East Germany', 'removed', 10.8, 50.5, 14.5, 54.8),
			],
		},
		afterMap: {
			type: 'FeatureCollection',
			label: 'After',
			note: 'One Germany replaces East and West Germany.',
			features: [
				box('France', 'context', 5, 47, 8, 51.5),
				box('Poland', 'context', 14, 49, 17, 55),
				polygon('Germany', 'added', [
					[7, 47.5],
					[10.8, 47.5],
					[14.5, 50.5],
					[14.5, 54.8],
					[7, 54.8],
				]),
			],
		},
		mapSourceNote: 'Simplified central Europe view focused on the 1990 reunification label change.',
	},
	{
		id: 'soviet-dissolution',
		name: 'Soviet Union dissolved',
		year: 1991,
		question: 'Does the globe show Russia, Ukraine, and other former Soviet republics instead of the USSR?',
		beforeLabel: 'USSR',
		afterLabel: 'Post-Soviet states',
		description: 'The dissolution of the Soviet Union in 1991 replaced the USSR with Russia and other independent republics.',
		sourceLabel: 'Wikipedia: Dissolution of the Soviet Union',
		sourceUrl: 'https://en.wikipedia.org/wiki/Dissolution_of_the_Soviet_Union',
		visualPlaceholder: {
			mode: 'split',
			beforeNote: 'One USSR label',
			afterNote: 'Multiple republics',
		},
		region: 'Eurasia',
		includeInChecklist: true,
		mapViewport: { west: 18, south: 38, east: 95, north: 72 },
		beforeMap: {
			type: 'FeatureCollection',
			label: 'Before',
			note: 'The USSR appears as one large state.',
			features: [
				box('Poland', 'context', 18, 49, 25, 55),
				polygon('USSR', 'removed', [
					[25, 45],
					[38, 38],
					[95, 46],
					[95, 72],
					[38, 72],
					[25, 56],
				]),
			],
		},
		afterMap: {
			type: 'FeatureCollection',
			label: 'After',
			note: 'Russia, Ukraine, and other former Soviet republics appear separately.',
			features: [
				box('Poland', 'context', 18, 49, 25, 55),
				box('Ukraine', 'added', 25, 45, 38, 53),
				box('Baltic states', 'added', 21, 55, 28, 59),
				box('Caucasus', 'added', 38, 38, 49, 45),
				box('Russia', 'added', 38, 50, 95, 72),
				box('Central Asia', 'added', 50, 39, 74, 49),
			],
		},
		mapSourceNote: 'Simplified post-1991 comparison focused on the disappearance of the USSR label.',
	},
	{
		id: 'czechoslovakia',
		name: 'Czechoslovakia dissolved',
		year: 1993,
		question: 'Does the globe show the Czech Republic and Slovakia instead of Czechoslovakia?',
		beforeLabel: 'Czechoslovakia',
		afterLabel: 'Czech Republic and Slovakia',
		description: 'Czechoslovakia split into the Czech Republic and Slovakia in 1993, adding another compact post-Cold War clue.',
		sourceLabel: 'Wikipedia: Dissolution of Czechoslovakia',
		sourceUrl: 'https://en.wikipedia.org/wiki/Dissolution_of_Czechoslovakia',
		visualPlaceholder: {
			mode: 'split',
			beforeNote: 'One country label',
			afterNote: 'Two country labels',
		},
		region: 'Europe',
		includeInChecklist: true,
		mapViewport: { west: 10, south: 47, east: 24, north: 52 },
		beforeMap: {
			type: 'FeatureCollection',
			label: 'Before',
			note: 'Czechoslovakia appears as one country.',
			features: [
				box('Germany', 'context', 10, 48, 13, 52),
				box('Poland', 'context', 16, 50, 24, 52),
				polygon('Czechoslovakia', 'removed', [
					[12, 48.5],
					[18.5, 48],
					[22.5, 49],
					[21.5, 50.4],
					[14, 50.6],
				]),
			],
		},
		afterMap: {
			type: 'FeatureCollection',
			label: 'After',
			note: 'The Czech Republic and Slovakia appear separately.',
			features: [
				box('Germany', 'context', 10, 48, 13, 52),
				box('Poland', 'context', 16, 50, 24, 52),
				polygon('Czech Republic', 'added', [
					[12, 48.5],
					[16.5, 48.4],
					[17.4, 50.2],
					[14, 50.6],
				]),
				polygon('Slovakia', 'added', [
					[17.2, 48.4],
					[22.5, 49],
					[21.5, 50.4],
					[17.4, 50.2],
				]),
			],
		},
		mapSourceNote: 'Simplified central Europe view focused on the 1993 split.',
	},
	{
		id: 'south-sudan',
		name: 'South Sudan independence',
		year: 2011,
		question: 'Does the globe show South Sudan as a separate country?',
		beforeLabel: 'Sudan',
		afterLabel: 'South Sudan',
		description: 'South Sudan became independent in 2011, making it one of the newest high-confidence dating clues on modern globes.',
		sourceLabel: 'Wikipedia: South Sudan',
		sourceUrl: 'https://en.wikipedia.org/wiki/South_Sudan',
		visualPlaceholder: {
			mode: 'split',
			beforeNote: 'One Sudan label',
			afterNote: 'South Sudan separated',
		},
		region: 'Africa',
		includeInChecklist: true,
		mapViewport: { west: 21, south: 3, east: 38, north: 23 },
		beforeMap: {
			type: 'FeatureCollection',
			label: 'Before',
			note: 'Sudan appears as one country.',
			features: [
				box('Chad', 'context', 21, 9, 25, 20),
				box('Ethiopia', 'context', 34, 3, 38, 14),
				polygon('Sudan', 'removed', [
					[24, 4],
					[34, 4],
					[36, 12],
					[32, 22],
					[24, 21],
					[22, 14],
				]),
			],
		},
		afterMap: {
			type: 'FeatureCollection',
			label: 'After',
			note: 'South Sudan appears below Sudan.',
			features: [
				box('Chad', 'context', 21, 9, 25, 20),
				box('Ethiopia', 'context', 34, 3, 38, 14),
				polygon('Sudan', 'context', [
					[24, 10],
					[35, 10],
					[36, 16],
					[32, 22],
					[24, 21],
					[22, 14],
				]),
				polygon('South Sudan', 'added', [
					[24, 4],
					[34, 4],
					[35, 10],
					[24, 10],
				]),
			],
		},
		mapSourceNote: 'Simplified Sudan-region comparison focused on South Sudan independence in 2011.',
	},
];
