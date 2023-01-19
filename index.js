var axios = require("axios");
const FormData = require("form-data");
var fs = require("fs");
const Cheerio = require("cheerio");

var root = "https://ezgif.com/";

module.exports = class Ezgif {
  constructor() {}
  static async gif2video(path) {
    const form = new FormData();
    form.append("new-image", fs.createReadStream(path));
    try {
      var result = await axios({
        url: root + "webp-to-gif",
        method: "POST",
        data: form,
        headers: form.getHeaders(),
      });
      return Cheerio.load(result.data);
    } catch (error) {
      console.log(error);
    }
  }
};
