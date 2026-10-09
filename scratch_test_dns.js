const dns = require('node:dns/promises');
const fs = require('fs');

async function test() {
  const res = {};
  try {
    res.a = await dns.resolve4('google.com');
  } catch (e) {
    res.aError = e.message;
  }
  try {
    res.mx = await dns.resolveMx('google.com');
  } catch (e) {
    res.mxError = e.message;
  }
  fs.writeFileSync('C:/Users/Naren/Downloads/SAFENET/dns_output.json', JSON.stringify(res, null, 2));
}
test();
