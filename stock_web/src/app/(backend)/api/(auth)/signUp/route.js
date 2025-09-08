/* ******************************************************************************
|                         PURPOSE OF API :: Register New User                   |
| *******************************************************************************
| POST() - Registers a new user by validating inputs, hashing the password, and
|          storing user data in the database. Generates and returns a JWT.
*/

import { NextResponse } from "next/server";
import * as yup from "yup";
import prisma from "@/utils/prismadb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const Schema = yup.object().shape({
  name: yup
    .string()
    .required("name is required")
    .min(2, "name must be at least 2 characters long")
    .matches(/^[a-zA-Z0-9 ]+$/, "name cannot contain special characters")
    .matches(/^\S(?:.*\S)?$/, "name cannot contain leading or trailing spaces"),
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required")
    .test("is-present", "Email is required", (v) => v?.trim() !== "")
    .matches(/^[^\s@]+@[^\s@]+\.(com|in|co|org|net|gov|edu|biz)(\.[a-zA-Z]{2})?$/, "Invalid email address")
    .test("single-extension", "Only one extension is allowed per email address", (v) =>
      ((v?.split("@")[21] || "").match(/\./g) || []).length <= 2
    )
    .matches(/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)?@[^\s@]+$/, "Only letters, numbers, dots, and underscores are allowed before the @ symbol and only one dot is allowed"),
  username: yup
    .string()
    .required("username is required")
    .matches(/^(?!0+$)[a-zA-Z0-9@_]+$/, 'username cannot contain special characters except @ and _, and cannot be only "0"')
    .test("not-only-space", "username cannot consist only of spaces", (v) => !/^\s+$/.test(v || ""))
    .test("not-only-special-characters", "username cannot consist only of special characters", (v) => !/^[@_ ]+$/.test(v || "")),
  mobile: yup.string().matches(/^[0-9]{10}$/, "Invalid mobile number"),
  password: yup.string().required("Password is required"),
});

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type");
    const body =
      contentType && contentType.includes("application/json")
        ? await request.json()
        : {};
    await Schema.validate(body);

    const { name, username, email, mobile, password } = body;

    // Check existence by username (you may also want to ensure unique email)
    const existing = await prisma.users.findUnique({ where: { username } });
    if (existing) {
      // Not setting cookie for "already exists" response; consider returning 409 instead
      return NextResponse.json({ status: 200, message: "User Already Exists", data: { id: existing.id, username: existing.username, email: existing.email, mobile: existing.mobile, role: existing.role } });
    }

    // Hash password
    const saltRounds = 10; // stronger default than 2
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.users.create({
      data: {
        name,
        username,
        mobile,
        email,
        password: hashedPassword,
      },
    });

    // Require configured secret
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ status: 500, error: "Missing JWT secret" }, { status: 500 });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, mobile: user.mobile, type: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Persist token row
    await prisma.users_token.upsert({
      where: { user_id: user.id },
      update: { token },
      create: { user_id: user.id, token },
    });

    // Sanitize user (omit hashed password)
    const { password: _pw, ...safeUser } = user;

    // Set cookie and return response
    const res = NextResponse.json({ status: 200, message: "User Created Successfully", data: safeUser });
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/", // allow middleware and all routes to read it
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    });
    return res;
  } catch (error) {
    return NextResponse.json({ status: 500, error: error.message }, { status: 500 });
  } finally {
    // In Next.js App Router, it's not recommended to $disconnect per request; let the client reuse connections
    // await prisma.$disconnect();
  }
}
