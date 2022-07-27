import YAML from 'yaml';
import fs from 'fs';
import fastify from 'fastify';
import cors from '@fastify/cors';
import fileUpload from 'fastify-file-upload';
import extractZip from 'extract-zip';
import fastifyStatic from '@fastify/static';
import path from 'path';
import OSS from 'ali-oss';

// 检查是否有配置文件
const envExists = fs.existsSync('.env.yaml');
if (!envExists) {
  throw new Error('复制 .env.example.yaml 到 .env.yaml 并填写');
}
const file = fs.readFileSync('.env.yaml', 'utf8');
const config = YAML.parse(file);

// 检查服务器本地上传路径，如果不存在则创建
for (const target of config.targets) {
  if (target.type === 'local' && target.enable) {
    if (!fs.existsSync(target.path)) {
      fs.mkdirSync(target.path, { recursive: true });
    }
  }
}

// 创建 fastify 实例
const app = fastify({
  logger: true, // Enable for logging
});

// 注册 cors 插件
app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// 注册文件上传插件
app.register(fileUpload, {
  debug: false, // Enable for logging
});

// 为服务器本地上传路径注册静态资源服务
for (const target of config.targets) {
  if (target.type === 'local' && target.enable) {
    app.register(fastifyStatic, {
      root: path.resolve(target.path),
      prefix: target.pathname_prefix,
    });
  }
}

// 首页，返回上传目标列表
app.get('/', async (req, reply) => {
  reply.send(
    config.targets.map((target: { name: string }) => target.name)
  );
});

// 上传
app.post('/upload', async (req, reply) => {
  const file = (req.raw as any).files.file;
  const tempFilePath = `./tmp/${Date.now()}.zip`;
  await new Promise<void>((resolve, reject) => {
    file.mv(tempFilePath, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
  
  let dirPath = '';
  await extractZip(tempFilePath, {
    dir: path.resolve('./tmp/'),
    onEntry: (entry) => {
      if (/^font.*\/$/.test(entry.fileName)) {
        dirPath = entry.fileName;
        
      }
    },
  });

  if (dirPath) {
    const tmpDirPath = path.resolve('./tmp/' + dirPath);
    try {
      const target = config.targets.find((target: { name: string }) => target.name === (req.body as any).target);
      console.log((req.body as any).target, target);
      if (!target) {
        throw new Error('未找到上传目标');
      }
      const resultData: string[] = [];
      if(target.type === 'local') {
        fs.mkdirSync(path.resolve(target.path, dirPath), { recursive: true });
        const files = fs.readdirSync(tmpDirPath);
        const uploadDir = path.resolve(target.path, dirPath);
        for (const file of files) {
          const filePath = path.resolve(tmpDirPath, file);
          const fileStat = fs.statSync(filePath);
          if (fileStat.isFile()) {
            fs.copyFileSync(path.resolve(tmpDirPath, file), path.resolve(uploadDir, file));
            if(/^iconfont/.test(file)) {
              resultData.push(`${req.protocol}://${req.hostname}${target.pathname_prefix}${dirPath}${file}`);
            }
          }
        }
      }
      if(target.type === 'oss') {
        const client = new OSS({
          region: target.region,
          accessKeyId: target.access_key_id,
          accessKeySecret: target.access_key_secret,
          bucket: target.bucket,
        });
        const files = fs.readdirSync(tmpDirPath);
        for (const file of files) {
          const filePath = path.resolve(tmpDirPath, file);
          const { url } = await client.put(`${target.pathname_prefix}${dirPath}${file}`, filePath);
          if(/^iconfont/.test(file)) {
            resultData.push(url);
          }
        }
      }
      reply.send({ message: 'success', data: resultData });
    } catch (err) {
      reply.statusCode = 400;
      reply.send({ message: err.message });
    } finally {
      // 删除临时文件
      fs.rmSync(tempFilePath);
      fs.rmSync(tmpDirPath, { recursive: true });
    }
  }
});

// 启动服务
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
