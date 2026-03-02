const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'aura-studio-hack',
});

const BUCKET_NAME = process.env.GCS_BUCKET || 'aura-studio-hack-assets';
const bucket = storage.bucket(BUCKET_NAME);

// Upload a buffer (image, file) to Cloud Storage
async function uploadFile(buffer, filename, contentType = 'application/octet-stream') {
  const uniqueName = `${uuidv4()}-${filename}`;
  const file = bucket.file(uniqueName);

  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });

  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${uniqueName}`;
  return { url: publicUrl, filename: uniqueName };
}

// Upload base64 image to Cloud Storage
async function uploadBase64Image(base64Data, filename = 'image.png') {
  const buffer = Buffer.from(base64Data, 'base64');
  return uploadFile(buffer, filename, 'image/png');
}

// Upload JSON campaign pack
async function uploadCampaignPack(campaignData, sessionId) {
  const filename = `campaign-pack-${sessionId}.json`;
  const buffer = Buffer.from(JSON.stringify(campaignData, null, 2));
  return uploadFile(buffer, filename, 'application/json');
}

// List files in bucket
async function listFiles(prefix = '') {
  const [files] = await bucket.getFiles({ prefix });
  return files.map((f) => ({
    name: f.name,
    url: `https://storage.googleapis.com/${BUCKET_NAME}/${f.name}`,
    size: f.metadata.size,
    created: f.metadata.timeCreated,
  }));
}

module.exports = {
  uploadFile,
  uploadBase64Image,
  uploadCampaignPack,
  listFiles,
};
