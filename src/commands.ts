import { ApplicationCommandData, ApplicationCommandType, ApplicationCommandOptionData, Awaitable, Client, ChatInputCommandInteraction, MessageContextMenuCommandInteraction, PermissionResolvable, UserContextMenuCommandInteraction } from 'discord.js';

/**
 * Dev: Deploys only to Client#devGuild
 *
 * Exclusive: Deploys to Client#exclusiveGuild and Client#devGuild
 *
 * Global: Deploys to all guilds and DMs
 *
 * Guild: Deploys to all guilds; not available in DMs
 */
export type Scope = 'Dev' | 'Exclusive' | 'Global' | 'Guild';

export type SlashCommandExecute = (interaction: ChatInputCommandInteraction, client: Client<true>) => Awaitable<void>;

export type ContextMenuExecute<Type extends ContextMenuType> = Type extends ApplicationCommandType.Message
	? (interaction: MessageContextMenuCommandInteraction, client: Client<true>) => Awaitable<void>
	: (interaction: UserContextMenuCommandInteraction, client: Client<true>) => Awaitable<void>;

export interface BaseCommandData {
	name: string;
	/** Default member permissions required to access the command in guilds */
	permissions?: PermissionResolvable;
	/** See summary of Scope union type for more detail */
	scope: Scope;
}

abstract class BaseCommand {
	name: string;
	permissions: PermissionResolvable | null;
	scope: Scope;
	constructor(data: BaseCommandData) {
		this.name = data.name;
		this.permissions = data.permissions ?? null;
		this.scope = data.scope;
	}
}

export interface SlashCommandData extends BaseCommandData {
	description: string;
	options?: ApplicationCommandOptionData[];
	execute: SlashCommandExecute;
}

export class SlashCommand extends BaseCommand {
	description: string;
	options: ApplicationCommandOptionData[] = [];
	execute: SlashCommandExecute;
	constructor(data: SlashCommandData) {
		super(data);
		this.description = data.description;
		this.options = data.options ?? [];
		this.execute = data.execute;
	}
	/** Maps the command into deployable JSON data */
	toJSON(): ApplicationCommandData {
		return {
			name: this.name,
			description: this.description,
			options: this.options ?? [],
			defaultMemberPermissions: this.permissions,
			dmPermission: this.scope === 'Global'
		};
	}
}

export type ContextMenuType = Exclude<ApplicationCommandType, ApplicationCommandType.ChatInput>;

export interface ContextMenuData<Type extends ContextMenuType> extends BaseCommandData {
	type: Type;
	execute: ContextMenuExecute<Type>;
}

export class ContextMenu<Type extends ContextMenuType> extends BaseCommand {
	type: Type;
	execute: ContextMenuExecute<Type>;
	constructor(data: ContextMenuData<Type>) {
		super(data);
		this.type = data.type;
		this.execute = data.execute;
	}
	/** Whether this is a Message-type context menu */
	isMessage(): this is ContextMenu<ApplicationCommandType.Message> {
		return this.type === ApplicationCommandType.Message;
	}
	/** Whether this is a User-type context menu */
	isUser(): this is ContextMenu<ApplicationCommandType.User> {
		return this.type === ApplicationCommandType.User;
	}
	/** Maps the command into deployable JSON data */
	toJSON(): ApplicationCommandData {
		return {
			name: this.name,
			type: this.type,
			defaultMemberPermissions: this.permissions,
			dmPermission: this.scope === 'Global'
		};
	}
}