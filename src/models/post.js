import { esclient } from "../config/es";

const saveDocument = instance => {
  const document = instance.toJSON();
  return esclient.create({
    index: "post",
    id: instance.dataValues.id,
    body: document
  });
};

const deleteDocument = instance => {
  return esclient.delete({
    index: "post",
    id: instance.dataValues.id
  });
};

// const { body } = es.search({
//   index: "post",
//   // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
//   body: {
//     query: {
//       match: { quote: "winter" }
//     }
//   }
// });

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
      location: {
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
      lng: {
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
