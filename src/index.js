const puppeteer = require("puppeteer");
const { promises, createWriteStream } = require("fs");
const path = require("path");
const hb = require("handlebars");
const merge = require("easy-pdf-merge");
const request = require("request");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: "AKIAY6V54NC6XTWXGK2F",
  secretAccessKey: "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",
});

//=== GMAP const
const GMAP_API_KEY = "AIzaSyC2Kcxwvpo5WJ2pM9Dbr2dKCFjS2wZwFoM";
const GMAP_URL = `https://maps.google.com/maps/api/staticmap`;
const MARKER = "https://badea.s3.amazonaws.com/_Ellipse_+(1).png";

//=== Template const
const TEMPLATE_FIRST_PAGE_PATH = "./../template/page1.html";
const TEMPLATE_SECOND_PAGE_PATH = "./../template/page2.html";
const TEMPLATE_THIRD_PAGE_PATH = "./../template/page3.html";

const PDF_FOLDER_PATH = path.join(__dirname, "../pdfsGenerated");

const MAIN_FOOTER =
  '<div class="footer" style="height: 200px; -webkit-print-color-adjust: exact; background-color: #c2ced0; width: 100%;"></div>';

const MAIN_HEADER = `<style>#header, #footer { padding: 0 !important; } @page { size: A4; margin: 0;}</style>`;

const PAGES_TEMPLATES = {
  firstPage: {
    marginTop: 200,
    path: TEMPLATE_FIRST_PAGE_PATH,
    footer: MAIN_FOOTER,
  },
  secondPage: {
    marginTop: 5,
    // Indicate that the page needs to fetch data from google maps and have dynamic text
    shouldFetchDataFromGMAP: true,
    path: TEMPLATE_SECOND_PAGE_PATH,
    footer: MAIN_FOOTER,
  },
  thirdPage: {
    marginTop: 50,
    path: TEMPLATE_THIRD_PAGE_PATH,
    footer: MAIN_FOOTER,
  },
};

class NextMasjidReport {
  constructor() {
    this._generatedReports = []; // Alist of all the final generated pdf pages that needs to be merged.
  }

  async activate(data) {
    if (typeof data !== "object") {
      throw new Error("An object should be passed");
    }

    await this._generateReportFromData(data);
  }

  async _getTemplateFile(currentPath) {
    const fullTemplatePath = path.join(currentPath);
    return await promises.readFile(fullTemplatePath, "utf-8");
  }

  async _generateReportFromData(data) {
    try {
      const pagesTemplates = Object.keys(PAGES_TEMPLATES);
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      for (const currentTemplate of pagesTemplates) {
        const {
          path,
          shouldFetchDataFromGMAP,
          marginTop,
          footer,
        } = PAGES_TEMPLATES[currentTemplate];
        const templateFile = await this._getTemplateFile(path);

        if (shouldFetchDataFromGMAP) {
          const [bigMapImage, smallMapImage] = await Promise.all([
            nextMasjidReport._getStaticMap({
              lat: data.lat,
              long: data.long,
              width: 640,
              height: 640,
              zoom: 17,
            }),
            nextMasjidReport._getStaticMap({
              lat: data.lat,
              long: data.long,
              width: 287,
              height: 287,
              zoom: 15,
            }),
          ]);

          // Add the map to data obj for dynamic content
          data.bigMapImage = bigMapImage;
          data.smallMapImage = smallMapImage;
        }

        // Add the text to file and compile using HB.
        const compiledTemplate = hb.compile(templateFile)(data);
        await page.setContent(compiledTemplate);

        await page.pdf({
          path: `${currentTemplate}.pdf`,
          format: "A4",
          width: "208mm",
          height: "298mm",
          landscape: false,
          printBackground: true,
          margin: { top: marginTop, bottom: 70 },
          displayHeaderFooter: true,
          footerTemplate: footer ? footer : "",
          headerTemplate: MAIN_HEADER,
        });

        this._generatedReports.push(`${currentTemplate}.pdf`);
      }

      await browser.close();

      if (await this._mergeGeneratedReports()) {
        console.log("PDF Generated!");
      }
    } catch (err) {
      return err;
    }
  }

  async _getStaticMap({ lat, long, width, height, zoom }) {
    const fullGMAPApiUrl = `${GMAP_URL}?zoom=${zoom}&scale=2&size=${width}x${height}&maptype=terrain&center=${lat},${long},&zoom=${zoom}&markers=icon:${MARKER}%7C${lat},${long}&path=color:0x0000FF80%7Cweight:5%7C${lat},${long}&key=${GMAP_API_KEY}`;
    const mapImageName = `${lat}-${long}-${zoom}.png`;

    const options = {
      url: fullGMAPApiUrl,
      method: "GET",
      encoding: null,
      headers: {
        Accept: "application/json",
        "Accept-Charset": "utf-8",
      },
    };

    return new Promise((resolve, reject) => {
      request(options, async (err, response, body) => {
        try {
          if (err) reject(err);

          await this._uploadFileToS3(body, mapImageName);
          resolve(`https://badea.s3.amazonaws.com/${mapImageName}`);
        } catch (err) {
          console.log(err);
          reject(err);
        }
      });
    });
  }

  _mergeGeneratedReports() {
    const pdfReport = `${PDF_FOLDER_PATH}/sample-masjid.pdf`;

    return new Promise((resolve, reject) => {
      if (!this._generatedReports.length) {
        return resolve(false);
      }

      merge(this._generatedReports, pdfReport, (err) => {
        if (err) return reject(err);

        this._generatedReports.map(
          async (generatedReport) =>
            await promises.unlink(`./${generatedReport}`)
        );

        resolve(true);
      });
    });
  }

  // (TODO) Let's make this run on server but for testing i'm using s3.
  _uploadFileToS3(body, fileName) {
    return new Promise((resolve, reject) => {
      s3.putObject(
        {
          ACL: 'public-read',
          Body: body,
          Key: fileName,
          Bucket: "badea",
          ContentType: 'image/png'
        },
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(fileName);
          }
        }
      );
    });
  }
}

const nextMasjidReport = new NextMasjidReport();

nextMasjidReport
  .activate({
    scoreColor: "#ed462f",
    score: "83",
    prayersInPerimeter: 999,
    distanceToNearestMosque: 13.2,
    populationDensity: 55,
    mosqueDensity: 14,
    long: "36.973914403000001",
    lat: "25.3176452",
    firstNearstMosque: "مسجد الحارثة بن صعب - 3.2 كلم, شمال غرب",
    secondNearstMosque: "مسجد الفضيل بن عياض - 3.3 كلم, شمال شرق",
    thirdNearstMosque: "مسجد - 3.9 كلم, جنوب",
  })
  .then(() => console.log("done !!!"));
