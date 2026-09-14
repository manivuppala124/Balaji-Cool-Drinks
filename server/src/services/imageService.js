import { v2 as cloudinary } from 'cloudinary';

const configured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Image storage abstraction.
 * When Cloudinary is configured, uploads go there.
 * Otherwise callers should store external/public image URLs.
 */
export const uploadImageBuffer = async (buffer, folder = 'sri-balaji') => {
  if (!configured) {
    return {
      success: false,
      message: 'Cloudinary is not configured. Provide an image URL instead.',
    };
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.end(buffer);
  });

  return { success: true, url: result.secure_url, publicId: result.public_id };
};

export const isCloudinaryConfigured = () => Boolean(configured);
