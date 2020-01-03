import Sequelize from "sequelize";
import { combineResolvers } from "graphql-resolvers";
import pubsub, { EVENTS } from "../subscription";
import { isAuthenticated, isMessageOwner } from "./authorization";

const toCursorHash = string => Buffer.from(string).toString("base64");

const fromCursorHash = string =>
  Buffer.from(string, "base64").toString("ascii");

export default {
  Query: {},

  Mutation: {
    createChat: combineResolvers(
      isAuthenticated,
      async (parent, { members, chatName }, { models, me }) => {
        // let chat = await sequelize.query(
        //   `SELECT * FROM chats WHERE members IN (ARRAY[${members}])`
        // );
        let chat = await models.Chat.findAll({
          where: {
            receiverId: me.id,
            senderId: members[1]
          }
        });
        console.log(chat);
        if (chat) {
          return await chat[0];
        }
        chat = await models.Chat.create({
          chatName,
          members,
          receiverId: me.id,
          senderId: members[1]
        });
        // pubsub.publish(EVENTS.MESSAGE.CREATED, {
        //   messageCreated: { message }
        // });
        return await chat[0];
      }
    )
  }
};
