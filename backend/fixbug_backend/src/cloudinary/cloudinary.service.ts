import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import 'multer'; 
@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploaderPlusieursImages(fichiers: Express.Multer.File[]): Promise<string[]> {
    return Promise.all(
      fichiers.map(
        (fichier) =>
          new Promise<string>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'fixbug/bugs' }, (err, res) => {
              if (err || !res) return reject(err);
              resolve(res.secure_url);
            });
            stream.end(fichier.buffer);
          }),
      ),
    );
  }
}