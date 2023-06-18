/**
 * A synchronizer is an object or class that helps managing concurrency
 */
export interface Synchronizer {
	/**
	 * Interrupts all awaiting "Threads" with an [exception]{@link ConcurrencyInterruptedException}.
	 *
	 * @param reason The reason why this semaphore is being interrupted
	 */
	interrupt: (reason: unknown) => void;

	/**
	 * @returns the number of waiting "Threads" on a locking statement
	 */
	queueLength: number;
}
