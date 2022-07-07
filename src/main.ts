import dotenv from 'dotenv';
import fastify from 'fastify';
import cors from '@fastify/cors';
import fileUpload from 'fastify-file-upload';
import extractZip from 'extract-zip';
import fastifyStatic from '@fastify/static';
import path from 'path';

// Load environment variables from .env file
const { parsed: config } = dotenv.config();

// Create a fastify instance
const app = fastify({
  logger: true, // Enable for logging
});

// Register cord plugin
app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Register file upload plugin
app.register(fileUpload, {
  debug: false, // Enable for logging
});

app.register(fastifyStatic, {
  root: path.resolve('./uploads'),
  prefix: '/uploads/',
});

// homepage
app.get('/', async (req, reply) => {
  reply.send({ hello: 'world' });
});

// upload iconfont zip file
app.post('/upload', async (req, reply) => {
  const file = (req.raw as any).files.file;
  const filename = 'download.zip';
  const filepath = './uploads/' + filename;
  try {
    await new Promise<void>((resolve, reject) => {
      file.mv(filepath, (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
    let data: any = {};

    await extractZip(filepath, {
      dir: path.resolve('./uploads/'),
      onEntry: (entry) => {
        const url = req.protocol + '://' + req.hostname + '/uploads/' + entry.fileName;
        if (entry.fileName.endsWith('iconfont.js')) {
          data.js = url;
        }
        if (entry.fileName.endsWith('iconfont.css')) {
          data.css = url;
        }
      },
    });
    reply.send({ message: 'success', data });
  } catch (err) {
    reply.statusCode = 500;
    reply.send({ message: err });
  }
});

// start the server
(async () => {
  try {
    await app.listen({
      port: config?.PORT ? Number(config.PORT) : 8888,
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
})();
