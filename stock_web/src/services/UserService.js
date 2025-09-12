// This Service File handles user-related operations such as updating user details.
import prisma from "@/utils/prismadb";


// Function to update user details in the database
export const updateUserDetails = async (userId, userDetails) => {
    try {
        const { name, email, mobile,  location, bio, company, website, facebook, twitter, linkedin, instagram, github, telegram } = userDetails;

        const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: {
                name,
                email,
                mobile,
                location,
                bio,
                company,
                website,
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                mobile: true,
                profile_img: true,
                role: true,
                location: true,
                bio: true,
                company: true,
                website: true,
            },
        });

        await prisma.users_social_details.upsert({
            where: { user_id: userId },
            update: {
                facebook,
                twitter,
                linkedin,
                instagram,
                github,
                telegram,
            },
            create: {
                user_id: userId,
                facebook,
                twitter,
                linkedin,
                instagram,
                github,
                telegram,
            },
        });
        const userData = {...updatedUser, facebook, twitter, linkedin, instagram, github, telegram };
        return userData;

    } catch (error) {
        console.error('Error updating user details in UserService:', error);
        throw error;
    }
};

// Function to update only the profile image of the user
export const updateProfileImage = async (userId, imagePath) => {
    try {
        const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: { profile_img: imagePath },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                mobile: true,
                profile_img: true,
                role: true,
                location: true,
                bio: true,
                company: true,
                website: true,
            },
        });
        return updatedUser;
    } catch (error) {
        console.error('Error updating profile image in UserService:', error);
        throw error;
    }
};
// Function to get user details from the database
export const getUserDetails = async (userId) => {
    try {
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                mobile: true,
                profile_img: true,
                role: true,
                location: true,
                bio: true,
                company: true,
                website: true,
                
            },
        });

        const socialMedia = await prisma.users_social_details.findUnique({
            where: { user_id: userId },
            select: {
                facebook: true,
                twitter: true,
                linkedin: true,
                instagram: true,
                github: true,
                telegram: true,
            },
        });

        return { ...user, ...socialMedia };

    } catch (error) {
        console.error('Error retrieving user details in UserService:', error);
        throw error;
    }
};