import { Synchronizer } from "../synchronizer.interface";

export class Mutex implements Synchronizer {
	/**
	 * @returns if the current mutex is currently locked
	 */
	public get isLocked(): boolean {
		throw new Error("Not implemented yet");
	}

	/**
	 * @inheritDoc
	 */
	public get queueLength(): number {
		throw new Error("Not implemented yet");
	}

	/**
	 * Locks this mutex
	 *
	 * @returns a promise when the lock has been set
	 */
	public lock(): Promise<void> {
		throw new Error("Not implemented yet");
	}

	/**
	 * Locks this mutex within a time limit.
	 *
	 * Throws an error if the given time exceeds.
	 *
	 * @param timeout maximum time (in ms) to lock
	 * @returns a promise when the lock has been set
	 */
	public tryLock(timeout: number): Promise<void> {
		throw new Error("Not implemented yet");
	}

	/**
	 * Unlocks this mutex
	 */
	public unlock() {
		throw new Error("Not implemented yet");
	}

	/**
	 * @inheritDoc
	 */
	public interrupt(reason: unknown) {
		throw new Error("Not implemented yet");
	}
}
