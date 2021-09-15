const mongoose = require("mongoose");

const UrlShortSchema = mongoose.Schema(
  {
    longUrl: {
      type: String,
      required: true,
      unique: true,
    },
    shortUrl: {
      type: String,
      unique: true,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("UrlShort", UrlShortSchema);
