import { SemaphoreException } from "./semaphore.exception";

/**
 * When an invalid value is defined for [semaphore]{@link Semaphore} permits.
 */
export class SemaphoreInvalidPermitsException extends SemaphoreException {}
