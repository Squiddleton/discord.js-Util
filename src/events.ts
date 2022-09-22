import { Awaitable, ClientEvents } from 'discord.js';

type ClientEventNames = keyof ClientEvents;
type Execute<T extends ClientEventNames> = (...args: ClientEvents[T]) => Awaitable<void>;

export interface ClientEventData<T extends ClientEventNames> {
	/** The name of the ClientEvent */
	name: T;
	/** Whether to only listen for the event once */
	once?: boolean;
	/** A function with the event's parameters to call when the event emits */
	execute: Execute<T>;
}

export class ClientEvent<T extends ClientEventNames> implements ClientEventData<T> {
	name: T;
	once: boolean;
	execute: Execute<T>;
	constructor(data: ClientEventData<T>) {
		this.name = data.name;
		this.once = data.once ?? false;
		this.execute = data.execute;
	}
}

export type AnyClientEvent = { [T in ClientEventNames]: ClientEvent<T> }[ClientEventNames];