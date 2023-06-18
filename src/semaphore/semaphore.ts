import { SemaphoreInvalidPermitsException } from "./exceptions";
import {
	ConcurrencyExceedTimeoutException,
	ConcurrencyInvalidTimeoutException
} from "../exceptions";
import { ConcurrencyInterruptedException } from "../exceptions";
import { Synchronizer } from "../synchronizer.interface";

type Resolver = () => void;

/**
 * An item is a "thread" waiting to be unlocked
 */
interface QueueItem {
	/**
	 * The function that rejects a waiting "thread".
	 *
	 * @param reason why the item is rejected
	 */
	reject: (reason: unknown) => void;
	/**
	 * Array of resolvers, waiting to be resolved (release)
	 */
	resolvers: Resolver[];
}

/**
 * A semaphore to manage "concurrency in Javascript" (as mentioned in the mozilla documentation).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#promise_concurrency
 */
export class Semaphore implements Synchronizer {
	/**
	 * Queue of the "threads"
	 */
	private readonly queue: QueueItem[] = [];

	/**
	 * @returns the current number of available permits
	 */
	public get permitsAvailable() {
		return this.permits;
	}

	/**
	 * @returns the minimal number of permits needed to release all "Threads"
	 */
	public get permitsRequired() {
		return this.queue.reduce((total, { resolvers }) => total + resolvers.length, 0);
	}

	/**
	 * @returns the number of waiting "Threads" on an acquire or tryAcquire (!= number of permits awaited)
	 */
	public get queueLength() {
		return this.queue.length;
	}

	/**
	 * Creates a Semaphore
	 *
	 * @param permits the initials permits
	 * @throws {SemaphoreInvalidPermitsException} when the `permits` value is invalid
	 */
	public constructor(private permits = 1) {
		if (permits < 0) {
			throw new SemaphoreInvalidPermitsException(
				`Permits must be >= to 0. '${permits}' given.`
			);
		}
	}

	/**
	 * Acquires an amount of permits:
	 * Wait until the given number of permits is available.
	 *
	 * @param permits The number of permits to acquire (0 acquire immediately)
	 * @throws {SemaphoreInvalidPermitsException} when the `permits` value is invalid
	 * @returns a promise when the permits have been acquired
	 */
	public acquire(permits = 1): Promise<void> {
		if (permits < 0) {
			return Promise.reject(
				new SemaphoreInvalidPermitsException("Cannot acquire negative permits")
			);
		}

		// Use existing permits
		while (this.permits > 0 && permits) {
			--this.permits;
			--permits;
		}

		if (permits === 0) {
			// Nothing to wait
			return Promise.resolve();
		}

		return this.acquireLock(permits);
	}

	/**
	 * Acquires a given amount of permits:
	 * Wait until the given number of permits is available.
	 *
	 * Throws an error if the given time exceeds
	 * and re-establish the state as if the method was not called.
	 *
	 * @param timeout maximum time (in ms) to acquire the permits
	 * @param permits The number of permits to acquire (0 acquire immediately)
	 * @throws {ConcurrencyExceedTimeoutException} when the `timeout` value is invalid
	 * @throws {SemaphoreInvalidPermitsException} when the `permits` value is invalid
	 * @returns a promise when the permits have been acquired
	 */
	public tryAcquire(timeout: number, permits = 1): Promise<void> {
		if (timeout < 0) {
			return Promise.reject(
				new ConcurrencyInvalidTimeoutException("Cannot acquire with a negative timeout")
			);
		}
		if (permits < 0) {
			return Promise.reject(
				new SemaphoreInvalidPermitsException("Cannot acquire negative permits")
			);
		}

		// Enough permits available at the time -> use them all (also works for 0 permits)
		if (permits <= this.permits) {
			this.permits -= permits;
			return Promise.resolve();
		}

		const permitsRemaining = permits - this.permits;

		// Remove all available permits
		const permitsBck = this.permits;
		this.permits = 0;

		return this.acquireLock(permitsRemaining, item => {
			const { reject, resolvers } = item;

			setTimeout(() => {
				// Re-establish th permits: the previous permits + the releases that were called during the wait
				this.permits += permitsBck + (permitsRemaining - resolvers.length);

				// Removes the item form the queue
				const index = this.queue.findIndex(i => i === item);
				if (index >= 0) {
					// TODO: prettier
					this.queue.splice(index, 1);
				}

				reject(
					new ConcurrencyExceedTimeoutException(
						`Timeout of ${timeout}ms exceed when acquiring.`
					)
				);
			}, timeout);
		});
	}

	/**
	 * Release a given amount of permits.
	 *
	 * @param permits The number of permits to release (0 does nothing)
	 * @throws {SemaphoreInvalidPermitsException} when the `permits` value is invalid
	 */
	public release(permits = 1) {
		if (permits < 0) {
			throw new SemaphoreInvalidPermitsException("Cannot release negative permits");
		}

		if (permits === 0) {
			return;
		}

		if (this.queue.length) {
			const [{ resolvers }] = this.queue;

			// Remove the first element and call it
			resolvers.splice(0, 1)[0]();

			if (!resolvers.length) {
				// Remove the first element
				this.queue.splice(0, 1);
			}
		} else {
			++this.permits;
		}

		this.release(permits - 1);
	}

	/**
	 * Releases all awaiting "Threads".
	 *
	 * @param permits The permits to set to this semaphore once everything has been released
	 * @throws {SemaphoreInvalidPermitsException} when the `permits` value is invalid
	 * @see {interrupt} to throw an exception
	 */
	public releaseAll(permits = 0) {
		if (permits < 0) {
			throw new SemaphoreInvalidPermitsException("Cannot set negative permits");
		}

		// Empty the queue and resolve everything
		for (const resolver of this.queue.splice(0).flatMap(({ resolvers }) => resolvers)) {
			resolver();
		}

		this.permits = permits;
	}

	/**
	 * Interrupts all awaiting "Threads" with an [exception]{@link ConcurrencyInterruptedException}.
	 *
	 * @param reason The reason why this semaphore is being interrupted
	 * @param permits The permits to set to this semaphore once everything has been interrupted
	 * @throws {SemaphoreInvalidPermitsException} when the `permits` value is invalid
	 * @see {releaseAll} to not throw an exception
	 */
	public interrupt(reason: unknown, permits = 0) {
		if (permits < 0) {
			throw new SemaphoreInvalidPermitsException("Cannot set negative permits");
		}

		const exception = new ConcurrencyInterruptedException(
			reason,
			"The semaphore has been interrupted."
		);

		// Empty the queue and reject everything
		for (const { reject } of this.queue.splice(0)) {
			reject(exception);
		}

		this.permits = permits;
	}

	/**
	 * @param permits the permits to obtain
	 * @param afterInit after the blocking promise resolver has been set but still in the promise body
	 * @returns the added item to the queue
	 */
	private acquireLock(permits: number, afterInit?: (item: QueueItem) => void) {
		return new Promise<void>((resolve, reject) => {
			const resolvers: Resolver[] = [];

			// `void` as none of the promises use `reject`
			void Promise.all(
				Array(permits)
					.fill(null)
					.map(() => new Promise<void>(resolve => resolvers.push(resolve)))
			).then(() => resolve());

			const item: QueueItem = { reject, resolvers };
			// Add to the queue.
			// The queue is emptied in the `release` process.
			this.queue.push(item);

			if (afterInit) {
				afterInit(item);
			}
		});
	}
}
