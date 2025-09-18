import jwt from 'jsonwebtoken'
const AUTH = process.env.JWT_SECRET

//<><><><><><><><><><><><><><><><><> DECODE TOKEN FOR GET USER_ID <><><><><><><><><><><><><><><><><><><><<>
// export const verifyToken = async (request) => {
//     const authorizationHeader = request.headers.get('authorization');
//     try {
//         const token = authorizationHeader.slice('Bearer '.length);
//         console.log('token',token);
//         console.log('auth',AUTH);
//         const verified = await jwt.verify(token, AUTH);
//         return verified;
//     } catch (error) {
//         console.error('Error verifying token:', error); 
//         throw new Error(error);
//     }
// };

export const verifyToken = async (request) => {
    console.log("Execute verifyToken funciton")
  const cookie = request.headers.get('cookie') || '';
  console.log("Cookie:: ",cookie)

  const tokenCookie = cookie.split('; ').find(c => c.startsWith('token='));
  if (!tokenCookie) {
    throw new Error('No token cookie found');
  }
  const token = tokenCookie.split('=')[1];
  const verified = await jwt.verify(token, process.env.JWT_SECRET);
  return verified;
};