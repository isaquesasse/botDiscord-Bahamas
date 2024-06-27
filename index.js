require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField, ChannelType, ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, Events, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const CANAL_REGISTRO_ID = '1208280929496338453'; // ID do canal de registro
const CANAL_BAU_ID = '1255653467532427286'; // ID do canal para registro de baú
const CANAL_PRESENCA_ID = '1255656689282056313'; // ID do canal para registro de presença
const CARGO_MEMBRO_ID = '1173408869691686921'; // ID do cargo MEMBRO

client.on('messageCreate', async message => {
    if (message.content === '!farm') { //comando !farm, cria um botão para criar a pasta de farm
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder() //builder do botão
                    .setCustomId('create_farm_channel')
                    .setLabel('Criar chat de farm')
                    .setStyle(ButtonStyle.Primary),
            );

        message.channel.send({ //envia a mensagem com o botão
            content: 'Clique no botão abaixo para criar um chat de farm:',
            components: [row],
        });
    }

    if (message.content === '!anuncio') { //comando de anúncio
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`openAnuncioModal_${message.author.id}`) //abre o formulário para preencher o que vai no anúncio
                    .setLabel('Criar Anúncio')
                    .setStyle(ButtonStyle.Primary),
            );

        const anuncioMessage = await message.channel.send({ //envia a mensagem com o botão
            content: `${message.author}, clique no botão abaixo para criar um anúncio:`,
            components: [row],
        });

        await message.delete(); //deleta mensagem enviada pelo usuário

        client.anuncioMessage = anuncioMessage; 
    }

    if (message.content === '!registro') { //comando de registro de novo membro
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('openRegistroModal') //abre o modal de registro
                    .setLabel('Registrar Novato') 
                    .setStyle(ButtonStyle.Primary),
            );

        await message.channel.send({ //envia o texto com o botão
            content: 'Clique no botão abaixo para fazer o registro de membro:',
            components: [row],
        });
    }

    if (message.content === '!bau') { //abre o comando de !bau, para registrar os itens que entraram e sairam
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('openBauModal')
                    .setLabel('Registrar Baú')
                    .setStyle(ButtonStyle.Primary),
            );

        await message.channel.send({
            content: 'Clique no botão abaixo para registrar um item no baú:',
            components: [row],
        });
    }

    if (message.content === '!acao') {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('openAcaoModal')
                    .setLabel('Criar Ação')
                    .setStyle(ButtonStyle.Primary),
            );

        await message.channel.send({
            content: 'Clique no botão abaixo para criar uma ação:',
            components: [row],
        });
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;

    if (interaction.customId === 'create_farm_channel') {
        const user = interaction.user;

        await interaction.guild.channels.create({
            name: `farm-${user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        }).then(channel => {
            channel.send(`Olá ${user}, este é o seu canal de farm.

**Regras:**
1. Envie uma print sempre antes de entregar o farm.
2. Poste as prints aqui na hora.
3. No final do dia, some tudo e envie os dados neste modelo:

\`\`\`
Dia do farm:
Cápsula: 
Ferro:
Pólvora:
\`\`\`
            `);
        });

        await interaction.reply({ content: 'O canal de farm foi criado com sucesso!', ephemeral: true });
    }

    if (interaction.customId.startsWith('openAnuncioModal_')) {
        const userId = interaction.customId.split('_')[1];
        if (interaction.user.id !== userId) {
            return interaction.reply({ content: 'Você não tem permissão para usar este botão.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId('anuncioModal')
            .setTitle('Criar Anúncio');

        const tituloInput = new TextInputBuilder()
            .setCustomId('tituloInput')
            .setLabel('Título do Anúncio')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const conteudoInput = new TextInputBuilder()
            .setCustomId('conteudoInput')
            .setLabel('Conteúdo do Anúncio')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const imagemInput = new TextInputBuilder()
            .setCustomId('imagemInput')
            .setLabel('URL da Imagem (opcional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const autorInput = new TextInputBuilder()
            .setCustomId('autorInput')
            .setLabel('Nome do Autor')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const tituloRow = new ActionRowBuilder().addComponents(tituloInput);
        const conteudoRow = new ActionRowBuilder().addComponents(conteudoInput);
        const imagemRow = new ActionRowBuilder().addComponents(imagemInput);
        const autorRow = new ActionRowBuilder().addComponents(autorInput);

        modal.addComponents(tituloRow, conteudoRow, imagemRow, autorRow);

        await interaction.showModal(modal);
    }

    if (interaction.customId === 'anuncioModal') {
        await interaction.deferUpdate();
        const titulo = interaction.fields.getTextInputValue('tituloInput');
        const conteudo = interaction.fields.getTextInputValue('conteudoInput');
        const imagem = interaction.fields.getTextInputValue('imagemInput');
        const autor = interaction.fields.getTextInputValue('autorInput');

        const anuncioEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(`**${titulo}**`)
            .setDescription(conteudo)
            .setFooter({ text: `Autor: ${autor}` });

        if (imagem) {
            anuncioEmbed.setImage(imagem);
        }

        await interaction.channel.send({ embeds: [anuncioEmbed] });
        const everyoneMessage = await interaction.channel.send('@everyone');

        if (client.anuncioMessage) {
            await client.anuncioMessage.delete();
            client.anuncioMessage = null;
        }

        setTimeout(async () => {
            await everyoneMessage.delete();
        }, 5000);
    }

    if (interaction.customId === 'openRegistroModal') {
        const modal = new ModalBuilder()
            .setCustomId('registroModal')
            .setTitle('Registro de Novato');

        const nomeInput = new TextInputBuilder()
            .setCustomId('nomeInput')
            .setLabel('Nome')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const identidadeInput = new TextInputBuilder()
            .setCustomId('identidadeInput')
            .setLabel('Identidade')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const telefoneInput = new TextInputBuilder()
            .setCustomId('telefoneInput')
            .setLabel('Telefone')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const recrutadorInput = new TextInputBuilder()
            .setCustomId('recrutadorInput')
            .setLabel('Recrutador(a)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const nomeRow = new ActionRowBuilder().addComponents(nomeInput);
        const identidadeRow = new ActionRowBuilder().addComponents(identidadeInput);
        const telefoneRow = new ActionRowBuilder().addComponents(telefoneInput);
        const recrutadorRow = new ActionRowBuilder().addComponents(recrutadorInput);

        modal.addComponents(nomeRow, identidadeRow, telefoneRow, recrutadorRow);

        await interaction.showModal(modal);
    }

    if (interaction.customId === 'registroModal') {
        await interaction.deferUpdate();
        const nome = interaction.fields.getTextInputValue('nomeInput');
        const identidade = interaction.fields.getTextInputValue('identidadeInput');
        const telefone = interaction.fields.getTextInputValue('telefoneInput');
        const recrutador = interaction.fields.getTextInputValue('recrutadorInput');

        const registroChannel = interaction.guild.channels.cache.get(CANAL_REGISTRO_ID);
        if (registroChannel) {
            const registroEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('Novo Registro de Novato')
                .addFields(
                    { name: 'Nome', value: nome },
                    { name: 'Identidade', value: identidade },
                    { name: 'Telefone', value: telefone },
                    { name: 'Recrutador(a)', value: recrutador }
                )
                .setTimestamp();

            await registroChannel.send({ embeds: [registroEmbed] });

            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (member) {
                try {
                    await member.roles.add(CARGO_MEMBRO_ID);
                    await interaction.followUp({ content: 'Registro completo e cargo MEMBRO adicionado!', ephemeral: true });
                } catch (error) {
                    console.error('Erro ao adicionar o cargo:', error);
                    await interaction.followUp({ content: 'Registro completo, mas houve um erro ao adicionar o cargo.', ephemeral: true });
                }
            }
        } else {
            await interaction.followUp({ content: 'Canal de registro não encontrado.', ephemeral: true });
        }
    }

    if (interaction.customId === 'openBauModal') {
        const modal = new ModalBuilder()
            .setCustomId('bauModal')
            .setTitle('Registro de Item no Baú');

        const autorInput = new TextInputBuilder()
            .setCustomId('autorInput')
            .setLabel('Autor')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const itemInput = new TextInputBuilder()
            .setCustomId('itemInput')
            .setLabel('Item')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const quantidadeInput = new TextInputBuilder()
            .setCustomId('quantidadeInput')
            .setLabel('Quantidade')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const autorRow = new ActionRowBuilder().addComponents(autorInput);
        const itemRow = new ActionRowBuilder().addComponents(itemInput);
        const quantidadeRow = new ActionRowBuilder().addComponents(quantidadeInput);

        modal.addComponents(autorRow, itemRow, quantidadeRow);

        await interaction.showModal(modal);
    }

    if (interaction.customId === 'bauModal') {
        await interaction.deferUpdate();
        const autor = interaction.fields.getTextInputValue('autorInput');
        const item = interaction.fields.getTextInputValue('itemInput');
        const quantidade = interaction.fields.getTextInputValue('quantidadeInput');

        const bauChannel = interaction.guild.channels.cache.get(CANAL_BAU_ID);
        if (bauChannel) {
            const bauEmbed = new EmbedBuilder()
                .setColor(0xffa500)
                .setTitle('Registro de Item no Baú')
                .addFields(
                    { name: 'Autor', value: autor },
                    { name: 'Item', value: item },
                    { name: 'Quantidade', value: quantidade }
                )
                .setTimestamp();

            await bauChannel.send({ embeds: [bauEmbed] });
            await interaction.followUp({ content: 'Item registrado no baú com sucesso!', ephemeral: true });
        } else {
            await interaction.followUp({ content: 'Canal de registro de baú não encontrado.', ephemeral: true });
        }
    }

    if (interaction.customId === 'openAcaoModal') {
        const modal = new ModalBuilder()
            .setCustomId('acaoModal')
            .setTitle('Criar Ação');

        const responsavelInput = new TextInputBuilder()
            .setCustomId('responsavelInput')
            .setLabel('Responsável')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const localInput = new TextInputBuilder()
            .setCustomId('localInput')
            .setLabel('Local')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const dataInput = new TextInputBuilder()
            .setCustomId('dataInput')
            .setLabel('Data')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const responsavelRow = new ActionRowBuilder().addComponents(responsavelInput);
        const localRow = new ActionRowBuilder().addComponents(localInput);
        const dataRow = new ActionRowBuilder().addComponents(dataInput);

        modal.addComponents(responsavelRow, localRow, dataRow);

        await interaction.showModal(modal);
    }

    if (interaction.customId === 'acaoModal') {
        await interaction.deferUpdate();
        const responsavel = interaction.fields.getTextInputValue('responsavelInput');
        const local = interaction.fields.getTextInputValue('localInput');
        const data = interaction.fields.getTextInputValue('dataInput');

        const acaoEmbed = new EmbedBuilder()
            .setColor(0x0000ff)
            .setTitle('Nova Ação')
            .addFields(
                { name: 'Responsável', value: responsavel },
                { name: 'Local', value: local },
                { name: 'Data', value: data }
            )
            .setTimestamp();

        const acaoMessage = await interaction.channel.send({ embeds: [acaoEmbed] });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`marcarPresenca_${acaoMessage.id}`)
                    .setLabel('Marcar Presença')
                    .setStyle(ButtonStyle.Primary),
            );

        await acaoMessage.edit({ components: [row] });

        await interaction.followUp({ content: 'Ação criada com sucesso!', ephemeral: true });
    }

    if (interaction.customId.startsWith('marcarPresenca_')) {
        const messageId = interaction.customId.split('_')[1];
        const presencaChannel = interaction.guild.channels.cache.get(CANAL_PRESENCA_ID);

        if (presencaChannel) {
            await presencaChannel.send(`${interaction.user.username} marcou presença na ação.`);
            await interaction.reply({ content: 'Presença marcada com sucesso!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Canal de presença não encontrado.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
