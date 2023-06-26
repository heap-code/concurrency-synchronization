import { ConcurrencyException } from "../../exceptions";

/**
 * Any exception related only to a [ProducerConsumer]{@link ProducerConsumer}.
 */
export abstract class ProducerConsumerException extends ConcurrencyException {}
