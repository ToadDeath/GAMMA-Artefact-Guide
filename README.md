# S.T.A.L.K.E.R. GAMMA Artefact Guide

A crafting-first, independent field reference for GAMMA 0.9.5 artefacts, modifiers, custom classifications, and artefact-melter progression.

## Custom classification

The guide uses a custom classification supplied by the project owner. It contains exactly five groups: Tier 0, Tier 1, Tier 2, Tier 3, and Tier 4. These are **not** the game's exported tier values. Source tiers remain preserved in each record's original `tier` and `raw` data; the guide's `customTier` field is the project's classification.

The authoritative lists are stored in `data/artifacts.json` under `customTiers`. The app resolves translated display names and assigns the matching `customTier` value at runtime. Unlisted artefacts remain unclassified and are not shown in the progression guide. This avoids silently assigning a source-game tier to the custom system.

## Crafting progression

`data/recipes.json` is the source of recipe inputs and outputs. The main view derives crafting stages from recipe dependencies, with base artefacts first and crafted outputs later. Each classified artefact is rendered once in the progression map. Its custom tier and modifier tags are secondary information on the same node. Ingredients that are not artefacts, such as mutant parts, remain visible as recipe inputs but do not become artefact nodes.

## Data provenance

The artefact and recipe records in `data/` are derived from the GAMMA 0.9.5 exports published by [Stalker GAMMA Item Database](https://github.com/simonwdev/stalker-anomaly-gamma-db), which credits USADE by SaloEater and game data exports. See that project's [license](https://github.com/simonwdev/stalker-anomaly-gamma-db/blob/main/LICENSE) and acknowledgements. This repository uses a separately written interface and does not copy its application code or design.

English display names and perk descriptions are resolved from the upstream localization data when available. The `customTier` property is reserved in each artifact record; translated names are used to populate the authoritative project classification at runtime.

## Run locally

Serve the repository folder with any static HTTP server, then open `index.html`. The page fetches upstream English localization data when available.

## GitHub Pages

This repository deploys through its GitHub Actions workflow in `.github/workflows/static.yml`. Keep the workflow deployment configuration; do not switch Pages to branch deployment.

## Disclaimer

Unofficial community project. Not affiliated with or endorsed by GSC Game World, the S.T.A.L.K.E.R. Anomaly team, or the G.A.M.M.A. team. All trademarks belong to their respective owners.


## Purpose categories

The main guide groups each classified artefact exactly once by broad purpose: physical resistance, anomaly resistance, healing and recovery, utility and mobility, special perks, or other/special. All 32 perk artefacts have their full English perk text stored locally in the data file, so perk details do not depend on the live translation request. Cards show the perk name and a short preview; opening a profile reveals the full effect description. Resistance caps remain separate from resistance values in the detailed profile.
