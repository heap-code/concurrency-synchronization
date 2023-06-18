import { SemaphoreException } from "./semaphore.exception";

/**
 * When an invalid value is given for a [semaphore]{@link Semaphore} timeout.
 */
export class SemaphoreInvalidTimeoutException extends SemaphoreException {}
