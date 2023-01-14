# discord.js-Util

## About

Useful utility classes and functions that make discord.js bot developing more efficient.

## Usage

**Node.js v14+ is required.**

First, install this scoped package by running the following command in your terminal:

```sh-session
npm install @squiddleton/discordjs-util
```

### Client

The package exports a `Client` class that extends the native discord.js class of the same name. By providing more options when initializing it, more features become available:

```javascript
const { Client } = require('@squiddleton/discordjs-util'); // This package is compiled to CommonJS, so both require() and import syntax are supported
const { GatewayIntentBits } = require('discord.js'); // This package supplements discord.js instead of replacing it

// 'devGuildId' is one property added to the extended Client options, but
// more are available as shown in the extended ClientOptions TSDoc annotations
const client = new Client({ intents: [GatewayIntentBits.Guilds], devGuildId: '1234567890123456789' });

client.on('ready', () => {
    console.log(client.devGuild.name); // Prints the name of the devGuild retrieved from its id
});

client.login('token here');
```

### Commands

The `SlashCommand` and `ContextMenu` classes provide support for the construction of Chat Input and Context Menu application commands, respectively.

```javascript
const { Client, ContextMenu, evalCommand, SlashCommand } = require('@squiddleton/discordjs-util');

const pingCommand = new SlashCommand({
    name: 'ping',
    description: 'Replies with pong',
    scope: 'Global', // Scopes determine where commands are deployed to
    async execute(interaction) {
        await interaction.reply('Pong!');
    }
});

const evalContextMenu = new ContextMenu({
    name: 'Eval',
    type: ApplicationCommandType.Message,
    scope: 'Dev', // Only deployed to the server indicated with the "devGuildId" in the ClientOptions
    async execute(interaction) {
        await evalCommand(interaction, interaction.targetMessage.content, true); // evalCommand() is a function tailored for application commands
    }
});

const client = new Client({ intents: [GatewayIntentBits.Guilds], commands: [pingCommand, evalContextMenu] });

client.on('ready', async () => {
    if (client.isReady()) {
        await client.deploy(); // Deploys all commands from the ClientOptions "commands" array (should only be called when command structures are updated)
    }
});

client.login('token here');
```

The constructor argument can contain other properties familiar to the official discord.js guide's command handler, including `options` and `permissions`.

The `scope` property of a command is entirely custom, and it determines where the command will be deployed. There are four possible scopes:

1. Global: The command is deployed globally and is accessible in both servers and direct messages.
2. Guild: The command is deployed globally but is only accessible in servers.
3. Dev: The command is only deployed in the guild with the id from `devGuildId` in the `ClientOptions` (if provided).
4. Exclusive: The command is only deployed in the guild with the id from `exclusiveGuildId` in the `ClientOptions` (if provided) **and** deployed in the devGuild (if provided). This is to ensure that all commands are accessible in the devGuild.

Both command class instances have a `.toJSON()` method which returns an object in `ApplicationCommandData` format. The `ContextMenu` class also has `.isMessage()` and `.isUser()` methods which will narrow down the its specific type.

### Events

The `ClientEvent` class standardizes the construction of the events that the client emits, and it automatically adds listeners for those events to the client upon construction.

```javascript
const { Client, ClientEvent } = require('@squiddleton/discordjs-util');

const event1 = new ClientEvent({
    name: 'ready',
    once: true, // Registers the event using EventEmitter#once() instead of EventEmitter#on()
    async execute(client) {
        console.log(`Now logged in as ${client.user.tag}!`);
    }
});

const event2 = new ClientEvent({
    name: 'interactionCreate',
    async execute(interaction) { // No "once" property defaults to using #on()
        if (interaction.isRepliable()) {
            await interaction.reply('Hi!');
        }
    }
});

const client = new Client({ intents: [GatewayIntentBits.Guilds], events: [event1, event2] });
// When ready, the Client's username will be logged, and any application command interactions will be met with "Hi!"

client.login('token here');
```

### Miscellaneous

Along with the aforementioned `evalCommand()` function, this package has two more functions as top-level exports: `validateChannel()` and `validateGuild()`.

Using the normal discord.js method `<Client>.(channels|guild).cache.get(<Id>)` returns a union type of either the expected structure or `undefined`. Additionally, getting channels by this method provides no automatic typeguarding, so typeguards like `<BaseChannel>.isTextBased()` must be used before calling `.send()` on the channel. Both of these methods return solely the structure instead of possibly returning `undefined`; if the structure is unavailable, an error will be thrown to call out this unexpected behavior. When the third argument of `validateChannel()` is set to `true` (the default value), it will also only return a `TextBasedChannel`, otherwise throwing an error. Although these functions may seem insignificant, TypeScript users will find this automatic type narrowing much more efficient than manually checking every time a channel/guild is retrieved.

```javascript
const { Client, ClientEvent, validateChannel, validateGuild } = require('@squiddleton/discordjs-util');

const ready = new ClientEvent({
    name: 'ready',
    once: true,
    async execute(client) {
        const channel = validateChannel(client, '1234567890123456789'); // TextBasedChannel instead of Channel|undefined
        const guild = validateGuild(client, '987654310987654321'); // Guild instead of Guild|undefined

        await channel.send(guild.name);
    }
});

const client = new Client({ intents: [GatewayIntentBits.Guilds], events: [ready] });
```

## Credits

This package is fully independent and unaffiliated with both Discord Inc. and discord.js.