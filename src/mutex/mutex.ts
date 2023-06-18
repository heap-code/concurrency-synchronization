import { Semaphore } from "../semaphore";
import { Synchronizer } from "../synchronizer.interface";

/**
 * A mutex to manage "concurrency in Javascript" (as mentioned in the mozilla documentation).
 *
 * Implementation's note: the mutex simply use an internal semaphore.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#promise_concurrency
 */
export class Mutex implements Synchronizer {
	/**
	 * The internal semaphore for mutex implementation
	 */
	private readonly semaphore = new Semaphore(1);

	/**
	 * @returns if the current mutex is currently locked
	 */
	public get isLocked(): boolean {
		return this.queueLength !== 0;
	}

	/**
	 * @inheritDoc
	 */
	public get queueLength(): number {
		return this.semaphore.queueLength;
	}

	/**
	 * Locks this mutex
	 *
	 * @throws {ConcurrencyInterruptedException} when the mutex is interrupted
	 * @returns a promise when the lock has been set
	 */
	public lock(): Promise<void> {
		return this.semaphore.acquire(1);
	}

	/**
	 * Locks this mutex within a time limit
	 *
	 * Throws an error if the given time exceeds
	 *
	 * @param timeout maximum time (in ms) to lock
	 * @throws {ConcurrencyExceedTimeoutException} when the time limit exceeds
	 * @throws {ConcurrencyInterruptedException} when the mutex is interrupted
	 * @returns a promise when the lock has been set
	 */
	public tryLock(timeout: number): Promise<void> {
		return this.semaphore.tryAcquire(timeout, 1);
	}

	/**
	 * Unlocks this mutex
	 */
	public unlock() {
		this.semaphore.release();
	}

	/**
	 * Interrupts all awaiting "Threads" with an [exception]{@link ConcurrencyInterruptedException}.
	 *
	 * @param reason The reason why this mutex is being interrupted
	 */
	public interrupt(reason: unknown) {
		this.semaphore.interrupt(reason, 1);
	}
}
