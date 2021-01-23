const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const baseUrl = "https://mvnrepository.com";

async function fetchHTML(url) {
  console.log(url);
  const { data } = await axios.get(url);
  return cheerio.load(data);
}

async function loadAllUrl(pageSize, firstUrl) {
  let mapArray = [];
  for (var i = 1; i <= pageSize / 10; i++) {
    const data = await getPageDetails(firstUrl, i);
    mapArray = mapArray.concat(data);
  }
  return mapArray;
}

async function getPageDetails(url, i) {
  let pageItemArray = [];

  const data = await fetchHTML(url + "?p=" + i);
  data(".im-title").find(".im-usage").remove().text();
  let size = data(".im-title").find("a").length;
  for (var j = 0; j < size; j++) {
    var text = data(".im-title").find("a")[j].children[0]["data"];
    var link = data(".im-title").find("a")[j].attribs.href;
    var dataArr = await loadPageSize(baseUrl + link + "/usages");
    pageItemArray.push({ link, text, data: dataArr });
  }
  return pageItemArray;
}

function resolveTransientDependencies(url) {}

async function loadPageSize(url) {
  const data = await fetchHTML(url);
  let pageSize = findOutPageSize(data("h1").text());
  if (pageSize > 0) {
    const map = await loadAllUrl(pageSize, url);
    return toStringMap(map);
  } else {
    return "[]";
  }
}

(async () => {
  console.log("before start");

  let data = await loadPageSize(
    "https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-cloudfoundry-connector/usages"
  );
  fs.writeFileSync("mod.json", '"spring-cloud-cloudfoundry-connector":' + data);
  console.log("after start");
})();

function toStringMap(mapArray) {
  let stringBuilder = "[";

  mapArray.forEach((element) => {
    stringBuilder +=
      "{" +
      '"link":"' +
      element.link +
      '",' +
      '"text":"' +
      element.text +
      '"' +
      "},";
  });

  stringBuilder = stringBuilder.substring(0, stringBuilder.length - 1);
  stringBuilder += "]";

  return stringBuilder;
}

function findOutPageSize(text) {
  return parseInt(text.split("(")[1].split(")")[0]);
}
