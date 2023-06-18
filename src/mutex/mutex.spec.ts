import { Mutex } from "./mutex";
import { timeFunction } from "../../support/time-function";
import {
	ConcurrencyExceedTimeoutException,
	ConcurrencyInterruptedException,
	ConcurrencyInvalidTimeoutException
} from "../exceptions";

describe("Mutex", () => {
	describe("Input validation", () => {
		const mutex = new Mutex();

		it("should throw a timeout exception when try-locking negative timeout", async () => {
			for (const timeout of [-1, -10, -100]) {
				await expect(() => mutex.tryLock(timeout)).rejects.toThrow(
					ConcurrencyInvalidTimeoutException
				);
			}
		});
	});

	describe("`lock` usage", () => {
		const delay = 50;
		const offset = 3;

		it("should work with a basic usage", async () => {
			// semaphore as a mutex
			const mutex = new Mutex();

			expect(mutex.isLocked).toBeFalse();
			expect(mutex.queueLength).toBe(0);

			const [elapsed] = await timeFunction(async () => {
				setTimeout(() => {
					expect(mutex.isLocked).toBeTrue();
					expect(mutex.queueLength).toBe(1);
					mutex.unlock();
					expect(mutex.isLocked).toBeFalse();
					expect(mutex.queueLength).toBe(0);
				}, delay);

				// Will wait until the end of the `setTimeout`
				await mutex.lock();
			});

			expect(elapsed).toBeGreaterThanOrEqual(delay - offset);
			expect(elapsed).toBeLessThanOrEqual(delay + offset);
		});

		it("should work with many lock", async () => {
			const mutex = new Mutex();

			const min = delay / 2;
			const med = delay;
			const max = delay * 2;

			setTimeout(() => {
				expect(mutex.isLocked).toBeTrue();
				expect(mutex.queueLength).toBe(3);
				mutex.unlock();
				expect(mutex.isLocked).toBeTrue();
				expect(mutex.queueLength).toBe(2);
			}, min);

			setTimeout(() => {
				expect(mutex.isLocked).toBeTrue();
				expect(mutex.queueLength).toBe(2);
				mutex.unlock();
				expect(mutex.isLocked).toBeTrue();
				expect(mutex.queueLength).toBe(1);
			}, med);

			setTimeout(() => {
				expect(mutex.isLocked).toBeTrue();
				expect(mutex.queueLength).toBe(1);
				mutex.unlock();
				expect(mutex.isLocked).toBeFalse();
				expect(mutex.queueLength).toBe(0);
			}, max);

			const [elapsed, times] = await timeFunction(() =>
				Promise.all([
					timeFunction(() => mutex.lock()),
					timeFunction(() => mutex.lock()),
					timeFunction(() => mutex.lock())
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

			expect(mutex.isLocked).toBeFalse();
			expect(mutex.queueLength).toBe(0);
		});
	});

	describe("`tryLock` usage", () => {
		const delay = 50;
		const offset = 3;

		it("should work with tryLock/unlock", async () => {
			const mutex = new Mutex();

			const [elapsed] = await timeFunction(async () => {
				setTimeout(() => mutex.unlock(), delay);
				await mutex.tryLock(delay * 5);
			});

			expect(elapsed).toBeGreaterThanOrEqual(delay - offset);
			expect(elapsed).toBeLessThanOrEqual(delay + offset);
		});

		it("should thrown an error when the time exceeds", async () => {
			const mutex = new Mutex();

			setTimeout(() => {
				expect(mutex.queueLength).toBe(1);
				expect(mutex.isLocked).toBeTrue();
			}, delay / 2);

			await expect(() => mutex.tryLock(delay)).rejects.toThrow(
				ConcurrencyExceedTimeoutException
			);

			// The queue is reset, since the `tryAcquire` failed
			expect(mutex.queueLength).toBe(0);
			expect(mutex.isLocked).toBeFalse();
		});
	});

	it("should interrupt all", async () => {
		const delay = 100;
		const mutex = new Mutex();
		const reason = "test";

		setTimeout(() => {
			expect(mutex.isLocked).toBeTrue();
			expect(mutex.queueLength).toBe(3);
			mutex.interrupt(reason);
		}, delay);

		const errors = await Promise.all([
			mutex.lock().catch((err: unknown) => err),
			mutex.tryLock(delay * 2).catch((err: unknown) => err),
			mutex.lock().catch((err: unknown) => err)
		]);

		for (const error of errors) {
			expect(error).toBeInstanceOf(ConcurrencyInterruptedException);
			expect((error as ConcurrencyInterruptedException).getReason()).toBe(reason);
		}

		expect(mutex.isLocked).toBeFalse();
		expect(mutex.queueLength).toBe(0);
	});
});
