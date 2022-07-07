import dotenv from 'dotenv';
import fastify from 'fastify';
import cors from '@fastify/cors';
import fileUpload from 'fastify-file-upload';
import extractZip from 'extract-zip';
import fastifyStatic from '@fastify/static';
import path from 'path';
import OSS from 'ali-oss';

// Load environment variables from .env file
const { parsed: config = {} } = dotenv.config();

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
    let data: string[] = [];
    let ossClient: OSS | null = null;
    if (config.OSS_ENABLE === 'true') {
      ossClient = new OSS({
        region: config.OSS_REGION,
        accessKeyId: config.OSS_ACCESS_KEY_ID,
        accessKeySecret: config.OSS_ACCESS_KEY_SECRET,
        bucket: config.OSS_BUCKET,
      });
    }

    const ossTasks: string[] = [];
    await extractZip(filepath, {
      dir: path.resolve('./uploads/'),
      onEntry: (entry) => {
        if (/iconfont/.test(entry.fileName)) {
          let url = '';
          if (ossClient) {
            ossTasks.push(entry.fileName);
            url = `https://${config.OSS_BUCKET}.${config.OSS_REGION}.aliyuncs.com/${config.OSS_PATH_PREFIX}${entry.fileName}`;
          } else {
            url = req.protocol + '://' + req.hostname + '/uploads/' + entry.fileName;
          }
          data.push(url)
        }
      },
    });
    if (ossClient) {
      console.log('waiting for oss tasks to finish');
      await Promise.all(ossTasks.map((fileName) => {
        return (ossClient as OSS).put(
          config.OSS_PATH_PREFIX + fileName,
          path.resolve('./uploads/', fileName)
        )
      }));
    }
    reply.send({ message: 'success', data });
  } catch (err) {
    console.log(err);
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
