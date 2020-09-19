## Next Masjid report generator

Script to generate reports about maps using puppeteer and headleass chrome.
The script will take a map location, along with several other variables (text, numbers, pictures) and generate a 3-page PDF (where first and last pages are static).

Require Node 12+.

### Usage

In order to run the script you will need to run this commands and create a new next masjid report object, as follow :

First install deps :
```yarn install```

Then cd into the src dic :
```cd src```

Run the script :
```node index.js```

```
const config = {
  GMAPApiKey: "add google map api key here",
  s3StorageData: {
    accessKeyId: "key id s3",
    secretAccessKey: "secret key s3",
    url: "endpoint for s3",
    bucket: "bucket to save data into",
  }
}
const nextMasjidReport = new NextMasjidReport(config);
nextMasjidReport.activate({
    scoreColor: '#ffffff',
    score: 39,
    ....
    ...
});
```

Next masjid script accepts a config object for configuration with optional parameters and a data object pased to the global activate method to generate reports and returns final pdf file.

Here’s a table of the parameters you can pass with their explanation:

#### Config Object

<table>
  <tr>
    <td>Parameter</td>
    <td>Explanation</td>
    <td>Values</td>
  </tr>
  <tr>
    <td>GMAPApiKey</td>
    <td>This script uses google map static api to generate photos of the location so this api key is needed in order to utlize GMAPthe api.</td>
    <td>String</td>
  </tr>
  <tr>
    <td>s3StorageData(optional)</td>
    <td>This script provides and optional param if set in the config obj the images and pdfs will be hosted on s3 object storage.</td>
    <td>{
    accessKeyId: "key id s3",
    secretAccessKey: "secret key s3",
    url: "endpoint for s3",
    bucket: "bucket to save data into",
    }</td>
  </tr>
  
</table>

#### Activate Object

<table>
  <tr>
    <td>Parameter</td>
    <td>Values</td>
  </tr>
  <tr>
    <td>scoreColor</td>
    <td>String, example : #ed462f</td>
  </tr>
  <tr>
    <td>score</td>
    <td>Number</td>
  </tr>
  <tr>
    <td>prayersInPerimeter</td>
    <td>Number</td>
  </tr>
  <tr>
    <td>distanceToNearestMosque</td>
    <td>Number</td>
  </tr>
  <tr>
    <td>populationDensity</td>
    <td>Number</td>
  </tr>
  <tr>
    <td>mosqueDensity</td>
    <td>Number</td>
  </tr>
  <tr>
    <td>long</td>
    <td>String</td>
  </tr>
  <tr>
    <td>lat</td>
    <td>String</td>
  </tr>
  <tr>
    <td>qrcodeUrl</td>
    <td>String, example: google.com </td>
  </tr>
  <tr>
    <td>firstNearstMosque</td>
    <td>String</td>
  </tr>
   <tr>
    <td>secondNearstMosque</td>
    <td>String</td>
  </tr>
   <tr>
    <td>thirdNearstMosque</td>
    <td>String</td>
  </tr>
</table>
