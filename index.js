const axios = require("axios");
const cheerio = require("cheerio");
const fs = require('fs');

const baseUrl = "https://mvnrepository.com/artifact";

function fetchHTML(url) {
    return new Promise((resolve, reject)=>{
        axios.get(url).then(({data})=> {
            resolve(cheerio.load(data));
        }).catch(err => reject(err));
    });
}

let mapArray = [];
function loadAllUrl(pageSize, firstUrl) {
    
    
    return new Promise((resolve, reject) => {
        for(var i=1;i<pageSize/10; i++) {
            getPageDetails(firstUrl, i).then(data=> {
                mapArray = mapArray.concat(data);
                if(mapArray.length >= pageSize-2) {
                    resolve(mapArray);
                }
            });
        }
    });
}

function getPageDetails(url, i) {
    let pageItemArray = [];
    return new Promise((resolve, reject) => {

        fetchHTML(url+'?p='+i).then(data=>{
            data('.im-title').find('.im-usage').remove().text();
            let size = data('.im-title').find('a').length;
            for(var j=0;j<size;j++) {
                var text =  data('.im-title').find('a')[j].children[0]['data'];
                var link = data('.im-title').find('a')[j].attribs.href;
                pageItemArray.push({ link, text});
                loadPageSize(baseUrl+link).then(function(resp){

                }.bind({text}));
            }
            resolve(pageItemArray);
        });
    })
}

function resolveTransientDependencies(url) {

}

function loadPageSize(url) {
    return new Promise((resolve, reject) => {
        fetchHTML(url).then(data=> {
            let pageSize = findOutPageSize(data('h1').text());
            if(pageSize > 0) {
                loadAllUrl(pageSize, url).then(map=> {
                    resolve(toStringMap(map));
                });
            }
            else {
                resolve("[]");
            }
        });
    });
}



loadPageSize("https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-cloudfoundry-connector/usages").then(data=>{
    console.log('"spring-cloud-cloudfoundry-connector":'+data);
});

function toStringMap(mapArray) {
    let stringBuilder = '[';

    mapArray.forEach(element => {
        stringBuilder += '{'+ 
        '"link":"'+element.link+'",'+
        '"text":"'+element.text+'"'+
        '},'
    });

    stringBuilder = stringBuilder.substring(0,stringBuilder.length-1);
    stringBuilder += ']';

    return stringBuilder;
}

function findOutPageSize(text) {
    return parseInt(text.split("(")[1].split(")")[0]);;
}