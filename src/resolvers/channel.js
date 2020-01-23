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
    getChannel: combineResolvers(
      isAuthenticated,
      async (parent, { channelId }, { models, me }) => {
        const channel = await models.Channel.findByPk(channelId);
        const unReadMessages = await models.Message.update(
          { isRead: true },
          {
            where: { receiverId: me.id, isRead: false, channelId },
            order: [["id", "ASC"]]
          }
        );
        console.log(channel);
        pubsub.publish(EVENTS.CHANNEL.UPDATED, {
          channelUpdated: { channel }
        });
        return channel;
      }
    )
  },

  Mutation: {
    createChannel: combineResolvers(
      isAuthenticated,
      async (parent, { receiverId, content }, { models, me }) => {
        const members = [receiverId, me.id];
        // let channel = await sequelize.query(
        //   `SELECT * FROM channels WHERE members IN (ARRAY[${members}])`
        // );
        let channel = await models.Channel.findOne({
          where: {
            members: {
              [Sequelize.Op.contains]: members
            }
          },
          raw: true
        });
        if (!channel) {
          channel = await models.Channel.create({
            members
          });
          const parsedChannel = await channel.toJSON();

          const message = await models.Message.create({
            content,
            receiverId: receiverId,
            senderId: me.id,
            channelId: parsedChannel.id
          });
          console.log(
            `channel does not exists, creating message for${parsedChannel}`
          );
          pubsub.publish(EVENTS.MESSAGE.CREATED, {
            messageCreated: { message }
          });

          return await channel;
        }

        const message = await models.Message.create({
          content,
          receiverId: receiverId,
          senderId: me.id,
          channelId: channel.id
        });

        console.log(`channel exists, creating message for${channel.id}`);

        pubsub.publish(EVENTS.MESSAGE.CREATED, {
          messageCreated: { message }
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
    }
  },

  Subscription: {
    channelCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(EVENTS.CHANNEL.CREATED),
        (payload, variables) => {
          return payload.channelCreated.channel.members.includes(
            variables.memberId
          );
        }
      )
    },
    channelUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(EVENTS.CHANNEL.UPDATED),
        (payload, variables) => {
          console.log(payload.channelUpdated.channel);
          return payload.channelUpdated.channel.members.includes(
            variables.memberId
          );
        }
      )
    }
  }
};

// subscribe: () => pubsub.asyncIterator(EVENTS.CHANNEL.CREATED)
