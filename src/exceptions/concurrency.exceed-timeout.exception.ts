import { ConcurrencyException } from "./concurrency.exception";

/**
 * When a sync class "lock" exceeds its timeout limit
 */
export class ConcurrencyExceedTimeoutException extends ConcurrencyException {}
