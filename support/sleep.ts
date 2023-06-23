/**
 * Sleep an amount of time
 *
 * @param time to sleep (in ms)
 * @returns a Promise after the sleep time
 */
export function sleep(time: number) {
	return new Promise(resolve => setTimeout(resolve, time));
}
