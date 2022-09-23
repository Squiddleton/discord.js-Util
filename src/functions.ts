import { Channel, Client as BaseClient, codeBlock, CommandInteraction, Snowflake, TextBasedChannel } from 'discord.js';
import { inspect } from 'util';

/**
 * Evaluates code from a command, and replies with the returned value
 *
 * @param interaction - The interaction which initiated the command
 * @param code - The code to evaluate
 * @param allowAsync - Whether to allow the await keyword; if "false", the code will implicitly return
 * @returns The return value of the evaluated code
 */
export const evalCommand = async (interaction: CommandInteraction, code: string, allowAsync: boolean) => {
	const { client } = interaction;
	if (!client.isReady()) return null;
	if (interaction.user.id !== client.application.owner?.id) {
		await interaction.reply({ content: 'Only this application\'s owner may use this command.', ephemeral: true });
		return null;
	}

	await interaction.deferReply();

	try {
		const evaled = await eval(allowAsync ? `(async () => {${code}})();` : code);

		switch (typeof evaled) {
			case 'undefined': {
				await interaction.editReply('No returned output to print.');
				break;
			}
			case 'string': {
				await interaction.editReply(evaled.slice(0, 2000));
				break;
			}
			default: {
				const isJSON = evaled !== null && typeof evaled === 'object' && evaled.constructor.name === 'Object';
				await interaction.editReply(codeBlock(isJSON ? 'json' : 'js', (isJSON ? JSON.stringify(evaled, null, 2) : inspect(evaled)).slice(0, 1987)));
			}
		}
		return evaled;
	}
	catch (error) {
		await interaction.editReply(`\`ERROR\` ${codeBlock('xl', inspect(error))}`);
		return error;
	}
};

const invalidId = (type: string, id: Snowflake) => `The ${type} id "${id}" is incorrect, or the ${type} is not cached`;

/**
 * Returns a Channel instance from its id if the id is valid and the channel is cached, otherwise throwing an error
 *
 * @param client - A ready discord.js Client instance
 * @param channelId - The id of the channel to validate and return
 * @param textOnly - Whether to validate only text-based channels; defaults to true
 * @returns The Channel instance if the id is valid and the channel is cached
 */
export function validateChannel(client: BaseClient<true>, channelId: Snowflake, textOnly: false): Channel;
export function validateChannel(client: BaseClient<true>, channelId: Snowflake, textOnly?: boolean): TextBasedChannel;
export function validateChannel(client: BaseClient<true>, channelId: Snowflake, textOnly = true) {
	const channel = client.channels.cache.get(channelId);
	if (channel === undefined) throw new Error(invalidId('channel', channelId));
	if (textOnly && !channel.isTextBased()) throw new Error(`The channel with the id "${channelId}" is not text-based; received type "${channel.type}"`);
	return channel;
}

/**
 * Returns a Guild instance from its id if the id is valid and the guild is cached, otherwise throwing an error
 *
 * @param client - A ready discord.js Client instance
 * @param guildId - The id of the guild to validate and return
 * @returns The Guild instance if the id is valid and the guild is cached
 */
export const validateGuild = (client: BaseClient<true>, guildId: Snowflake) => {
	const guild = client.guilds.cache.get(guildId);
	if (guild === undefined) throw new Error(invalidId('guild', guildId));
	return guild;
};