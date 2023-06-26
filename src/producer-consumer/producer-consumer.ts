import { ProducerConsumerInvalidReadParameterException } from "./exceptions";
import { Semaphore } from "../semaphore";
import { Synchronizer } from "../synchronizer.interface";

/**
 * A ProducerConsumer class to read and write data with synchronization.
 *
 * The queue is a simple FIFO (First In, First Out).
 */
export class ProducerConsumer<T> implements Synchronizer {
	/**
	 * The that will be read and write
	 */
	private readonly items: T[];
	/**
	 * The internal semaphore for synchronization
	 */
	private readonly semaphore: Semaphore;

	// With a mutex around `items`, it'll look like a Monitor pattern

	/**
	 * @returns the current number of available items
	 */
	public get itemsAvailable() {
		return this.semaphore.permitsAvailable;
	}

	/**
	 * @returns the minimal number of items needed to release all "threads"
	 */
	public get itemsRequired(): number {
		return this.semaphore.permitsRequired;
	}

	/**
	 * @returns the number of waiting "threads" on any read
	 */
	public get queueLength(): number {
		return this.semaphore.queueLength;
	}

	/**
	 * Create a ProducerConsumer
	 *
	 * @param initialItems the initial available values
	 */
	public constructor(initialItems: readonly T[] = []) {
		this.items = initialItems.slice();
		this.semaphore = new Semaphore(initialItems.length);
	}

	/**
	 * Reads a given number of items:
	 * Wait until the given number of items are available.
	 *
	 * @param nItem the number of items to read
	 * @throws {ProducerConsumerInvalidReadParameterException} when the number of items to read is invalid
	 * @throws {ConcurrencyInterruptedException} when the producer-consumer is interrupted
	 * @returns a promise with the read results
	 */
	public async read(nItem: number): Promise<T[]> {
		if (nItem < 0) {
			throw new ProducerConsumerInvalidReadParameterException(
				"Can not read a negative number of items."
			);
		}

		await this.semaphore.acquire(nItem);
		return this.items.splice(0, nItem);
	}

	/**
	 * Reads one item:
	 * Wait until the item is available.
	 *
	 * @throws {ConcurrencyInterruptedException} when the producer-consumer is interrupted
	 * @returns a promise with the read results
	 */
	public readOne(): Promise<T> {
		return this.read(1).then(([item]) => item);
	}

	/**
	 * Reads a given number of items:
	 * Wait until the given number of items are available.
	 *
	 * Throws an error if the given time exceeds
	 * and re-establish the state as if the method was not called.
	 *
	 * @param timeout maximum time (in ms) to read the items
	 * @param nItem the number of items to read
	 * @throws {ProducerConsumerInvalidReadParameterException} when the number of items to read is invalid
	 * @throws {ConcurrencyInterruptedException} when the producer-consumer is interrupted
	 * @returns a promise with the read results
	 */
	public async tryRead(timeout: number, nItem: number): Promise<T[]> {
		if (nItem < 0) {
			throw new ProducerConsumerInvalidReadParameterException(
				"Can not read a negative number of items."
			);
		}

		await this.semaphore.tryAcquire(timeout, nItem);
		return this.items.splice(0, nItem);
	}

	/**
	 * Reads one item:
	 * Wait until the item is available.
	 *
	 * Throws an error if the given time exceeds
	 * and re-establish the state as if the method was not called.
	 *
	 * @param timeout maximum time (in ms) to read the items
	 * @throws {ConcurrencyInterruptedException} when the producer-consumer is interrupted
	 * @returns a promise with the read result
	 */
	public tryReadOne(timeout: number): Promise<T> {
		return this.tryRead(timeout, 1).then(([item]) => item);
	}

	/**
	 * Write some items to the producer-consumer buffer.
	 * It releases the await readings or store the data for future readings.
	 *
	 * @param items the items to write
	 */
	public write(...items: T[]) {
		this.items.push(...items);
		this.semaphore.release(items.length);
	}

	/**
	 * Interrupts all awaiting "threads" with an [exception]{@link ConcurrencyInterruptedException}.
	 *
	 * @param reason The reason why this producer-consumer is being interrupted
	 * @param items the items to set once everything has been interrupted
	 */
	public interrupt(reason: unknown, items: readonly T[] = []) {
		// Remove all content
		this.items.splice(0, this.items.length);
		// Set the items
		this.items.push(...items);

		this.semaphore.interrupt(reason, items.length);
	}
}
