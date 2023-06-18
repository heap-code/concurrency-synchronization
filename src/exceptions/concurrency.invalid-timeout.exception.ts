import { ConcurrencyException } from "./concurrency.exception";

/**
 * When an invalid value is given for a timeout
 */
export class ConcurrencyInvalidTimeoutException extends ConcurrencyException {}
