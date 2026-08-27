import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFile = path.join(process.cwd(), 'users.json');

function getUsers() {
  if (!fs.existsSync(dataFile)) {
    const initial = [{ id: '1', username: 'admin', role: 'Superadmin' }];
    fs.writeFileSync(dataFile, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function saveUsers(users: any) {
  fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
}

export async function GET() {
  return NextResponse.json(getUsers());
}

export async function POST(req: Request) {
  const body = await req.json();
  const users = getUsers();
  const newUser = { id: Date.now().toString(), ...body };
  users.push(newUser);
  saveUsers(users);
  return NextResponse.json(newUser);
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  let users = getUsers();
  users = users.filter((u: any) => u.id !== id);
  saveUsers(users);
  return NextResponse.json({ success: true });
}
