import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBusinessDate, getBusinessTime, getMonthRange } from "./business-date.js";

describe("business date", () => {
  it("uses Shanghai date around local midnight", () => {
    assert.equal(getBusinessDate(new Date("2026-06-30T16:05:00.000Z")), "2026-07-01");
    assert.equal(getBusinessDate(new Date("2026-12-31T16:05:00.000Z")), "2027-01-01");
  });

  it("builds month ranges without UTC date slicing", () => {
    assert.deepEqual(getMonthRange("2026-02"), {
      startDate: "2026-02-01",
      endDate: "2026-02-28"
    });
    assert.deepEqual(getMonthRange("2024-02"), {
      startDate: "2024-02-01",
      endDate: "2024-02-29"
    });
  });

  it("uses Shanghai local time for same-day due time checks", () => {
    assert.equal(getBusinessTime(new Date("2026-06-11T12:45:00.000Z")), "20:45");
  });
});
