import { Context } from '../context.js'
import jwt from 'jsonwebtoken'

export const APP_SECRET = process.env.APP_SECRET || 'appsecret321'

interface Token {
  userId: number
}

// src/utils.ts
export function getUserId(context: Context) {
  const authHeader = context.req.headers.authorization;
  console.log('Auth Header:', authHeader); // Debugging
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const verifiedToken = jwt.verify(token, APP_SECRET) as Token;
      console.log('Verified Token:', verifiedToken); // Debugging
      return verifiedToken.userId;
    } catch (error) {
      console.error('Token Verification Error:', error); //debugging
      throw new Error('Not authenticated');
    }
  }
  throw new Error('Not authenticated');
}

