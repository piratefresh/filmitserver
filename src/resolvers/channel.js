import Sequelize from "sequelize";
import { sequelize } from "../models";
import { combineResolvers } from "graphql-resolvers";
import { withFilter } from "apollo-server";
import pubsub, { EVENTS } from "../subscription";
import { v4 as uuid } from "uuid";
import { isAuthenticated, isMessageOwner } from "./authorization";
import channel from "../models/channel";

const toCursorHash = string => Buffer.from(string).toString("base64");

const fromCursorHash = string =>
  Buffer.from(string, "base64").toString("ascii");

export default {
  Query: {
    channels: combineResolvers(
      isAuthenticated,
      async (
        parent,
        { cursor, limit = 100, offset, receiverId, content },
        { models, me }
      ) => {
        const cursorOptions = cursor
          ? {
              where: {
                createdAt: {
                  [Sequelize.Op.lt]: fromCursorHash(cursor)
                }
              }
            }
          : {};

        let channels = await models.Channel.findAll({
          where: {
            members: {
              [Sequelize.Op.contains]: [me.id]
            }
          },
          order: [["createdAt", "DESC"]],
          limit: limit + 1,
          offset: offset,
          ...cursorOptions
        });

        const hasNextPage = channels.length > limit;
        const edges = hasNextPage ? channels.slice(0, -1) : channels;

        return {
          edges,
          pageInfo: {
            hasNextPage,
            endCursor: toCursorHash(
              edges[edges.length - 1].createdAt.toString()
            )
          }
        };
      }
    ),
    channel: combineResolvers(
      isAuthenticated,
      async (parent, { channelId }, { models, me }) => {
        try {
          const channel = await models.Channel.findByPk(channelId, {
            raw: true
          });
          console.log(channel);
          pubsub.publish(EVENTS.CHANNEL.GET, {
            getChannel: channel
          });
          return channel;
        } catch (err) {
          console.log(err);
        }
      }
    ),
    getUserChannels: combineResolvers(
      isAuthenticated,
      async (parent, { channelId }, { models, me }) => {
        // Lets find all the channel Id
        const channelIds = await models.Channel.findAll({
          attributes: [[sequelize.fn("max", sequelize.col("id")), "id"]],
          where: {
            [Sequelize.Op.or]: [{ receiverId: me.id }, { senderId: me.id }]
          },
          group: ["id"],
          raw: true
        });
        //  extract the ids from object inside array
        let ids = await channelIds.map(channelId => {
          return channelId.id;
        });

        const channels = await models.Channel.findAll({
          where: {
            [Sequelize.Op.or]: [{ receiverId: me.id }, { senderId: me.id }]
          },
          order: [["updatedAt", "DESC"]],
          raw: true
        });

        // Lets get the last messages of conversations
        const messages = await models.Message.findAll({
          where: {
            channelId: {
              [Sequelize.Op.in]: ids
            }
          },
          order: [["createdAt", "DESC"]],
          raw: true
        });

        // finds the latest message
        // const lastMessage = messages[0];
        // console.log(lastMessage);

        // find all latest messages in all channels
        const lastMessagesArr = [];
        messages.forEach(message => {
          let i = lastMessagesArr.findIndex(
            x => x.channelId == message.channelId
          );
          if (i <= -1) {
            lastMessagesArr.push(message);
          }
        });

        channels.map(channel => {
          lastMessagesArr.map(message => {
            if (channel.id === message.channelId) {
              channel.messages = message;
            }
          });
        });

        // channels.sort().reverse();
        return channels;
      }
    )
  },

  Mutation: {
    createChannel: combineResolvers(
      isAuthenticated,
      async (parent, { receiverId, content }, { models, me }) => {
        const members = [receiverId, me.id];
        // Find channel
        let channel = await models.Channel.findOne({
          where: {
            receiverId: {
              [Sequelize.Op.in]: members
            },
            senderId: {
              [Sequelize.Op.in]: members
            }
          },
          raw: true
        });
        // if channel does not exist, we create channel
        if (!channel) {
          const newChannel = await models.Channel.create({
            receiverId,
            senderId: me.id
          });
          // Parse because sequelize dosent returns instance not json so we cant transform it
          const parsedChannel = await newChannel.toJSON();

          const message = await models.Message.create({
            content,
            receiverId,
            senderId: me.id,
            channelId: parsedChannel.id
          });

          // publish event that message has been created
          pubsub.publish(EVENTS.MESSAGE.CREATED, {
            messageCreated: { message }
          });

          return await newChannel;
        }
        // CREATE NEW MESSAGE FOR EXISTING CHANNEL
        let message = await models.Message.create({
          content,
          receiverId: receiverId,
          senderId: me.id,
          channelId: channel.id
        });

        message = message.toJSON();

        pubsub.publish(EVENTS.MESSAGE.CREATED, {
          messageCreated: message
        });

        // update the channel cache
        const channelUpdated = {
          ...channel,
          lastMessage: message.content,
          lastMessageCreatedAt: message.createdAt
        };
        pubsub.publish(EVENTS.CHANNEL.UPDATED, {
          channelUpdated
        });

        return await channel;
      }
    )
  },

  Channel: {
    messages: async (channel, args, { models }) => {
      return await models.Message.findAll({
        where: {
          channelId: channel.id
        }
      });
    },
    receiverId: async (channel, args, { models, loaders }) => {
      return await loaders.user.load(channel.receiverId);
    },
    senderId: async (channel, args, { models, loaders }) => {
      return await loaders.user.load(channel.senderId);
    }
  },

  Subscription: {
    channelCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(EVENTS.CHANNEL.CREATED),
        (payload, variables, { me }) => {
          return me && me.id === payload.newChannel.receiverId;
        }
      )
    },
    channelUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(EVENTS.CHANNEL.UPDATED),
        (payload, variables, { me }) => {
          console.log(payload.channelUpdated);
          const { senderId, receiverId } = payload.channelUpdated;

          const isAuthUserSenderOrReceiver =
            senderId === me.id || receiverId === me.id;
          const isUserSenderOrReceiver =
            me.id !== senderId || me.id !== receiverId;

          return isAuthUserSenderOrReceiver && isUserSenderOrReceiver;
        }
      )
    },
    getChannel: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(EVENTS.CHANNEL.GET),
        (payload, variables, { me }) => {
          console.log(payload.getChannel);
          const { senderId, receiverId } = payload.getChannel;

          const isAuthUserSenderOrReceiver =
            senderId === me.id || receiverId === me.id;
          const isUserSenderOrReceiver =
            me.id !== senderId || me.id !== receiverId;

          return isAuthUserSenderOrReceiver && isUserSenderOrReceiver;
        }
      )
    }
  }
};

// subscribe: () => pubsub.asyncIterator(EVENTS.CHANNEL.CREATED)
