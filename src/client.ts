import { Client as BaseClient, ClientOptions as BaseClientOptions, Collection, Snowflake } from 'discord.js';
import { ContextMenu, ContextMenuType, Scope, SlashCommand } from './commands';
import { validateGuild } from './functions';

export interface ClientOptions extends BaseClientOptions {
	/**
	 * The id of a guild where all commands should be deployed
	 */
	devGuildId?: Snowflake;
	/**
	 * The id of a guild where commands with the Exclusive scope should be deployed
	 */
	exclusiveGuildId?: Snowflake;
}

const readyError = (propertyName: string) => new Error(`The ${propertyName} property cannot be accessed until the Client is ready`);

const localScopes: Scope[] = ['Dev', 'Exclusive'];

/**
 * An extension of the discord.js Client with more constructor options, properties, and methods
 */
export class Client<Ready extends boolean = boolean> extends BaseClient<Ready> {
	commands: Collection<string, ContextMenu<ContextMenuType> | SlashCommand>;
	devGuildId: Snowflake | null;
	exclusiveGuildId: Snowflake | null;
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
	constructor(options: ClientOptions) {
		super(options);
		this.commands = new Collection();
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
}