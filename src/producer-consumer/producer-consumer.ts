import { Synchronizer } from "../synchronizer.interface";

export class ProducerConsumer<T> implements Synchronizer {
	/**
	 * The data available for instant reading
	 */
	private readonly items: T[];

	/**
	 * @returns the current number of available items
	 */
	public get itemsAvailable() {
		return this.items.length;
	}

	/**
	 * @returns the minimal number of items needed to release all "threads"
	 */
	public get itemsRequired(): number {
		throw new Error("Not implemented yet");
	}

	/**
	 * @returns the number of waiting "threads" on any read
	 */
	public get queueLength(): number {
		throw new Error("Not implemented yet");
	}

	/**
	 * Create a ProducerConsumer
	 *
	 * @param initialItems the initial available values
	 */
	public constructor(initialItems: readonly T[] = []) {
		this.items = initialItems.slice();
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
	public read(nItem: number): Promise<T[]> {
		throw new Error("Not implemented yet");
	}

	/**
	 * Reads one item:
	 * Wait until the item is available.
	 *
	 * @throws {ConcurrencyInterruptedException} when the producer-consumer is interrupted
	 * @returns a promise with the read results
	 */
	public readOne(): Promise<T> {
		return this.read(1).then(([data]) => data);
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
	public tryRead(timeout: number, nItem: number): Promise<T[]> {
		throw new Error("Not implemented yet");
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
		return this.tryRead(timeout, 1).then(([data]) => data);
	}

	/**
	 * Write some items to the producer-consumer buffer.
	 * It releases the await readings or store the data.
	 *
	 * @param items the items to write
	 */
	public write(...items: T[]) {
		throw new Error("Not implemented yet");
	}

	/**
	 * Interrupts all awaiting "threads" with an [exception]{@link ConcurrencyInterruptedException}.
	 *
	 * @param reason The reason why this producer-consumer is being interrupted
	 * @param items the items to set once everything has been interrupted
	 */
	public interrupt(reason: unknown, items: readonly T[] = []) {
		throw new Error("Not implemented yet");
	}
}
