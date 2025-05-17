import { ApplicationCommandData, ApplicationCommandType, ApplicationCommandOptionData, Awaitable, Client, ChatInputCommandInteraction, PermissionResolvable, ContextMenuCommandInteraction, InteractionContextType, ApplicationIntegrationType, Interaction } from 'discord.js';

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

export type SlashCommandExecute = (interaction: ChatInputCommandInteraction, client: Client<true>) => Awaitable<unknown>;

export type ContextMenuExecute<Type extends ContextMenuType> = (interaction: Extract<Interaction, { commandType: Type }>, client: Client<true>) => Awaitable<unknown>;

export interface BaseCommandData {
	name: string;
	/** Default member permissions required to access the command in guilds */
	permissions?: PermissionResolvable;
	/** Installation contexts that the command is available in; defaults to inferring based on the scope */
	integrationTypes?: ApplicationIntegrationType[];
	/** Interaction contexts that the command is usable in; defaults to inferring based on the scope */
	contexts?: InteractionContextType[];
	/** See summary of Scope union type for more detail */
	scope: Scope;
}

abstract class BaseCommand {
	name: string;
	permissions: PermissionResolvable | null;
	integrationTypes: ApplicationIntegrationType[] | null;
	contexts: InteractionContextType[] | null;
	scope: Scope;
	constructor(data: BaseCommandData) {
		this.name = data.name;
		this.permissions = data.permissions ?? null;
		this.integrationTypes = data.integrationTypes ?? null;
		this.contexts = data.contexts ?? null;
		this.scope = data.scope;
	}
	toJSON(allowUserInstall: boolean): Pick<ApplicationCommandData, 'name' | 'defaultMemberPermissions' | 'contexts' | 'integrationTypes'> {
		return {
			name: this.name,
			defaultMemberPermissions: this.permissions,
			contexts: this.contexts ?? (this.scope === 'Global'
				? [InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]
				: [InteractionContextType.Guild]),
			integrationTypes: this.integrationTypes ?? (allowUserInstall && ['Global', 'Guild'].includes(this.scope)
				? [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall]
				: [ApplicationIntegrationType.GuildInstall])
		};
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
	toJSON(allowUserInstall = true): ApplicationCommandData {
		return {
			...super.toJSON(allowUserInstall),
			description: this.description,
			options: this.options ?? []
		};
	}
}

export type ContextMenuType = ContextMenuCommandInteraction['commandType'];

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
	toJSON(allowUserInstall = true): ApplicationCommandData {
		return {
			...super.toJSON(allowUserInstall),
			type: this.type
		};
	}
}