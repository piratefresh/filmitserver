import Sequelize from "sequelize";
import { combineResolvers } from "graphql-resolvers";

import pubsub, { EVENTS } from "../subscription";
import { isAuth } from "../auth/isAuth";
import { isAuthenticated, isMessageOwner } from "./authorization";

const toCursorHash = string => Buffer.from(string).toString("base64");

const fromCursorHash = string =>
  Buffer.from(string, "base64").toString("ascii");

export default {
  Query: {
    queryPosts: async (
      parent,
      { cursor, limit = 100, offset, filter },
      { models }
    ) => {
      console.log(cursor);
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor)
              }
            }
          }
        : {};

      let whereStatement = {};
      if (filter) whereStatement = { [Sequelize.Op.like]: `%${filter}%` };

      const posts = await models.Post.findAll({
        order: [["createdAt", "DESC"]],
        where: {
          [Sequelize.Op.or]: [
            { title: filter ? whereStatement : undefined },
            { text: filter ? whereStatement : undefined },
            { location: filter ? whereStatement : undefined },
            { category: filter ? whereStatement : undefined },
            { tags: filter ? whereStatement : undefined }
          ]
        },
        limit: limit + 1,
        offset: offset,
        ...cursorOptions
      });

      const hasNextPage = posts.length > limit;
      const edges = hasNextPage ? posts.slice(0, -1) : posts;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: toCursorHash(edges[edges.length - 1].createdAt.toString())
        }
      };
    },
    post: async (parent, { id }, { models }) => {
      return await models.Post.findByPk(id);
    },
    posts: async (
      parent,
      { cursor, limit = 100, offset, filter },
      { models }
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

      const posts = await models.Post.findAll({
        order: [["createdAt", "DESC"]],
        limit: limit + 1,
        offset: offset,
        ...cursorOptions
      });

      const hasNextPage = posts.length > limit;
      const edges = hasNextPage ? posts.slice(0, -1) : posts;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: toCursorHash(edges[edges.length - 1].createdAt.toString())
        }
      };
    }
  },

  Mutation: {
    createPost: async (
      parent,
      { text, title, postImage, tags, category, location, lng, lat },
      { models, me }
    ) => {
      console.log(me);
      const post = await models.Post.create({
        text,
        title,
        tags,
        category,
        postImage,
        location,
        lng,
        lat,
        userId: me.id
      });

      pubsub.publish(EVENTS.POST.CREATED, {
        postCreated: { post }
      });

      return post;
    },
    deletePost: combineResolvers(
      isAuthenticated,
      isMessageOwner,
      async (parent, { id }, { models }) => {
        return await models.Post.destroy({ where: { id } });
      }
    )
  },

  Post: {
    user: async (post, args, { loaders }) => {
      return await loaders.user.load(post.userId);
    }
  },

  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator(EVENTS.POST.CREATED)
    }
  }
};
