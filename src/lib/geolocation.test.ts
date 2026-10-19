import { describe, expect, it } from "bun:test";

import { distanceKm, roundCoordinates } from "@/lib/geolocation";

describe("location privacy and distance", () => {
  it("rounds listing pins to about 100 metres of precision", () => {
    expect(roundCoordinates({ latitude: 12.971598, longitude: 77.594566 })).toEqual({
      latitude: 12.972,
      longitude: 77.595,
    });
  });

  it("calculates distance between Bengaluru and Mysuru to about 126 km", () => {
    const kilometres = distanceKm(
      { latitude: 12.9716, longitude: 77.5946 },
      { latitude: 12.2958, longitude: 76.6394 },
    );
    expect(kilometres).toBeGreaterThan(125);
    expect(kilometres).toBeLessThan(127);
  });
});