import { ConcurrencyException } from "./concurrency.exception";

/**
 * Exception when a synchronization class is interrupted
 */
export class ConcurrencyInterruptedException extends ConcurrencyException {
	/**
	 * Creates an exception when a synchronization class is interrupted
	 *
	 * @param reason The reason of the interruption
	 * @param message An optional message for the exception
	 */
	public constructor(
		private readonly reason: unknown,
		message?: string
	) {
		super(message);
	}

	/**
	 * @returns an additional information about the interruption
	 */
	public getReason<T>(): T {
		return this.reason as T;
	}
}
