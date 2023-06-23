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
		return this.semaphore.permitsAvailable === 0;
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
	 * [lockWith]{@link lockWith} is the preferred choice.
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
	 * [tryLockWith]{@link tryLockWith} is the preferred choice.
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
	 *
	 * [lockWith]{@link lockWith} or [tryLockWith]{@link tryLockWith} are the preferred choices.
	 */
	public unlock() {
		this.semaphore.release();
	}

	/**
	 * Locks this mutex and run the critical section function
	 * Then, automatically unlocks it.
	 *
	 * @param cs function to run once the locked is acquired (critical section)
	 * @throws {ConcurrencyInterruptedException} when the mutex is interrupted
	 * @returns a Promise after the mutex locked and unlocked and what has been return from `fn`
	 */
	public lockWith<T = void>(cs: () => Promise<T> | T): Promise<T> {
		return Promise.reject(new Error("Not implemented"));
	}

	/**
	 * Locks this mutex within a time limit and run the critical section function
	 * Then, automatically unlocks it.
	 *
	 * @param timeout maximum time (in ms) to lock
	 * @param cs function to run once the locked is acquired (critical section)
	 * @throws {ConcurrencyExceedTimeoutException} when the time limit exceeds
	 * @throws {ConcurrencyInterruptedException} when the mutex is interrupted
	 * @returns a Promise after the mutex locked and unlocked and what has been return from `fn`
	 */
	public tryLockWith<T = void>(timeout: number, cs: () => Promise<T> | T): Promise<T> {
		return Promise.reject(new Error("Not implemented"));
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
