const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const AFKManager = require('./AFKManager');

class AFKBot {
    constructor() {
        this.afkManager = new AFKManager();
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ]
        });

        // Random greeting messages
        this.greetingMessages = [
            "You're back!",
            "Missed you",
            "Welcome home",
            "You're here again!",
            "AFK? Not anymore!",
            "Yay! You're here",
            "All done resting?",
            "Boop! You're back!",
            "Hello again~",
            "Offline? Never again!",
            "Joined the chat!",
            "Poof! You appeared!"
        ];

        // Random greeting emojis
        this.greetingEmojis = [
            "<:vp_wave:1394498528817975357>",
            "<a:wave:1394498399457509408>",
            "<:wave:1394498811229114481>",
            "<:FurinaWave:1394498582526165184>",
            "<:Kazu_Wave:1394498661500719297>",
            "<:SageGreet2:1394496208982249635>",
            "<:greeting:1394496327139852399>",
            "<:greet:1394496368973971648>",
            "<:KazuWave:1394499141505257567>",
            "<a:TH_wave:1394499332614393880>"
        ];

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.client.on('ready', () => {
            console.log('AFK Bot is ready!');
        });

        this.client.on('messageCreate', (message) => {
            this.handleMessage(message);
        });

        this.client.on('interactionCreate', (interaction) => {
            if (interaction.isButton()) {
                this.handleButtonInteraction(interaction);
            } else if (interaction.isModalSubmit()) {
                this.handleModalSubmit(interaction);
            }
        });
    }

    async handleMessage(message) {
        if (message.author.bot) return;

        const content = message.content;
        const author = message.author;
        const serverId = message.guild?.id || null;

        // Check for AFK users being mentioned
        for (const mentionedUser of message.mentions.users.values()) {
            if (this.afkManager.isUserAFK(mentionedUser.id, serverId)) {
                const afkData = this.afkManager.getAFKData(mentionedUser.id, serverId);
                if (afkData && author.id !== mentionedUser.id) {
                    this.afkManager.addPing(mentionedUser.id, author.id, serverId);
                    
                    const duration = this.afkManager.formatDuration(Date.now() - afkData.timestamp);
                    const afkScopeText = afkData.isGlobal ? "Globally" : "Locally";
                    const reasonText = afkData.reason || "No Reason Provided";
                    const pingText = afkData.pingCount > 1 ? `(${afkData.pingCount} pings)` : "";
                    
                    const embed = new EmbedBuilder()
                        .setAuthor({
                            name: `${mentionedUser.username} is AFK ${afkScopeText} for ${duration} ${pingText}`,
                            iconURL: mentionedUser.displayAvatarURL()
                        })
                        .setDescription(`<a:SageDot:1394560680077820015> **Reason:** ${reasonText}`)
                        .setColor('#2e2e2e');
                    
                    await message.channel.send({ embeds: [embed] });
                }
            }
        }

        // Check if the message author is AFK and remove their status
        if (this.afkManager.isUserAFK(author.id, serverId)) {
            const afkData = this.afkManager.removeAFK(author.id, serverId);
            if (afkData) {
                const duration = this.afkManager.formatDuration(Date.now() - afkData.timestamp);
                const randomMessage = this.greetingMessages[Math.floor(Math.random() * this.greetingMessages.length)];
                const randomEmoji = this.greetingEmojis[Math.floor(Math.random() * this.greetingEmojis.length)];
                const pingByText = afkData.lastPingedBy ? `<@${afkData.lastPingedBy}>` : "No Pings";
                
                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: "Bitzxier Afk System!",
                        iconURL: this.client.user.displayAvatarURL()
                    })
                    .setDescription(`${randomEmoji} ${randomMessage}\n<a:SageDot:1394560680077820015> Hello! **[${author.username}](https://discord.com/users/${author.id})**,\n<a:SageDot:1394560680077820015> Your Afk has been Removed.\n\n<:SageTime:1394560350577233970> Afk Duration: \`${duration}\`\n<:SageAuto:1394560442487144589> Times Pinged: \`${afkData.pingCount}\`\n<:SageMention:1394560509243822192> Pinged By: ${pingByText}`)
                    .setColor('#2e2e2e')
                    .setThumbnail(author.displayAvatarURL());
                
                await message.channel.send({ content: `<@${author.id}>`, embeds: [embed] });
            }
        }

        // Handle commands
        if (content.startsWith('?')) {
            const command = content.slice(1).toLowerCase();
            
            if (command === 'afk' || command.startsWith('afk ')) {
                await this.handleAFKCommand(message);
            } else if (command === 'afkstatus') {
                await this.handleAFKStatusCommand(message);
            } else if (command === 'help') {
                await this.handleHelpCommand(message);
            }
        }
    }

    async handleAFKCommand(message) {
        const author = message.author;
        const serverId = message.guild?.id || null;
        const content = message.content;
        
        // Extract reason from command
        const reason = content.slice(4).trim() || null;
        
        // Check if user is already AFK
        if (this.afkManager.isUserAFK(author.id, serverId)) {
            const embed = new EmbedBuilder()
                .setTitle("Already AFK")
                .setDescription("You are already AFK! Send a message to remove your AFK status.")
                .setColor('#2e2e2e')
                .setFooter({ text: `Requested by ${author.username}`, iconURL: author.displayAvatarURL() });
            
            await message.channel.send({ embeds: [embed] });
            return;
        }
        
        // Create the main AFK embed
        const embed = new EmbedBuilder()
            .setAuthor({
                name: "Bitzxier Afk System!",
                iconURL: this.client.user.displayAvatarURL()
            })
            .setDescription(`AFK? See you Soon!                      Hey, **[${author.username}](https://discord.com/users/${author.id})**\nChoose your AFK Status Type:`)
            .setColor('#2e2e2e')
            .setThumbnail(author.displayAvatarURL())
            .setFooter({ text: `Requested By ${author.username}`, iconURL: author.displayAvatarURL() });
        
        // Create buttons with reason data
        const reasonData = reason || "";
        const globalButton = new ButtonBuilder()
            .setCustomId(`global_afk:${reasonData}`)
            .setLabel("Global AFK")
            .setStyle(ButtonStyle.Primary);
        
        const serverButton = new ButtonBuilder()
            .setCustomId(`server_afk:${reasonData}`)
            .setLabel("Server AFK")
            .setStyle(ButtonStyle.Success);
        
        const row = new ActionRowBuilder().addComponents(globalButton, serverButton);
        
        await message.channel.send({ embeds: [embed], components: [row] });
    }

    async handleAFKStatusCommand(message) {
        const author = message.author;
        const serverId = message.guild?.id || null;
        
        if (!this.afkManager.isUserAFK(author.id, serverId)) {
            const embed = new EmbedBuilder()
                .setTitle("Not AFK")
                .setDescription("You are not currently AFK.")
                .setColor('#2e2e2e')
                .setFooter({ text: `Requested by ${author.username}`, iconURL: author.displayAvatarURL() });
            
            await message.channel.send({ embeds: [embed] });
            return;
        }
        
        const afkData = this.afkManager.getAFKData(author.id, serverId);
        const duration = this.afkManager.formatDuration(Date.now() - afkData.timestamp);
        const afkScopeText = afkData.isGlobal ? "Globally" : "Locally";
        const reasonText = afkData.reason || "No Reason Provided";
        const pingText = afkData.pingCount > 0 ? `\n**Pings:** ${afkData.pingCount}` : "";
        
        const embed = new EmbedBuilder()
            .setAuthor({
                name: `You are AFK ${afkScopeText} for ${duration}`,
                iconURL: author.displayAvatarURL()
            })
            .setDescription(`**Reason:** ${reasonText}${pingText}`)
            .setColor('#2e2e2e')
            .setFooter({ text: `Requested by ${author.username}`, iconURL: author.displayAvatarURL() });
        
        await message.channel.send({ embeds: [embed] });
    }

    async handleHelpCommand(message) {
        const embed = new EmbedBuilder()
            .setTitle("<:emoji_36:1394593479128256552> BITZXIER HELP PAGE")
            .setDescription("Here are the available commands:")
            .setColor('#0099ff')
            .addFields(
                { name: "?afk", value: "Set your AFK status with interactive buttons", inline: false },
                { name: "How it works:", value: "• Use `?afk` to set your AFK status\n• Choose between Global AFK (all servers) or Server AFK (current server only)\n• Send any message to automatically remove your AFK status", inline: false }
            )
            .setImage("https://cdn.discordapp.com/attachments/1388006859239198753/1394620944605253653/515fc5b09e233665e53f5b335be035ce.png?ex=68777977&is=687627f7&hm=23f7ca21af3bba4ee26540473e7db91d5559f6bc60d285e4a8ff6efb811ca5dc&")
            .setThumbnail(this.client.user.displayAvatarURL())
            .setFooter({ text: "Bitzxier Afk System!", iconURL: this.client.user.displayAvatarURL() });
        
        await message.channel.send({ embeds: [embed] });
    }

    async handleButtonInteraction(interaction) {
        const buttonId = interaction.customId;
        const user = interaction.user;
        
        if (buttonId.startsWith('global_afk:') || buttonId.startsWith('server_afk:')) {
            const isGlobal = buttonId.startsWith('global_afk:');
            
            // Extract reason from button ID
            const parts = buttonId.split(':', 2);
            const reason = parts.length > 1 && parts[1].trim() ? parts[1].trim() : null;
            
            // Set AFK status with reason
            const serverId = interaction.guild?.id || null;
            this.afkManager.setAFK(user.id, serverId, reason, isGlobal);
            
            // Update embed with confirmation
            const afkScopeText = isGlobal ? "Globally" : "Locally";
            const reasonText = reason || "No Reason Provided";
            
            const confirmEmbed = new EmbedBuilder()
                .setAuthor({
                    name: `Your AFK has been Set ${afkScopeText} with Reason ${reasonText}`,
                    iconURL: user.displayAvatarURL()
                })
                .setColor('#2e2e2e');
            
            await interaction.update({ embeds: [confirmEmbed], components: [] });
        }
    }

    async handleModalSubmit(interaction) {
        // Handle modal submissions if needed
    }

    start() {
        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            console.error('ERROR: DISCORD_BOT_TOKEN environment variable is not set!');
            process.exit(1);
        }
        
        this.client.login(token);
    }
}

// Create and start the bot
const bot = new AFKBot();
bot.start();
