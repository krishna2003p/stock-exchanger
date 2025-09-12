import jwt from 'jsonwebtoken'
const AUTH = process.env.JWT_SECRET

//<><><><><><><><><><><><><><><><><> DECODE TOKEN FOR GET USER_ID <><><><><><><><><><><><><><><><><><><><<>
export const verifyToken = async (request) => {
    const authorizationHeader = request.headers.get('authorization');
    try {
        const token = authorizationHeader.slice('Bearer '.length);
        console.log('token',token);
        console.log('auth',AUTH);
        const verified = await jwt.verify(token, AUTH);
        return verified;
    } catch (error) {
        console.error('Error verifying token:', error); 
        throw new Error(error);
    }
};