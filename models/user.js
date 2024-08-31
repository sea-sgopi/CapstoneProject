/* eslint-disable no-unused-vars */
"use strict";
const { use } = require("passport");
const { Model, where } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Course, {
        foreignKey: "educatorId",
        as: "courses",
      });
    }

    static async username(userId) {
      try {
        const user = await User.findByPk(userId, {
          attributes: ["fullName"],
        });

        if (!user) {
          throw new Error("User not found");
        }

        return user.fullName;
      } catch (error) {
        console.error("Error finding user full name:", error);
        throw error;
      }
    }
  }
  User.init(
    {
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Student",
        validate: {
          isIn: [["Student", "Educator", "Admin"]],
        },
      },
      photo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      timestamps: true,
    },
  );
  return User;
};
