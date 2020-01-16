const text = (sequelize, DataTypes) => {
  const Text = sequelize.define("text", {
    content: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          args: true,
          msg: "A Text has to have a text."
        }
      }
    },
    authorId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          args: true,
          msg: "A Text has to have a Text name."
        }
      }
    }
  });
  // Text.associate = models => {
  //   Text.belongsTo(models.Chat, {
  //     foreignKey: {
  //       name: "chatId",
  //       field: "chatId"
  //     }
  //   });
  //   Text.belongsTo(models.User);
  // };
  return Text;
};
export default text;
