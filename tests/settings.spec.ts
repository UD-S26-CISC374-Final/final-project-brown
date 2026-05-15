import { DEFAULT_SETTINGS } from "../src/game/settings";

describe("game settings", () => {
    it("starts with full volume and distractions enabled", () => {
        expect(DEFAULT_SETTINGS).toEqual({
            masterVolume: 1,
            musicVolume: 1,
            sfxVolume: 1,
            muted: false,
            reducedDistractions: false,
        });
    });
});
