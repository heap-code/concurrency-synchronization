import { ConcurrencyException } from "../../exceptions";

/**
 * Any exception related only to a [Semaphore]{@link Semaphore}.
 */
export abstract class SemaphoreException extends ConcurrencyException {}
