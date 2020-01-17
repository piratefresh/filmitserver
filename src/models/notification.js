const notification = (sequelize, DataTypes) => {
  const Notification = sequelize.define("notification", {
    type: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          args: true,
          msg: "A channel has to have a text."
        }
      }
    }
  });
  Notification.associate = models => {
    Notification.belongsTo(models.User);
  };
  return Notification;
};
export default notification;
