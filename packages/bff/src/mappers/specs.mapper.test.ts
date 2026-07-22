import { describe, expect, it } from "vitest";

import { humanizeKey, specDisplay, toKeySpecs, toSpecGroups, toSpecifications } from "./specs.mapper";

describe("humanizeKey", () => {
  it("humanizes snake_case with acronym fixes", () => {
    expect(humanizeKey("voltage_supply")).toBe("Voltage Supply");
    expect(humanizeKey("cpu")).toBe("CPU");
    expect(humanizeKey("ram")).toBe("RAM");
  });
});

describe("specDisplay", () => {
  it("reads scalar and array display values", () => {
    expect(specDisplay({ display: "5 V" })).toBe("5 V");
    expect(specDisplay({ display: ["Wi-Fi", "Bluetooth"] })).toBe("Wi-Fi, Bluetooth");
    expect(specDisplay(undefined)).toBe("");
  });
});

const specs = {
  voltage_supply: { display: "5 V", num: 5, base: 5 },
  connectivity: { display: ["Wi-Fi", "Bluetooth"] },
  empty: {},
};

describe("toSpecifications", () => {
  it("maps and drops empty-value specs", () => {
    const out = toSpecifications(specs);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ key: "voltage_supply", label: "Voltage Supply", value: "5 V" });
  });
});

describe("toKeySpecs", () => {
  it("limits and flags key specs", () => {
    const out = toKeySpecs(specs, 1);
    expect(out).toHaveLength(1);
    expect(out[0]?.isKeySpec).toBe(true);
  });
});

describe("toSpecGroups", () => {
  it("returns a single group, or none when empty", () => {
    expect(toSpecGroups(specs)).toHaveLength(1);
    expect(toSpecGroups({})).toHaveLength(0);
  });
});
