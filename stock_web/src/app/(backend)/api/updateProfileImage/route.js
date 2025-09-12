import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/tokenHandler';
import { updateProfileImage,updateUserDetails } from '@/services/UserService';
import path from 'path';
import { writeFile } from 'fs/promises';

export const POST = async (req) => {
  try {
    // Auth check
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('profile_img');
    if (!file) {
      return NextResponse.json({ error: 'No image file uploaded' }, { status: 400 });
    }

    // Convert blob to buffer and write to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${user.id}_profile` + path.extname(file.name);
    const destPath = path.join(process.cwd(), 'public/user_profiles', filename);

    await writeFile(destPath, buffer);

    // You may want to store a relative path or a full URL:
    const imagePath = `/user_profiles/${filename}`;

    // Update user profile image in DB
    const updatedUser = await updateProfileImage(user.id, imagePath );

    return NextResponse.json(
      { message: 'Profile image updated successfully', user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating profile image:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
};
