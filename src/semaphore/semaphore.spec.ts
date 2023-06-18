import {
	SemaphoreAcquireTimeoutException,
	SemaphoreInvalidPermitsException,
	SemaphoreInvalidTimeoutException
} from "./exceptions";
import { Semaphore } from "./semaphore";
import { timeFunction } from "../../support/time-function";
import { ConcurrencyInterruptedException } from "../exceptions";

describe("Semaphore", () => {
	describe("Constructor", () => {
		it("should create an instance", () => {
			for (const permits of [1, 10, 100]) {
				expect(() => new Semaphore(permits)).not.toThrow();
			}
		});

		it("should throw a permit exception", () => {
			for (const permits of [-1, -10, -100]) {
				expect(() => new Semaphore(permits)).toThrow(SemaphoreInvalidPermitsException);
			}
		});
	});

	describe("Input validation", () => {
		const semaphore = new Semaphore(1000);

		it("should throw a permit exception when acquiring negative permits", async () => {
			for (const permits of [-1, -10, -100]) {
				await expect(() => semaphore.acquire(permits)).rejects.toThrow(
					SemaphoreInvalidPermitsException
				);
			}
		});

		it("should throw a permit exception when try-acquiring negative permits", async () => {
			for (const permits of [-1, -10, -100]) {
				await expect(() => semaphore.tryAcquire(1000, permits)).rejects.toThrow(
					SemaphoreInvalidPermitsException
				);
			}
		});

		it("should throw a timeout exception when try-acquiring negative timeout", async () => {
			for (const timeout of [-1, -10, -100]) {
				await expect(() => semaphore.tryAcquire(timeout)).rejects.toThrow(
					SemaphoreInvalidTimeoutException
				);
			}
		});

		it("should throw a permit exception when releasing negative permits", () => {
			for (const permits of [-1, -10, -100]) {
				expect(() => semaphore.release(permits)).toThrow(SemaphoreInvalidPermitsException);
			}
		});
	});

	describe("`acquire` usage", () => {
		const delay = 50;
		const offset = 3;

		it("should work with a single initial permit", async () => {
			// semaphore as a mutex
			const semaphore = new Semaphore(1);

			// Immediate acquire
			expect(semaphore.permitsAvailable).toBe(1);
			expect(semaphore.queueLength).toBe(0);
			await semaphore.acquire();
			expect(semaphore.permitsAvailable).toBe(0);
			expect(semaphore.queueLength).toBe(0);

			const [elapsed] = await timeFunction(async () => {
				setTimeout(() => {
					expect(semaphore.permitsAvailable).toBe(0);
					expect(semaphore.queueLength).toBe(1);
					semaphore.release();
					expect(semaphore.permitsAvailable).toBe(0);
					expect(semaphore.queueLength).toBe(0);
				}, delay);

				// Will wait until the end of the `setTimeout`
				await semaphore.acquire();
			});

			expect(elapsed).toBeGreaterThanOrEqual(delay - offset);
			expect(elapsed).toBeLessThanOrEqual(delay + offset);

			semaphore.release();
			expect(semaphore.permitsAvailable).toBe(1);
			expect(semaphore.queueLength).toBe(0);
			await semaphore.acquire();
			expect(semaphore.permitsAvailable).toBe(0);
			expect(semaphore.queueLength).toBe(0);
		});

		it("should with no initial permit", async () => {
			const semaphore = new Semaphore(0);

			expect(semaphore.permitsAvailable).toBe(0);

			expect(semaphore.queueLength).toBe(0);

			const [elapsed] = await timeFunction(async () => {
				setTimeout(() => {
					expect(semaphore.permitsRequired).toBe(1);
					semaphore.release();
				}, delay);
				await semaphore.acquire();
			});

			expect(elapsed).toBeGreaterThanOrEqual(delay - offset);
			expect(elapsed).toBeLessThanOrEqual(delay + offset);
		});

		it("should work with many initial acquires/releases", async () => {
			for (const permits of [5, 8, 13]) {
				const semaphore = new Semaphore(permits);

				const [elapsed] = await timeFunction(async () => {
					const permitOffset = 2 + Math.floor(Math.random() * 10);
					setTimeout(() => semaphore.release(permitOffset), delay);
					await semaphore.acquire(permits + permitOffset);
				});

				expect(elapsed).toBeGreaterThanOrEqual(delay - offset);
				expect(elapsed).toBeLessThanOrEqual(delay + offset);
			}
		});

		it('"parallel" and un-synchronized releases', async () => {
			const semaphore = new Semaphore(0);

			const min = delay / 2;
			const med = delay;
			const max = delay * 2;

			setTimeout(() => semaphore.release(), delay);
			setTimeout(() => semaphore.release(), delay / 2);
			setTimeout(() => semaphore.release(), delay * 2);

			// global elapsed of the operation and the times of the individual acquires
			const [elapsed, times] = await timeFunction(() =>
				Promise.all([
					timeFunction(() => semaphore.acquire()),
					timeFunction(() => semaphore.acquire()),
					timeFunction(() => semaphore.acquire())
				])
			);

			const [elapsed1, elapsed2, elapsed3] = times
				.map(([elapsed]) => elapsed)
				.sort((a, b) => a - b);

			expect(elapsed1).toBeGreaterThanOrEqual(min - offset);
			expect(elapsed1).toBeLessThanOrEqual(min + offset);
			expect(elapsed2).toBeGreaterThanOrEqual(med - offset);
			expect(elapsed2).toBeLessThanOrEqual(med + offset);
			expect(elapsed3).toBeGreaterThanOrEqual(max - offset);
			expect(elapsed3).toBeLessThanOrEqual(max + offset);

			// The global elapsed time is very close to the slowest timeout
			expect(elapsed).toBeGreaterThanOrEqual(max - offset);
			expect(elapsed).toBeLessThanOrEqual(max + offset);

			expect(elapsed).toBeGreaterThanOrEqual(elapsed3);
		});
	});

	describe("`tryAcquire` usage", () => {
		const delay = 50;
		const offset = 3;

		it("should work with many initial tryAcquires/releases", async () => {
			for (const permits of [5, 8, 13]) {
				const semaphore = new Semaphore(permits);

				const [elapsed] = await timeFunction(async () => {
					const permitOffset = 2 + Math.floor(Math.random() * 10);
					setTimeout(() => semaphore.release(permitOffset), delay);
					await semaphore.tryAcquire(delay * 5, permits + permitOffset);
				});

				expect(elapsed).toBeGreaterThanOrEqual(delay - offset);
				expect(elapsed).toBeLessThanOrEqual(delay + offset);
			}
		});

		it("should thrown an error when the time exceeds", async () => {
			const semaphore = new Semaphore(0);

			// The queue has 1 element
			setTimeout(() => expect(semaphore.queueLength).toBe(1), delay / 2);

			await expect(() => semaphore.tryAcquire(delay)).rejects.toThrow(
				SemaphoreAcquireTimeoutException
			);

			// The queue is reset, since the `tryAcquire` failed
			expect(semaphore.queueLength).toBe(0);
			expect(semaphore.permitsAvailable).toBe(0);
		});

		it("should thrown an error and reset state when the time exceeds (many releases)", async () => {
			const semaphore = new Semaphore(2);

			setTimeout(() => {
				// Only one waiting, not 3 (!= permits)
				expect(semaphore.queueLength).toBe(1);
				expect(semaphore.permitsAvailable).toBe(0);

				// A release does not change the public values
				semaphore.release();
				expect(semaphore.queueLength).toBe(1);
				expect(semaphore.permitsAvailable).toBe(0);
			}, delay / 2);

			await expect(() => semaphore.tryAcquire(delay, 4)).rejects.toThrow(
				SemaphoreAcquireTimeoutException
			);

			// The queue is reset, since the `tryAcquire` failed (would have been cleared even on success)
			expect(semaphore.queueLength).toBe(0);
			expect(semaphore.permitsAvailable).toBe(3); // the release in the timeout
		});
	});

	it("should release all", async () => {
		const delay = 100;
		const semaphore = new Semaphore(2);

		setTimeout(() => {
			expect(semaphore.permitsAvailable).toBe(0);
			expect(semaphore.permitsRequired).toBe(8);
			expect(semaphore.queueLength).toBe(3);
			semaphore.releaseAll(4);
		}, delay);

		await Promise.all([
			semaphore.acquire(3),
			semaphore.tryAcquire(delay * 10, 6),
			semaphore.acquire()
		]);

		expect(semaphore.permitsAvailable).toBe(4);
		expect(semaphore.queueLength).toBe(0);
	});

	it("should interrupt all", async () => {
		const delay = 100;
		const semaphore = new Semaphore(2);
		const reason = "test";

		setTimeout(() => {
			expect(semaphore.permitsAvailable).toBe(0);
			expect(semaphore.queueLength).toBe(3);
			semaphore.interrupt(reason, 3);
		}, delay);

		const errors = await Promise.all([
			semaphore.acquire(3).catch((err: unknown) => err),
			semaphore.tryAcquire(delay * 10, 6).catch((err: unknown) => err),
			semaphore.acquire().catch((err: unknown) => err)
		]);

		for (const error of errors) {
			expect(error).toBeInstanceOf(ConcurrencyInterruptedException);
			expect((error as ConcurrencyInterruptedException).getReason()).toBe(reason);
		}

		expect(semaphore.permitsAvailable).toBe(3);
		expect(semaphore.queueLength).toBe(0);
	});
});
