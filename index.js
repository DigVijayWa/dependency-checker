const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { format } = require("path");
const checkList = require("./checList");

const baseUrl = "https://mvnrepository.com";

async function fetchHTML(url) {
  console.log(url);
  const { data } = await axios.get(url);
  return cheerio.load(data);
}

async function loadAllUrl(pageSize, firstUrl, level) {
  let mapArray = [];
  let pages = pageSize / 10;
  let itemCount = pageSize % 10;
  var i = 1;
  for (i = 1; i <= pageSize / 10; i++) {
    const data = await getPageDetails(firstUrl, i, level);
    mapArray = mapArray.concat(data);
  }

  if (itemCount > 0) {
    const data = await getPageDetails(firstUrl, i, level);
    mapArray = mapArray.concat(data);
  }
  return mapArray;
}

async function getPageDetails(url, i, level) {
  let pageItemArray = [];
  const data = await fetchHTML(url + "?p=" + i);
  data(".im-title").find(".im-usage").remove().text();
  let size = data(".im-title").find("a").length;
  for (var j = 0; j < size; j++) {
    var text = data(".im-title").find("a")[j].children[0]["data"];
    var link = data(".im-title").find("a")[j].attribs.href;
    var dataArr = await loadPageSize(baseUrl + link + "/usages", level - 1);
    pageItemArray.push({ link, text, data: dataArr });
  }
  return pageItemArray;
}

async function loadPageSize(url, level) {
  if (level > 0) {
    const data = await fetchHTML(url);
    let pageSize = findOutPageSize(data("h1").text());
    if (pageSize > 0) {
      const map = await loadAllUrl(pageSize, url, level);
      return map;
    } else {
      return [];
    }
  } else {
    return [];
  }
}

(async () => {
  let data = await loadPageSize(
    "https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-cloudfoundry-connector/usages",
    2
  );

  fs.writeFileSync(
    "mod.json",
    '{"spring-cloud-cloudfoundry-connector":' + toStringMap(data) + "}"
  );

  console.log("search starting");

  checkList.forEach((item) => {
    findDependency(data, item);
  });

  console.log("search complete ...");
})();

String.prototype.replaceOccurringDashes = function () {
  let stringBuilder = "";
  let flagDown = false;
  for (var i = 0; i < this.length; i++) {
    if (this[i] != "-") {
      flagDown = false;
      stringBuilder += this[i];
    } else if (!flagDown && this[i] == "-") {
      flagDown = true;
      stringBuilder += this[i];
    }
  }

  return stringBuilder;
}

function findDependency(mapArray, item) {
  if (mapArray.length == 0) {
    return;
  }
  mapArray.forEach((element) => {
    
    let formatText = element.text.toLowerCase().replaceAll(/\s|::|\t/g, "-").replaceOccurringDashes();

    if (item == formatText) {
      console.log(formatText + " dependency is causing the issue");
    }

    if (element.data.length > 0) {
      findDependency(element.data, item);
    }
  });
}

function toStringMap(mapArray) {
  if (mapArray.length == 0) {
    return "[]";
  }
  let stringBuilder = "[";

  mapArray.forEach((element) => {
    stringBuilder +=
      "{" +
      '"link":"' +
      element.link +
      '",' +
      '"text":"' +
      element.text +
      '",' +
      `"${element.text}":` +
      toStringMap(element.data) +
      "},";
  });

  stringBuilder = stringBuilder.substring(0, stringBuilder.length - 1);
  stringBuilder += "]";

  return stringBuilder;
}

function findOutPageSize(text) {
  return parseInt(text.split("(")[1].split(")")[0]);
}
