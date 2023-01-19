const ezgif = require("./index");
const FormData = require("form-data");
const axios = require("axios");
const Cheerio = require("cheerio");
const fs = require("fs");
const https = require("https");
const { rmSync } = require("fs");

const root = "https://ezgif.com/";

(async () => {
  const inputDir = "./input";
  const files = await fs.promises.readdir(inputDir);
  for (const file of files) {
    if (file.endsWith(".webp")) {
      const filePath = `${inputDir}/${file}`;
      const cResultData = await ezgif.gif2video(filePath);
      let data = setupModifiers(cResultData);

      let url = await modify(root + cResultData("form").attr("action"), data);

      const temp = await resize(url);
      let fileName = temp.substr(temp.lastIndexOf("/") + 1);
      https.get(temp, (resp) =>
        resp.pipe(fs.createWriteStream(`./output/${fileName}`))
      );
      console.log("The file has been saved!");
    }
  }
})();

const sendRequest = async (url, body, headers = {}) => {
  const res = await axios({
    url: url,
    method: "POST",
    data: body,
    headers,
  });
  return res;
};
const resize = async (url) => {
  const formData = new FormData();
  formData.append("file", url);
  url = url.substr(url.lastIndexOf("/") + 1);
  const res = await sendRequest(`https://ezgif.com/resize/${url}`, formData);
  // console.log(data);
  let html = Cheerio.load(res.data);
  // console.log(html(".form").html());
  let newUrl = html("form").attr("action");
  const temp_data = setupModifiers(html);
  const saveUrl = await resize_modify(html, newUrl, temp_data, 70);
  return saveUrl;
};

const download = function (url, dest) {
  const file = fs.createWriteStream(dest);
  const request = http.get(url, function (response) {
    response.pipe(file);
    file.on("finish", function () {
      file.close(); // close() is async, call cb after close completes.
    });
  });
};
const checkMinSize = (html) => {
  const size = html("div[id=output]").find(".filestats strong");
  if (!size) return;
  console.log(size.html());
  return parseFloat(size.html());
};

async function resize_modify(html, newUrl, data, percentage) {
  const old_height = html('input[name="old_height"]').attr("value");
  const old_width = html('input[name="old_width"]').attr("value");
  data.append("old_height", old_height);
  data.append("old_width", old_width);
  data.append("percentage", percentage);
  data.append("method", "gifsicle");
  const width = (percentage * old_width) / 100;
  data.append("width", width);
  data.append("ar", "crop");
  let speed = await axios({
    url: newUrl,
    method: "POST",
    data: data,
    headers: data.getHeaders(),
  });

  let cSpeed = Cheerio.load(speed.data);

  let output = cSpeed("div[id=output]").html();
  let cOutput = Cheerio.load(output);
  return cOutput("a[class=save]").attr("href");
}

async function modify(newUrl, data) {
  let speed = await axios({
    url: newUrl,
    method: "POST",
    data: data,
    headers: data.getHeaders(),
  });

  let cSpeed = Cheerio.load(speed.data);
  let output = cSpeed("div[id=output]").html();

  let cOutput = Cheerio.load(output);
  return cOutput("a[class=save]").attr("href");
}

function setupModifiers(cResultData) {
  let newUrl = cResultData("form").attr("action");
  let file = newUrl.substr(newUrl.lastIndexOf("/") + 1);
  let data = new FormData();
  data.append("file", file);
  return data;
}
