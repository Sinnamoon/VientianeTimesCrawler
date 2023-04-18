import puppeteer, { Page } from "puppeteer";
import fs from "fs";

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://www.vientianetimes.org.la/");

  // Opening the top 5 articles in new tabs
  await page.waitForSelector("td .notice a");

  const hrefs = await page.$$eval("td .notice a", (elements) => {
    return elements.map((element) => element.getAttribute("href"));
  });

  let uniqueHrefs = [...new Set(hrefs)].map(
    (uniqueHrefs) => "https://www.vientianetimes.org.la/" + uniqueHrefs
  );
  console.log(uniqueHrefs); // Or do something else with the href values

  const pages = await Promise.all(
    uniqueHrefs.map((uniqueHrefs) => browser.newPage())
  );

  for (let i = 0; i < pages.length; i++) {
    await pages[i].goto(uniqueHrefs[i], { waitUntil: "networkidle0" });
  }
  //

  let data = await Promise.all(
    pages.map(async (page) => {
      let title = await page.$eval(
        "p strong",
        (element) => element.innerText
      );
      let article = await page.$eval("td", (element) => element.innerText);
      let photos = await page.$$eval("img", (elements) =>
        elements.map((element) => element.getAttribute("src"))
        );
      return { title, article, photos };
    })
  );

  //remove the \n from titles and articles
  data.forEach((element) => {
    element.title = element.title.replace(/\n/g, "");
    element.article = element.article.replace(/\n/g, "").slice(133).slice(0, -336);
    element.photos.shift(); element.photos.pop(); //remove the first and last element of the array (logos)
    element.photos = element.photos.map((photo) => {
      return "https://www.vientianetimes.org.la/" + photo;
    });
    });


  console.log(data);
  fs.writeFileSync("vientianeTimesData.json", JSON.stringify(data));
  await browser.close();
})();

