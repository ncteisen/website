# Codewords

The game lives at `/codewords/`. `/projects/codewords/` and `/old/codewords/` redirect there, preserving seed and word-set parameters. The game is not listed on the main site.

This is a local board, with no server or synchronized turns. Players and spymasters enter the same seed and word set to reproduce the same words and identities. Cards toggle on and off in both views. Spymaster mode shows the whole key; marked cards have a check and strikethrough. Each device saves its own marks. Hiding the key does not clear them.

The toolbar contains the seed, word set, Load, New board, a 30-second timer, the spymaster toggle, and red/blue counts. Clues and turns are handled by the people playing. There are no confirmation dialogs or game-over lockouts.

`engine.ts` owns deterministic generation, reversible card marks, and save validation. `client.ts` owns display, the timer, and local persistence. Saves from the previous turn-based interface migrate their revealed cards to marks. The key is hidden when leaving or reloading the page, and its visibility is never saved. The key is generated on the client, not secured against inspecting the source.

Board links include `board`, `pack`, and `v=1`. Keep vocabulary ordering and the v1 generator stable to preserve those links. Original pre-upgrade seed codes use a different generator and do not recreate their old boards here.

The classic, nouns, movies, and adult collections in `words.json` were normalized and deduplicated from `public/old/codewords/scripts/data.js`. The original project was derived from [KodeNames](https://github.com/ninjabunny/KodeNames); its [MIT license](../../../public/old/codewords/LICENSE.md) is retained. Technology is a new collection.

Run `npm run test:codewords`, `npm run build`, and `npm run preview` to validate. No API keys or new runtime dependencies are required.
