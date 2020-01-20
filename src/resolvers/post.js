import Sequelize from "sequelize";
import { combineResolvers } from "graphql-resolvers";
import { esclient, index, type } from "../config/es";
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
    },
    searchPosts: async (
      parent,
      { cursor, limit = 100, offset, term, category },
      { models }
    ) => {
      try {
        const { body, size } = term
          ? await esclient.search({
              index,
              size: 4,
              sort: "createdAt:desc",
              body: {
                query: {
                  multi_match: {
                    query: `*${term}*`,
                    fields: [
                      "title",
                      "text",
                      "location",
                      "category",
                      "tags",
                      "firstName",
                      "lastName",
                      "username"
                    ],
                    operator: "and",
                    fuzziness: "auto"
                  }
                },
                search_after: [cursor === undefined ? Date.now() : cursor]
              }
            })
          : category
          ? await esclient.search({
              index,
              size: 4,
              sort: "createdAt:desc",
              body: {
                query: {
                  match: { category: `*${category}*` }
                },
                search_after: [cursor === undefined ? Date.now() : cursor]
              }
            })
          : await esclient.search({
              index,
              size: 4,
              sort: "createdAt:desc",
              body: {
                search_after: [cursor === undefined ? Date.now() : cursor]
              }
            });

        const edges = await body.hits.hits.map(hit => {
          return {
            id: hit._id,
            text: hit._source.text,
            title: hit._source.title,
            location: hit._source.location,
            category: hit._source.category,
            tags: hit._source.tags,
            userId: hit._source.userId,
            postImage: hit._source.postImage,
            createdAt: hit._source.createdAt,
            score: hit._score,
            username: hit._source.username,
            firstName: hit._source.firstName,
            lastName: hit._source.lastName
          };
        });

        // Pagination
        const endCursor = body.hits.hits[
          body.hits.hits.length - 1
        ].sort.toString();
        const hasNextPage = edges.length >= 4;

        return {
          edges,
          pageInfo: {
            hasNextPage,
            endCursor
          }
        };
      } catch (err) {
        console.log(err.meta);
      }
    },
    categoryPosts: async (parent, { category }, { models }) => {
      const {
        body: { hits }
      } = await esclient.search({
        index,
        body: {
          query: {
            match: { category: category }
          }
        }
      });
      const values = hits.hits.map(hit => {
        return {
          id: hit._id,
          text: hit._source.text,
          title: hit._source.title,
          location: hit._source.location,
          category: hit._source.category,
          tags: hit._source.tags,
          userId: hit._source.userId,
          username: hit._source.username,
          firstName: hit._source.firstName,
          lastName: hit._source.lastName,
          postImage: hit._source.postImage,
          createdAt: hit._source.createdAt,
          score: hit._score
        };
      });
      return values;
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
