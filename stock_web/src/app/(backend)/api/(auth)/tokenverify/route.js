import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
const AUTH = process.env.JWT_SECRET
export async function GET(req) {
    try{
        console.log("Token Verify Called")
        const token = req.headers.get('authorization').slice('Bearer '.length);
        console.log("==================")
        console.log(token)
        const verified = await jwt.verify(token, AUTH);
        
        return NextResponse.json(verified, { status: 200 });
    }
    
    catch (error) {
        return NextResponse.json({ error: error }, { status: 401 });
    }
}