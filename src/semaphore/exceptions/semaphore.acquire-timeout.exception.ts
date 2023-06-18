import { SemaphoreException } from "./semaphore.exception";

/**
 * When an acquire exceed its timeout limit
 */
export class SemaphoreAcquireTimeoutException extends SemaphoreException {}
