import { JWT_SECRET } from '../config/utils.js';
import { ApiError } from '../utils/api-error.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../utils/constants.js';
import jwt from 'jsonwebtoken';
import { Role } from '../types/role-type.js';
import User from '../models/user.js';

import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongoose';

interface JwtPayload {
  id: ObjectId;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from cookies
    const token = req.cookies.access_token;

    console.log('Token:', token);

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please log in again',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload;

    // Find user
    const user = await User.findById(decoded.id);

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error: any) {
    console.log('Token verification error:', error);

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const isAdminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.user.role;

    if (role !== Role.Admin) {
      return res.status(403).json({
        success: false,
        message: RESPONSE_MESSAGES.USERS.UNAUTHORIZED_USER,
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};
