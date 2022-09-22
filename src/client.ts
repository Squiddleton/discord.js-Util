import { Client as BaseClient, ClientEvents, ClientOptions as BaseClientOptions, Collection, Snowflake } from 'discord.js';
import { ContextMenu, ContextMenuType, Scope, SlashCommand } from './commands';
import { AnyClientEvent, ClientEvent } from './events';
import { validateGuild } from './functions';

export type AnyCommand = ContextMenu<ContextMenuType> | SlashCommand;

export interface ClientOptions extends BaseClientOptions {
	commands?: AnyCommand[];
	/**
	 * Events to automatically listen for when the Client is constructed
	 */
	events?: AnyClientEvent[];
	/**
	 * The id of a guild where all commands should be deployed
	 */
	devGuildId?: Snowflake;
	/**
	 * The id of a guild where commands with the Exclusive scope should be deployed
	 */
	exclusiveGuildId?: Snowflake;
}

const localScopes: Scope[] = ['Dev', 'Exclusive'];
const mapToColl = <T extends AnyCommand | AnyClientEvent>(k: T): [T['name'], T] => [k.name, k];
const readyError = (propertyName: string) => new Error(`The ${propertyName} property cannot be accessed until the Client is ready`);
const registerEvents = <T extends keyof ClientEvents>(client: BaseClient, event: ClientEvent<T>) => {
	if (event.once) {
		client.once(event.name, event.execute);
	}
	else {
		client.on(event.name, event.execute);
	}
};

/**
 * An extension of the discord.js Client with more constructor options, properties, and methods
 */
export class Client<Ready extends boolean = boolean> extends BaseClient<Ready> {
	commands: Collection<string, AnyCommand> = new Collection();
	events: Collection<string, AnyClientEvent> = new Collection();
	devGuildId: Snowflake | null;
	exclusiveGuildId: Snowflake | null;
	constructor(options: ClientOptions) {
		super(options);
		if (options.commands !== undefined) {
			this.commands = new Collection(options.commands.map(mapToColl));
		}
		if (options.events !== undefined) {
			this.events = new Collection(options.events.map(mapToColl));
		}
		this.events.forEach(event => registerEvents(this, event as ClientEvent<keyof ClientEvents>)); // TODO: Improve prevention of "too complex to represent" error
		this.devGuildId = options.devGuildId ?? null;
		this.exclusiveGuildId = options.exclusiveGuildId ?? null;
	}
	/**
	 * Deploys application commands based on their scope
	 */
	async deploy() {
		if (!this.isReady()) throw new Error('Commands cannot be deployed until the Client is ready');
		const application = await this.application.fetch();

		await application.commands.set(this.commands
			.filter(c => !localScopes.includes(c.scope))
			.map(c => c.toJSON())
		);

		if (this.devGuild !== null) {
			await this.devGuild.commands.set(this.commands
				.filter(c => localScopes.includes(c.scope))
				.map(c => c.toJSON())
			);
		}

		if (this.exclusiveGuild !== null) {
			await this.exclusiveGuild.commands.set(this.commands
				.filter(c => c.scope === 'Exclusive')
				.map(c => c.toJSON())
			);
		}
	}
	/**
	 *
	 */
	get devGuild() {
		if (!this.isReady()) throw readyError('devGuild');
		const { devGuildId } = this;
		if (devGuildId === null) return null;

		return validateGuild(this, devGuildId);
	}
	get exclusiveGuild() {
		if (!this.isReady()) throw readyError('exclusiveGuild');
		const { exclusiveGuildId } = this;
		if (exclusiveGuildId === null) return null;

		return validateGuild(this, exclusiveGuildId);
	}
}