import Sequelize from "sequelize";
import { combineResolvers } from "graphql-resolvers";
import { UserInputError, withFilter } from "apollo-server";
import pubsub, { EVENTS } from "../subscription";
import { isAuthenticated, isMessageOwner } from "./authorization";
import models from "../models";

const toCursorHash = string => Buffer.from(string).toString("base64");

const fromCursorHash = string =>
  Buffer.from(string, "base64").toString("ascii");

export default {
  Query: {},

  Mutation: {
    createNotification: combineResolvers(
      isAuthenticated,
      async (
        parent,
        { notificationType, messageId, postId, authorId },
        { models, me }
      ) => {
        try {
          const newNotification = await models.Notification.create({
            userId: authorId,
            notificationType,
            messageId,
            postId
          });

          pubSub.publish(NOTIFICATION_CREATED_OR_DELETED, {
            notificationCreatedOrDeleted: {
              operation: "CREATE",
              notification: newNotification
            }
          });
          return await notification;
        } catch (err) {
          console.log(err);
          throw new UserInputError(err);
        }
      }
    ),
    deleteNotification: combineResolvers(
      isAuthenticated,
      async (parent, { notificationId }, { models, me }) => {
        const notification = await models.Notification.destroy({
          where: { notificationId }
        });

        return notification;
      }
    ),
    updateNotificationSeen: combineResolvers(
      isAuthenticated,
      async (parent, { notificationId }, { models, me }) => {
        const notification = await models.Notification.update(
          { seen: true },
          { where: { seen: false, userId: me.id, id: notificationId } }
        );

        return notification;
      }
    )
  },

  Subscription: {
    notificationCreatedOrDeleted: {
      subscribe: withFilter(
        () => pubSub.asyncIterator(NOTIFICATION_CREATED_OR_DELETED),
        (payload, variables, { me }) => {
          const userId =
            payload.notificationCreatedOrDeleted.notification.userId;

          return me && me.id === userId;
        }
      )
    }
  }
};
