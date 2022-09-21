import { Awaitable, ClientEvents } from 'discord.js';

export interface ClientEventData<T extends keyof ClientEvents> {
	/** The name of the ClientEvent */
	name: T;
	/** Whether to only listen for the event once */
	once?: boolean;
	/** A function with the event's parameters to call when the event emits */
	execute: (...params: ClientEvents[T]) => Awaitable<void>;
}

export class ClientEvent<T extends keyof ClientEvents> implements ClientEventData<T> {
	name: T;
	once = false;
	execute: (...params: ClientEvents[T]) => Awaitable<void>;
	constructor(data: ClientEventData<T>) {
		this.name = data.name;
		this.once = data.once ?? false;
		this.execute = data.execute;
	}
}