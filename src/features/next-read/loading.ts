// Short excerpts from public-domain works. Keep the source with each quote.
const quotes = [
	{
		text: 'all human wisdom is contained in these two words, “Wait and hope.”',
		author: 'Alexandre Dumas',
		work: 'The Count of Monte Cristo',
		source: 'https://en.wikisource.org/wiki/Page:The_Count_of_Monte-Cristo_(1887_Volume_5).djvu/283',
	},
	{
		text: 'Still achieving, still pursuing,\nLearn to labor and to wait.',
		author: 'Henry Wadsworth Longfellow',
		work: 'A Psalm of Life',
		source: 'https://rpo.library.utoronto.ca/content/psalm-life',
	},
	{
		text: 'If you were coming in the fall,\nI’d brush the summer by',
		author: 'Emily Dickinson',
		work: 'If you were coming in the fall',
		source: 'https://en.wikisource.org/wiki/The_Complete_Poems_of_Emily_Dickinson/If_you_were_coming_in_the_fall',
	},
	{
		text: 'Pleasure and action make the hours seem short.',
		author: 'William Shakespeare',
		work: 'Othello, Act II, Scene III',
		source: 'https://www.folger.edu/explore/shakespeares-works/othello/read/2/3/',
	},
];

let lastQuote = -1;

export function createWaitingNote(replacement = false) {
	// Pick once per request, without repeating the previous quote. Let it sit
	// while the reader waits; no cycling text or artificial minimum delay.
	const choices = quotes.map((_, index) => index).filter(index => index !== lastQuote);
	lastQuote = choices[Math.floor(Math.random() * choices.length)];
	const quote = quotes[lastQuote];
	const note = document.createElement('div');
	note.className = replacement ? 'waiting-note waiting-note-inline' : 'waiting-note';
	const heading = document.createElement('div');
	heading.className = 'waiting-heading';
	const book = document.createElement('span');
	book.className = 'turning-book';
	book.setAttribute('aria-hidden', 'true');
	book.append(document.createElement('span'));
	const label = document.createElement('span');
	label.textContent = replacement ? 'Choosing another book…' : 'Choosing your books…';
	heading.append(book, label);
	const figure = document.createElement('figure');
	const excerpt = document.createElement('blockquote');
	excerpt.textContent = quote.text;
	excerpt.cite = quote.source;
	const attribution = document.createElement('figcaption');
	const title = document.createElement('cite');
	const link = document.createElement('a');
	link.textContent = quote.work;
	link.href = quote.source;
	link.target = '_blank';
	link.rel = 'noopener noreferrer';
	title.append(link);
	attribution.append(`${quote.author}, `, title);
	figure.append(excerpt, attribution);
	note.append(heading, figure);
	return note;
}
