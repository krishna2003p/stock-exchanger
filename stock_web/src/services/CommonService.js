// services/CommonService.js
import fs from 'fs';
import path from 'path';

export async function uploadImage(file, userId, folder = 'uploads') {
    const uploadsDir = path.join(process.cwd(), 'public', folder);

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const extension = path.extname(file.originalFilename || file.newFilename || '.png');
    const filename = `profile_${userId}${extension}`;
    const filepath = path.join(uploadsDir, filename);

    const data = fs.readFileSync(file.filepath); // tmp path
    fs.writeFileSync(filepath, data);

    // Optional: cleanup temp file
    fs.unlinkSync(file.filepath);

    // Return relative path (can be used in <Image src="/uploads/filename" />)
    return `/${folder}/${filename}`;
}
