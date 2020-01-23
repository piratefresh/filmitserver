import Sequelize from "sequelize";
import { combineResolvers } from "graphql-resolvers";
import { withFilter } from "apollo-server";
import pubsub, { EVENTS } from "../subscription";
import { isAuthenticated, isMessageOwner } from "./authorization";
import message from "../models/message";

const toCursorHash = string => Buffer.from(string).toString("base64");

const fromCursorHash = string =>
  Buffer.from(string, "base64").toString("ascii");

export default {
  Query: {
    messages: async (parent, { cursor, limit = 100 }, { models, me }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor)
              }
            }
          }
        : {};

      const messages = await models.Message.findAll({
        order: [["createdAt", "DESC"]],
        limit: limit + 1,
        ...cursorOptions
      });

      const hasNextPage = messages.length > limit;
      const edges = hasNextPage ? messages.slice(0, -1) : messages;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: toCursorHash(edges[edges.length - 1].createdAt.toString())
        }
      };
    },
    message: async (parent, { id }, { models }) => {
      return await models.Message.findByPk(id);
    },
    getUnreadMessages: async (_, args, { models, me }) => {
      return await models.Message.findAll({
        where: {
          receiverId: me.id,
          isRead: false
        }
      });
    }
  },

  Mutation: {
    createMessage: combineResolvers(
      isAuthenticated,
      async (parent, { receiverId, content }, { models, me }) => {
        // see if a channel already exists with receiver and sender
        const members = [receiverId, me.id];
        let channel = await models.Channel.findOne({
          where: {
            members: {
              [Sequelize.Op.contains]: members
            }
          },
          raw: true
        });
        const message = await models.Message.create({
          content,
          receiverId,
          senderId: me.id,
          channelId: channel.id
        });

        pubsub.publish(EVENTS.MESSAGE.CREATED, {
          messageCreated: { message }
        });

        return message;
      }
    ),

    deleteMessage: combineResolvers(
      isAuthenticated,
      isMessageOwner,
      async (parent, { id }, { models }) => {
        return await models.Message.destroy({ where: { id } });
      }
    )
  },

  Message: {
    user: async (message, args, { loaders }) => {
      return await loaders.user.load(message.userId);
    },
    receiverId: async (message, args, { models, loaders }) => {
      return await loaders.user.load(message.receiverId);
    },
    senderId: async (message, args, { models, loaders }) => {
      return await loaders.user.load(message.senderId);
    }
  },

  Subscription: {
    messageCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(EVENTS.MESSAGE.CREATED),
        (payload, variables) => {
          // console.log(payload.messageCreated);
          return (
            payload.messageCreated.message.receiverId === variables.receiverId
          );
        }
      )
    }
  }
};
