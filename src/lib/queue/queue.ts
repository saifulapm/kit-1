import type { Queue as WorkerQueue } from "@cloudflare/workers-types";
import type { Jsonifiable } from "type-fest";

export namespace Queue {
	export type ContentType = "text" | "bytes" | "json" | "v8";

	export namespace Enqueue {
		export type Payload = Jsonifiable;

		export interface Options {
			contentType?: ContentType;
			delay?: number;
		}
	}
}

/**
 * Enqueue for processing later any kind of payload of data.
 */
export class Queue {
	constructor(protected queue: WorkerQueue) {}

	get binding() {
		return this.queue;
	}

	async enqueue<Payload extends Queue.Enqueue.Payload>(
		payload: Payload,
		options?: Queue.Enqueue.Options,
	) {
		await this.queue.send(payload, options);
	}
}
