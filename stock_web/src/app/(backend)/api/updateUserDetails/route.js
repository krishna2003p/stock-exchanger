// This API route handles updating user details.
/**
    * If the token is valid, the request is allowed to proceed; otherwise, a 401 Unauthorized response is returned.
    * The middleware is applied to all API routes.
    * This middleware is applied to all frontend routes as well.
    **/
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/tokenHandler'; 
import { updateUserDetails } from '@/services/UserService'; 
import * as yup from 'yup';

const userSchema = yup.object().shape({
    name: yup.string().required(),
    email: yup.string()
    .email("Invalid email address")
    .required("Email is required")
    .test("is-present", "Email is required", (v) => v?.trim() !== "")
    .matches(/^[^\s@]+@[^\s@]+\.(com|in|co|org|net|gov|edu|biz)(\.[a-zA-Z]{2})?$/, "Invalid email address")
    .test("single-extension", "Only one extension is allowed per email address", (v) =>
      ((v?.split("@")[21] || "").match(/\./g) || []).length <= 2
    )
    .matches(/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)?@[^\s@]+$/, "Only letters, numbers, dots, and underscores are allowed before the @ symbol and only one dot is allowed"),
    mobile: yup.string().matches(/^[0-9]{10}$/, "Invalid mobile number"),
    location: yup.string().optional(),
    bio: yup.string().optional(),
    company: yup.string().optional(),
    website: yup.string().optional(),
    facebook: yup.string().optional(),
    twitter: yup.string().optional(),
    linkedin: yup.string().optional(),
    instagram: yup.string().optional(),
    github: yup.string().optional(),
    telegram: yup.string().optional(),
});

export async function POST(request) {
    try {
        const user = await verifyToken(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        await userSchema.validate(body);
        
        // Update user details in the database
        const updatedUser = await updateUserDetails(user.id, body);

        return NextResponse.json({ message: 'User details updated successfully', user: updatedUser }, { status: 200 });

    } catch (error) {
        console.error('Error updating user details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
    