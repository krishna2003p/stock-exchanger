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

// Filter datetime value to 'YYYY-MM-DD HH:MM:SS' format
export function formatDateTime(input) {
    const date = new Date(input);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}
