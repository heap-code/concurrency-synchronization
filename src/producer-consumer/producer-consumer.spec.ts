import { ProducerConsumerInvalidReadParameterException } from "./exceptions";
import { ProducerConsumer } from "./producer-consumer";
import { sleep } from "../../support/sleep";
import { timeFunction } from "../../support/time-function";
import {
	ConcurrencyExceedTimeoutException,
	ConcurrencyInterruptedException,
	ConcurrencyInvalidTimeoutException
} from "../exceptions";

describe("ProducerConsumer", () => {
	const delay = 60;
	const offsetLow = 5;
	const offset = 15;

	describe("Input validation", () => {
		const prodCons = new ProducerConsumer();

		it("should throw a read parameter exception when reading a negative number of items", async () => {
			for (const nItem of [-1, -10, -100]) {
				await expect(() => prodCons.read(nItem)).rejects.toThrow(
					ProducerConsumerInvalidReadParameterException
				);
			}
		});

		it("should throw a timeout exception when try-reading with negative timeout", async () => {
			for (const timeout of [-1, -10, -100]) {
				await expect(() => prodCons.tryRead(timeout, 1)).rejects.toThrow(
					ConcurrencyInvalidTimeoutException
				);
			}
		});

		it("should throw a read parameter exception when try-reading a negative number of items", async () => {
			for (const nItem of [-1, -10, -100]) {
				await expect(() => prodCons.tryRead(1000, nItem)).rejects.toThrow(
					ProducerConsumerInvalidReadParameterException
				);
			}
		});

		it("should throw a timeout exception when try-reading-one with negative timeout", async () => {
			for (const timeout of [-1, -10, -100]) {
				await expect(() => prodCons.tryReadOne(timeout)).rejects.toThrow(
					ConcurrencyInvalidTimeoutException
				);
			}
		});
	});

	describe("`read` usage", () => {
		it("should read immediately with initial items", async () => {
			const items = [1, "A string", { msg: "An object" }, ["An Array", 1]] as const;

			for (const [i, item] of items.entries()) {
				const n = i + 1;

				const itemsInitial = Array(n).fill(item);

				const prodCons = new ProducerConsumer(itemsInitial);
				expect(prodCons.itemsAvailable).toBe(n);

				const itemsRead = await prodCons.read(n);
				expect(prodCons.itemsAvailable).toBe(0);

				expect(itemsRead).toHaveLength(n);
				expect(itemsRead).toStrictEqual(itemsInitial);
			}
		});

		it("should wait until items are available", async () => {
			const prodCons = new ProducerConsumer<number>();
			const valueWrite = [123, 456];

			setTimeout(() => {
				expect(prodCons.itemsRequired).toBe(2);
				expect(prodCons.queueLength).toBe(1);
				prodCons.write(...valueWrite);
			}, delay);

			const [elapsed, valueRead] = await timeFunction(() => prodCons.read(2));

			expect(prodCons.itemsRequired).toBe(0);
			expect(prodCons.queueLength).toBe(0);
			expect(valueRead).toStrictEqual(valueWrite);

			expect(elapsed).toBeGreaterThanOrEqual(delay - offsetLow);
			expect(elapsed).toBeLessThanOrEqual(delay + offset);
		});
	});

	describe("`tryRead` usage", () => {
		it("should work normally", async () => {
			const prodCons = new ProducerConsumer();
			const [w1, w2] = [1, 2];

			setTimeout(() => {
				expect(prodCons.itemsRequired).toBe(2);
				expect(prodCons.queueLength).toBe(1);
				prodCons.write(w1);

				expect(prodCons.itemsRequired).toBe(1);
				expect(prodCons.queueLength).toBe(1);
			}, delay / 2);

			setTimeout(() => {
				expect(prodCons.itemsRequired).toBe(1);
				expect(prodCons.queueLength).toBe(1);
				prodCons.write(w2);

				expect(prodCons.itemsRequired).toBe(0);
				expect(prodCons.queueLength).toBe(0);
			}, delay);

			const [r1, r2] = await prodCons.tryRead(delay * 2, 2);

			expect(r1).toBe(w1);
			expect(r2).toBe(w2);
		});

		it("should immediately read when there is enough items", async () => {
			const values = [1, 2, 3, 4, 5];
			const [w1, w2, w3, w4, w5] = values;
			const prodCons = new ProducerConsumer(values);

			const [elapsed1, [r1, r2]] = await timeFunction(() => prodCons.tryRead(1, 2));
			const [elapsed2, [r3, r4, r5]] = await timeFunction(() => prodCons.tryRead(1, 3));

			expect(r1).toBe(w1);
			expect(r2).toBe(w2);
			expect(r3).toBe(w3);
			expect(r4).toBe(w4);
			expect(r5).toBe(w5);

			expect(elapsed1).toBeLessThanOrEqual(offset);
			expect(elapsed2).toBeLessThanOrEqual(offset);
		});

		it("should throw an error when the time exceeds", async () => {
			const prodCons = new ProducerConsumer(["a"]);

			setTimeout(() => expect(prodCons.queueLength).toBe(1), delay / 2);
			await expect(() => prodCons.tryRead(delay, 2)).rejects.toThrow(
				ConcurrencyExceedTimeoutException
			);

			// The queue is reset, since the `tryRead` failed
			expect(prodCons.queueLength).toBe(0);
			expect(prodCons.itemsAvailable).toBe(1);
		});

		it('should not "reset" the state after a successful `tryRead`', async () => {
			const prodCons = new ProducerConsumer([1]);

			// "Regular" use
			setTimeout(() => prodCons.write(1), delay / 2);
			await prodCons.tryRead(delay, 2);

			// Ok
			expect(prodCons.itemsAvailable).toBe(0);
			expect(prodCons.queueLength).toBe(0);

			// After the timeout
			await sleep(delay);
			expect(prodCons.itemsAvailable).toBe(0);
			expect(prodCons.queueLength).toBe(0);
		});

		it("should write to other `read` or `tryRead` a when a `tryRead` fails", async () => {
			const prodCons = new ProducerConsumer([1]);

			setTimeout(() => {
				expect(prodCons.itemsAvailable).toBe(0);
				expect(prodCons.itemsRequired).toBe(5);
				expect(prodCons.queueLength).toBe(2);

				prodCons.write(2);
				expect(prodCons.itemsRequired).toBe(4);
				expect(prodCons.queueLength).toBe(2);
			}, delay);

			const [[v1, v2, v3]] = await Promise.all([
				// `read` after the `tryRead`
				sleep(delay / 2).then(() => prodCons.read(3)),

				prodCons
					.tryRead(delay * 2, 3)
					.catch((error: unknown) => {
						if (error instanceof ConcurrencyExceedTimeoutException) {
							return [];
						}

						throw error;
					})
					.finally(() => {
						// The `write` in the `setTimeout` reduced the required items
						// of the second read to 1, so still 0 available
						expect(prodCons.itemsAvailable).toBe(0);
						expect(prodCons.itemsRequired).toBe(1);
						expect(prodCons.queueLength).toBe(1);

						setTimeout(() => prodCons.write(3, 4), delay);
					})
			]);

			// The state is reset: 3 items written for a single successful read (+ the initial item)
			expect(prodCons.itemsAvailable).toBe(1);
			expect(prodCons.itemsRequired).toBe(0);
			expect(prodCons.queueLength).toBe(0);

			expect(v1).toBe(1);
			expect(v2).toBe(2);
			expect(v3).toBe(3);

			expect(await prodCons.readOne()).toBe(4);
		});
	});

	describe("`readOne` usage", () => {
		it("should read immediately with initial items", async () => {
			const items = [1, "A string", { msg: "An object" }, ["An Array", 1]] as const;

			for (const item of items) {
				const prodCons = new ProducerConsumer([item]);
				expect(prodCons.itemsAvailable).toBe(1);

				const itemRead = await prodCons.readOne();
				expect(prodCons.itemsAvailable).toBe(0);

				expect(itemRead).toStrictEqual(item);
			}
		});

		it("should wait until an item is available", async () => {
			const prodCons = new ProducerConsumer<number>();
			const valueWrite = 123;

			setTimeout(() => {
				expect(prodCons.itemsRequired).toBe(1);
				expect(prodCons.queueLength).toBe(1);
				prodCons.write(valueWrite);
			}, delay);

			const [elapsed, valueRead] = await timeFunction(() => prodCons.readOne());

			expect(prodCons.itemsRequired).toBe(0);
			expect(prodCons.queueLength).toBe(0);
			expect(valueRead).toStrictEqual(valueWrite);

			expect(elapsed).toBeGreaterThanOrEqual(delay - offsetLow);
			expect(elapsed).toBeLessThanOrEqual(delay + offset);
		});
	});

	describe("`tryReadOne` usage", () => {
		it("should work normally", async () => {
			const prodCons = new ProducerConsumer();
			const [w1, w2] = [1, 2];

			setTimeout(() => {
				expect(prodCons.itemsRequired).toBe(2);
				expect(prodCons.queueLength).toBe(2);
				prodCons.write(w1);

				expect(prodCons.itemsRequired).toBe(1);
				expect(prodCons.queueLength).toBe(1);
			}, delay / 2);

			setTimeout(() => {
				expect(prodCons.itemsRequired).toBe(1);
				expect(prodCons.queueLength).toBe(1);
				prodCons.write(w2);

				expect(prodCons.itemsRequired).toBe(0);
				expect(prodCons.queueLength).toBe(0);
			}, delay);

			const [r1, r2] = await Promise.all([
				prodCons.tryReadOne(delay * 2),
				prodCons.tryReadOne(delay * 2)
			]);

			expect(r1).toBe(w1);
			expect(r2).toBe(w2);
		});

		it("should immediately read when there is enough items", async () => {
			const values = [1, 2];
			const [w1, w2] = values;
			const prodCons = new ProducerConsumer(values);

			const [elapsed1, r1] = await timeFunction(() => prodCons.tryReadOne(1));
			const [elapsed2, r2] = await timeFunction(() => prodCons.tryReadOne(1));

			expect(r1).toBe(w1);
			expect(r2).toBe(w2);

			expect(elapsed1).toBeLessThanOrEqual(offset);
			expect(elapsed2).toBeLessThanOrEqual(offset);
		});

		it("should throw an error when the time exceeds", async () => {
			const prodCons = new ProducerConsumer();

			setTimeout(() => {
				expect(prodCons.itemsAvailable).toBe(0);
				expect(prodCons.itemsRequired).toBe(1);
				expect(prodCons.queueLength).toBe(1);
			}, delay / 2);
			await expect(() => prodCons.tryReadOne(delay)).rejects.toThrow(
				ConcurrencyExceedTimeoutException
			);

			// The queue is reset, since the `tryReadOne` failed
			expect(prodCons.itemsAvailable).toBe(0);
			expect(prodCons.itemsRequired).toBe(0);
			expect(prodCons.queueLength).toBe(0);
		});

		it('should not "reset" the state after a successful `tryRead`', async () => {
			const prodCons = new ProducerConsumer<number>();

			// "Regular" use
			setTimeout(() => prodCons.write(1), delay / 2);
			await prodCons.tryReadOne(delay);

			// Ok
			expect(prodCons.itemsAvailable).toBe(0);
			expect(prodCons.queueLength).toBe(0);

			// After the timeout
			await sleep(delay);
			expect(prodCons.itemsAvailable).toBe(0);
			expect(prodCons.queueLength).toBe(0);
		});
	});

	it("should interrupt all", async () => {
		const delay = 80;
		const prodCons = new ProducerConsumer<number>();
		const reason = "test";

		setTimeout(() => {
			expect(prodCons.itemsAvailable).toBe(0);
			expect(prodCons.queueLength).toBe(4);
			prodCons.interrupt(reason, [1, 2, 3]);
		}, delay);

		const errors = await Promise.all([
			prodCons.readOne().catch((err: unknown) => err),
			prodCons.read(2).catch((err: unknown) => err),
			prodCons.tryReadOne(delay * 10).catch((err: unknown) => err),
			prodCons.tryRead(delay * 10, 6).catch((err: unknown) => err)
		]);

		for (const error of errors) {
			expect(error).toBeInstanceOf(ConcurrencyInterruptedException);
			expect((error as ConcurrencyInterruptedException).getReason()).toBe(reason);
		}

		expect(prodCons.itemsAvailable).toBe(3);
		expect(prodCons.queueLength).toBe(0);

		// Same but without items
		setTimeout(() => {
			prodCons.interrupt(reason);
		}, delay);

		await Promise.all([prodCons.read(5), prodCons.read(5)]).catch(() => void 0);

		expect(prodCons.itemsAvailable).toBe(0);
		expect(prodCons.queueLength).toBe(0);
	});
});
