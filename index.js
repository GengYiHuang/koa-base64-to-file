/**
 * Module dependencies.
 */

const logger = require('koa-logger');
const koaBody = require('koa-body');
const Koa = require('koa');
const http = require('http');
const https = require('https');
const fs = require('fs');
const sslify = require('koa-sslify').default;
const app = new Koa();
const send = require('koa-send');

// log requests
app.use(sslify());
app.use(logger());

app.use(koaBody({
  'formLimit': '20mb',
}));

// handle uploads

app.use(async function (ctx, next) {
  ctx.set("Access-Control-Allow-Origin", "*")
  ctx.set("Access-Control-Allow-Headers", "X-Requested-With")
  // ignore non-POSTs
  if ('POST' != ctx.method) return await next();

  const { img } = ctx.request.body;
  try {
    const filePath = `storage/${Date.now().toString() + Math.random().toString(36).substring(2)}.${img.split('data:image/').pop().split(';base64,')[0]}`;
    fs.writeFile(filePath, img.split(';base64,').pop(), 'base64', (err) => {
      if (err) {
        ctx.throw(500, 'Internal Server Error');
      }
    });
    const url = ctx.request.href + filePath.split('storage/').pop();
    ctx.body = { url };
  } catch (error) {
    ctx.throw(403, 'Illegal Img');
  }
});

// handle downloads

app.use(async (ctx) => {
  await send(ctx, ctx.path, { root: __dirname + '/storage' });
});

// SSL options
var options = {
    key: fs.readFileSync('/etc/ssl/private.key'),
    cert: fs.readFileSync('/etc/ssl/certificate.crt')
    //key: fs.readFileSync('/etc/apache2/server.key'),  //ssl文件路径
    //cert: fs.readFileSync('/etc/apache2/server.cer')  //ssl文件路径
};

// listen
http.createServer(app.callback()).listen(3006);
https.createServer(options, app.callback()).listen(3005);
console.log('listening on port 3005 & 3006');
