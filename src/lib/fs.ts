import type { R2Bucket } from "@cloudflare/workers-types";

export namespace FS {
	export namespace Keys {
		export type Options = {
			/**
			 * The prefix to match keys against. Keys will only be returned if they
			 * start with given prefix
			 */
			prefix?: string;
			/**
			 * The number of results to return. Maximum of `1000`.
			 * @default 1000
			 */
			limit?: number;
			/**
			 * An opaque token that indicates where to continue listing objects from.
			 * A cursor can be retrieved from a previous list operation.
			 */
			cursor?: string;
			/**
			 * The character to use when grouping keys.
			 * @default "/"
			 */
			delimiter?: string;
		};

		export type Result =
			| { keys: string[]; done: false; cursor: string }
			| { keys: string[]; done: true; cursor: null };
	}
}

/**
 * Upload, store and serve images, videos, music, documents and other
 * unstructured data in your Edge-first application.
 */
export class FS {
	constructor(protected r2: R2Bucket) {}

	/**
	 * Returns a list of all keys in storage.
	 */
	async keys(options: FS.Keys.Options = {}): Promise<FS.Keys.Result> {
		let result = await this.r2.list(options);
		let keys = result.objects.map((object) => object.key);
		if (result.truncated) return { keys, done: false, cursor: result.cursor };
		return { keys, done: true, cursor: null };
	}

	/**
	 * Returns `true` if a file with the given key exists, `false` otherwise.
	 */
	async has(key: string) {
		let object = await this.r2.get(key);
		return object !== null;
	}

	/**
	 * Puts a file in storage at the given key.
	 */
	async put(key: string, file: File) {
		await this.r2.put(key, await file.arrayBuffer());
	}

	/**
	 * Returns the file with the given key, or `null` if no such key exists.
	 */
	async get(key: string) {
		let object = await this.r2.get(key);
		if (!object) return null;

		let arrayBuffer = await object.arrayBuffer();

		return new File([arrayBuffer], key, {
			type: object.httpMetadata?.contentType,
			lastModified: object.uploaded.getTime(),
		});
	}

	/**
	 * Removes the file with the given key from storage.
	 */
	async remove(key: string) {
		await this.r2.delete(key);
	}

	/**
	 * Returns a Response with the file body and correct headers.
	 * If the file doesn't exits it returns a 404 response with an empty body.
	 */
	async serve(key: string) {
		let object = await this.r2.get(key);
		if (!object) return new Response(null, { status: 404 });
		let headers = new Headers();
		object.writeHttpMetadata(headers);
		return new Response(object?.body, { headers });
	}
}
