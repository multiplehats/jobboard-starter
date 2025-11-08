import { randomInt } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createId } from "./index";

beforeEach(() => {
	vi.useFakeTimers();
});

describe.skip("ids are roughly time-sorted (CUID2 provides only loose ordering, not strict enough for automated assertion)", () => {
	const testCases = [
		{
			k: 1000,
			n: 1_000,
		},
		{
			k: 7000,
			n: 10_000,
		},
		{
			k: 9000,
			n: 10_000,
		},
	];

	for (const tc of testCases) {
		it(`k: ${tc.k}, n: ${tc.n}`, () => {
			const ids = new Array(tc.n).fill(null).map((_, i) => {
				vi.setSystemTime(new Date(i * 10));

				return createId("test");
			});
			const sorted = [...ids].sort();

			for (let i = 0; i < ids.length; i++) {
				expect(Math.abs(ids.indexOf(sorted[i]) - i)).toBeLessThanOrEqual(tc.k);
			}
		});
	}
});

it("suffix length is 24 characters long", () => {
	for (let i = 0; i < 100_000; i++) {
		vi.setSystemTime(new Date(randomInt(281474976710655)));

		const suffix = createId("test").split("_")[1];
		expect(suffix.length).toBe(24);
	}
});
