# RentEase — Figma boards

Six 1600 px-wide boards that explain the project to someone new to it: designers, product
people, or a developer on their first day.

| Board | What it explains |
|---|---|
| `01-overview.svg` | What RentEase is, the three roles and demo accounts, and what is real and what is mocked |
| `02-user-flows.svg` | The rental lifecycle, setting up the home, and what happens around the lease |
| `03-architecture.svg` | The one-way data path, the mocked backend, the localStorage DB, folders, and how to add a feature |
| `04-screen-map.svg` | Every route, who can open it, and the sidebar for each role |
| `05-layout-planner.svg` | The planner's three steps, the bed-fit rules, and the 2 BHK bedrooms as the app draws them |
| `06-design-system.svg` | Colour tokens, type, UI primitives and page rules |

## Getting them into Figma

1. Open a Figma design file.
2. Drag all six `.svg` files onto the canvas, or use **File → Place image** and pick them.
3. Each board lands as a frame of editable layers: text stays text and shapes stay shapes.

The boards use **Inter**, **Bricolage Grotesque** and **IBM Plex Mono**, which are all Google
Fonts that Figma has built in.

## Keeping them true

The room drawings on board 05 are rendered from the app's own `BedFitRoom` and `FloorPlan`
components, not redrawn by hand. The rest was written from the code and `rentease-poc/README.md`
as of 23 Sep 2026. If a flow, route or rule changes, update the boards as well.
