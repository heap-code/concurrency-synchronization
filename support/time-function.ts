/**
 * @param fn the function to time
 * @returns An array with:
 * 	- The elapsed time
 * 	- The value returned from the timed function
 */
export async function timeFunction<T>(fn: () => Promise<T> | T): Promise<[number, T]> {
	const before = performance.now();
	const value = await fn();
	return [performance.now() - before, value];
}
