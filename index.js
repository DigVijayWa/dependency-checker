const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const checkList = require("./checList");
const dep = require("./mod.js");

const baseUrl = "https://mvnrepository.com";

async function fetchHTML(url) {
  console.log(url);
  const { data } = await axios.get(url);
  return cheerio.load(data);
}

async function loadAllUrl(itemCounts, firstUrl, level) {
  let mapArray = [];
  let pages = itemCounts / 10;
  let itemCount = itemCounts % 10;
  var i = 1;
  for (i = 1; i <= itemCounts / 10; i++) {
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
    let itemCount = findOutPageSize(data("h1").text());
    if (itemCount > 0) {
      const map = await loadAllUrl(itemCount, url, level);
      return map;
    } else {
      return [];
    }
  } else {
    return [];
  }
}

/*(async () => {
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
})();*/
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

let total = [];
let obj = dep["spring-cloud-cloudfoundry-connector"];

obj.forEach(item=> flattenObject(item));

console.log("search started");

checkList.forEach(item=>{

  total.forEach(innerItem=> {
    if(item == innerItem) {
      console.log("Dependency: "+item);
    }
  });
})

console.log("search completed");

fs.writeFileSync(
  "list.json",
  total.toString()
);

function flattenObject(obj) {

  let formatText = obj.text.toLowerCase().replace(/\s|::|\t/g, "-").replaceOccurringDashes();
  total.push(formatText);

  if(obj.data.length == 0) {
    return;
  }
  else {
    obj.data.forEach(item=> flattenObject(item));
  }

};






function findDependency(mapArray, item) {
  if (mapArray.length == 0) {
    return;
  }
  mapArray.forEach((element) => {
    
    let formatText = element.text.toLowerCase().replace(/\s|::|\t/g, "-").replaceOccurringDashes();

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
      `"data":` +
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
