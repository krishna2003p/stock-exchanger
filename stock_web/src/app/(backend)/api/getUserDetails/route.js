// This API route handles updating user details.
/**
    * If the token is valid, the request is allowed to proceed; otherwise, a 401 Unauthorized response is returned.
    * The middleware is applied to all API routes.
    * This middleware is applied to all frontend routes as well.
    **/
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/tokenHandler'; 
import { getUserDetails } from '@/services/UserService'; 

export async function POST(request) {
    try {
        const user = await verifyToken(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Update user details in the database
        const updatedUser = await getUserDetails(user.id);

        return NextResponse.json({ message: 'User details retrieved successfully', user: updatedUser }, { status: 200 });

    } catch (error) {
        console.error('Error retrieving user details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
    