const channel = (sequelize, DataTypes) => {
  const Channel = sequelize.define("channel", {});
  Channel.associate = models => {
    Channel.belongsTo(models.User, {
      foreignKey: {
        name: "receiverId",
        field: "receiver_id"
      }
    });
    Channel.belongsTo(models.User, {
      foreignKey: {
        name: "senderId",
        field: "sender_id"
      }
    });
    Channel.hasMany(models.Message, { onDelete: "CASCADE" });
  };
  return Channel;
};
export default channel;
