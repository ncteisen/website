# Date My Globe Map Sources

This folder stores source geography used by the Date My Globe map-pack generator.

- `natural-earth-countries-110m.geojson` is derived from Natural Earth 1:110m country polygons via the public-domain `nvkelso/natural-earth-vector` distribution.
- U.S. territorial clue overrides are checked against the U.S. Census Bureau / USGS National Atlas Territorial Acquisitions map.
- European state-formation overrides are checked against historical references for the German Empire, the 1867 Ausgleich / Austria-Hungary, Romanian unification, Italian unification, the 1878 Treaty of Berlin, Norway 1905, Bulgarian independence, and Albanian independence.
- Europe and post-imperial overrides are checked against historical references for the Soviet Union's formation and dissolution, Finnish and Baltic independence, Austria-Hungary's dissolution, Austria's annexation, Germany's postwar division and reunification, Czechoslovakia's split, and the Yugoslavia / Serbia-Montenegro sequence.
- South Asia overrides are checked against historical references for the 1947 Partition of India, Afghanistan's 1919 independence recognition, Burma's 1937 separation from British India, Ceylon/Sri Lanka independence and renaming, and Bangladesh's 1971 independence.
- Middle East overrides are checked against historical references for the Republic of Turkey, the Persia/Iran naming change, Saudi Arabia and Iraq independence-era labels, Hatay, Jordan, the United Arab Republic, South Yemen, the United Arab Emirates, Qatar, and Yemen unification.
- East and Southeast Asia overrides are checked against historical references for Philippines independence, Indonesian sovereignty transfer, Korea's division, Vietnam's division and reunification, Malaya/Malaysia formation, the Burma/Myanmar name change, and East Timor's separation from Indonesia.
- Africa overrides are checked against independence-date and historical-label references for Boer republics and the Union of South Africa, the Congo Free State / Belgian Congo sequence, the Year of Africa, Portuguese Angola and Mozambique, Eritrea's separation from Ethiopia, and South Sudan's 2011 independence.
- Americas and Caribbean overrides are checked against historical references for the Viceroyalty of Peru, South American independence markers, Canadian Confederation, Newfoundland joining Canada, Panama's separation from Colombia, Guiana/Guyana/Suriname name changes, Belize/British Honduras, and Caribbean island-state independence markers.
- Oceania overrides are checked against historical references for New Holland/Australia and Van Diemen's Land/Tasmania name changes, Fiji independence, Tonga's protectorate-to-independence change, Australian-administered Papua and New Guinea, the Trust Territory of the Pacific Islands, and Pacific island independence/name-change markers.
- Special clue overrides are checked against references for the Suez Canal opening, Panama Canal opening, and the Congo/Zaire/DR Congo name changes.
- Early modern overrides are checked against references for the Dutch East India Company, the Peace of Westphalia, and the 1707 Acts of Union.
- CShapes 2.0 and SUNGEO are used as historical-boundary reference standards for event specs and source notes; compact rendered map packs remain in `src/data/dateMyGlobeMapPacks.ts`.

The generated in-app maps are educational, simplified comparison maps. They are not survey-grade legal boundary datasets.
