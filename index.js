const https = require('https');
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const CHANNEL_ID = process.env.CHANNEL_ID;
const CHANNEL_DEBUG_ID = process.env.CHANNEL_DEBUG_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const POLLING_INTERVAL = process.env.POLLING_INTERVAL;

let poll_count = 0;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
  , disableEveryone: false
});
const optionsList = [{
  hostname: 'service2.diplo.de',
  path: '/rktermin/extern/choose_categoryList.do?locationCode=isla&realmId=108',
  method: 'GET',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
},
{
  hostname: 'service2.diplo.de',
  path: '/rktermin/extern/appointment_showForm.do?locationCode=isla&realmId=108&categoryId=2454',
  method: 'GET',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
}];
function check_data(data) {
  if (data.search("zum Datenschutz und Nutzungshinweise") != -1) {
    client.channels.cache.get(CHANNEL_DEBUG_ID).send("Attempting to find the change Count: " + poll_count);
    console.log("Attempting to find the change Count: " + poll_count);
    if (data.search("Chancenkarte") != -1 || data.search("Opportunity Card") != -1) {
      return 1;
    }
  } else {
    client.channels.cache.get(CHANNEL_DEBUG_ID).send("An error has occured while fetching the page. Trying Again.");
    fs.mkdirSync("error/", { recursive: true })
    fs.writeFileSync("error/page_" + poll_count + ".html", data);
  }
  return 0;
}
function get_webpage(option) {
  https.get(option, function (res) {
    console.log(option);
    res.setEncoding('utf8');
    var data = '';
    res.on('data', function (chunk) {
      data += chunk
    });
    res.on('end', function () {
      console.log("end");
      if (check_data(data)) {
        console.log("found it!");
        client.channels.cache.get(CHANNEL_ID).send("@everyone its up; go fill in the form right now");
        client.channels.cache.get(CHANNEL_ID).send(`@everyone https://${option.hostname}${option.path}`);
        fs.mkdirSync("page/", { recursive: true })
        fs.writeFileSync("page/page_" + poll_count + ".html", data);
      }
      poll_count = poll_count + 1;
    })
  }).on('error', function (err) {
    console.log(err);
  });
}

client.on('ready', () => {
  client.channels.cache.get(CHANNEL_ID).send(`Polling started! Interval time: ${POLLING_INTERVAL}. Scanning ${optionsList.length} URLs`);
  function poll() {
    console.log(`Logged in as ${client.user.tag}!`);
    for (let i = 0; i < optionsList.length; i++) {
      get_webpage(optionsList[i]);
    }
  }
  setInterval(poll, POLLING_INTERVAL);
});


client.login(DISCORD_TOKEN);

