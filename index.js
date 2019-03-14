
/**
 * Module dependencies.
 */

const logger = require('koa-logger');
const koaBody = require('koa-body');
const Koa = require('koa');
const fs = require('fs');
const app = new Koa();
const send = require('koa-send');

// log requests

app.use(logger());

app.use(koaBody({
  'formLimit': '20mb',
}));

// handle uploads

app.use(async function (ctx, next) {
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

// listen

app.listen(3000);
console.log('listening on port 3000');
