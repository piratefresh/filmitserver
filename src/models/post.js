import { esclient } from "../config/es";
import models from "../models";

const post = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    "post",
    {
      text: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            args: true,
            msg: "A post text cannot be empty."
          }
        }
      },
      title: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            args: true,
            msg: "Post needs title"
          }
        }
      },
      postImage: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            args: true,
            msg: "A post needs image"
          }
        }
      },
      city: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            args: true,
            msg: "A post needs location"
          }
        }
      },
      lat: {
        type: DataTypes.FLOAT
      },
      lon: {
        type: DataTypes.FLOAT
      },
      category: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        validate: {
          notEmpty: {
            args: true,
            msg: "Post needs one ore more category."
          }
        }
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        validate: {
          notEmpty: {
            args: true,
            msg: "Post needs one ore more tag."
          }
        }
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      hooks: {
        afterCreate: saveDocument,
        //afterUpdate: saveDocument,
        afterDestroy: deleteDocument
      }
    }
  );
  Post.associate = models => {
    Post.belongsTo(models.User);
  };
  return Post;
};
export default post;

/**
 * @function saveDocument
 * @returns {document}
 * @description Saves a document to db
 */
const saveDocument = async instance => {
  const document = await instance.toJSON();
  const {
    title,
    text,
    category,
    tags,
    location,
    city,
    userId,
    createdAt,
    postImage,
    lat,
    lon
  } = await document;
  const { username, firstName, lastName } = await models.User.findByPk(userId);
  console.log(document);
  console.log("added to Elastic DB");
  return esclient.create({
    index: "post",
    id: instance.dataValues.id,
    body: {
      title,
      text,
      category,
      tags,
      city,
      location: {
        lat,
        lon
      },
      username,
      firstName,
      lastName,
      createdAt,
      postImage
    }
  });
};

/**
 * @function deleteDocument
 * @returns {id}
 * @description Deletes document from db
 */
const deleteDocument = instance => {
  return esclient.delete({
    index: "post",
    id: instance.dataValues.id
  });
};
