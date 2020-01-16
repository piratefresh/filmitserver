import Sequelize from "sequelize";
import { combineResolvers } from "graphql-resolvers";
import { UserInputError } from "apollo-server";
import pubsub, { EVENTS } from "../subscription";
import { isAuthenticated, isMessageOwner } from "./authorization";

const toCursorHash = string => Buffer.from(string).toString("base64");

const fromCursorHash = string =>
  Buffer.from(string, "base64").toString("ascii");

export default {
  Query: {},

  Mutation: {
    createText: combineResolvers(
      isAuthenticated,
      async (parent, { members, channelName, text }, { models, me }) => {
        try {
          await models.Channel.update(
            {
              text: {
                content: text,
                authorId: members[1]
              }
            },
            {
              where: { receiverId: me.id, senderId: members[1] },
              returning: true
            }
          );
          const channel = await models.Channel.findOne({
            where: { receiverId: me.id, senderId: members[1] }
          });
          return await channel;
        } catch (err) {
          console.log(err);
          throw new UserInputError(err);
        }
      }
    )
  }
};
