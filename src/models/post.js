const post = (sequelize, DataTypes) => {
  const Post = sequelize.define("post", {
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
    }
  });
  Post.associate = models => {
    Post.belongsTo(models.User);
  };
  return Post;
};
export default post;
