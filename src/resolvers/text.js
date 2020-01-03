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
      async (parent, { members, chatName, text }, { models, me }) => {
        try {
          await models.Chat.update(
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
          const chat = await models.Chat.findOne({
            where: { receiverId: me.id, senderId: members[1] }
          });
          return await chat;
        } catch (err) {
          console.log(err);
          throw new UserInputError(err);
        }
      }
    )
  }
};
