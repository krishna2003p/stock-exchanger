/* ******************************************************************************
|                         PURPOSE OF API :: Login the Panel                     |
| *******************************************************************************
| POST() - Authenticates an agent, validates credentials, and issues a JWT.
*/

import { NextResponse } from "next/server";
import * as yup from "yup";
import prisma from "@/utils/prismadb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const schema = yup.object().shape({
  username: yup.string().required("username is required"),
  password: yup.string().required("Password is required"),
});

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type");
    const body =
      contentType && contentType.includes("application/json")
        ? await request.json()
        : {};
    await schema.validate(body);

    const { username, password } = body;

    // Find user (username should be unique)
    const user_data = await prisma.users.findUnique({ where: { username } });
    if (!user_data) {
      return NextResponse.json(
        { error: "Invalid credentials", message: "Invalid credentials.", status: 401, data: {} },
        { status: 401 }
      );
    }

    // Verify password
    const ok = await bcrypt.compare(password, user_data.password);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid credentials", message: "Invalid credentials.", status: 401, data: {} },
        { status: 401 }
      );
    }

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: "Server misconfiguration", message: "Missing JWT secret.", status: 500 },
        { status: 500 }
      );
    }
    const token = jwt.sign(
      {
        id: user_data.id,
        username: user_data.username,
        mobile: user_data.mobile,
        type: user_data.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Persist token (upsert avoids missing row errors)
    await prisma.users_token.upsert({
      where: { user_id: user_data.id },
      update: { token },
      create: { user_id: user_data.id, token },
    });

    // Sanitize user (omit password)
    const { password: _pw, ...safeUser } = user_data;

    // Set HttpOnly cookie
    const res = NextResponse.json({
      status: 200,
      message: "Logged In Successfully",
      data: { ...safeUser },
    });
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    });
    return res;
  } catch (error) {
    return NextResponse.json(
      { status: 500, error: error.message || "Internal error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect(); 
  }
}
