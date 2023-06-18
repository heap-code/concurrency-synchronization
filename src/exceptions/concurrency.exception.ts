/**
 * Exception error occurring with any of the concurrency classes.
 */
export abstract class ConcurrencyException extends Error {
	/**
	 * Creates a concurrency exception
	 *
	 * @param props The parameters to send to the [error]{@link error} superclass.
	 */
	public constructor(...props: Parameters<ErrorConstructor>) {
		super(...props);

		// inspired from: https://stackoverflow.com/a/48342359
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
