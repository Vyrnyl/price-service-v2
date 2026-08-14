import { Request, Response } from 'express';
import AppError from '../../shared/utils/AppError';
import { userService } from './user.service';
import { changePasswordSchema, createUserSchema, updateProfileSchema, updateUserSchema, userIdParamSchema } from './user.schema';
import { auditLogService } from '../audit-log';
import type { AuthUser } from '../../shared/types/express';

export const userController = {
  getCurrentUser: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser;
    const user = await userService.getCurrentUser(authUser.userId);
    res.json(user);
  },

  updateCurrentUser: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser;
    const validatedBody = updateProfileSchema.parse(req.body);
    const user = await userService.updateProfile(authUser.userId, validatedBody);
    res.json(user);
  },

  changeCurrentUserPassword: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser;
    const validatedBody = changePasswordSchema.parse(req.body);
    await userService.changePassword(authUser.userId, validatedBody);
    res.status(204).send();
  },

  createUser: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;
    const validatedBody = createUserSchema.parse(req.body);
    const user = await userService.createUser(validatedBody);

    if (authUser) {
      await auditLogService.record({
        actorId: authUser.userId,
        action: 'USER_CREATE',
        targetId: user.id,
        metadata: { name: user.name, email: user.email, role: user.role },
      });
    }

    res.status(201).json(user);
  },

  getUsers: async (req: Request, res: Response) => {
    const users = await userService.getUsers();
    res.json(users);
  },

  getUserById: async (req: Request, res: Response) => {
    userIdParamSchema.parse(req.params);
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json(user);
  },

  updateUser: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;
    userIdParamSchema.parse(req.params);
    const validatedBody = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(req.params.id, validatedBody);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (authUser) {
      await auditLogService.record({
        actorId: authUser.userId,
        action: 'USER_UPDATE',
        targetId: user.id,
        metadata: { fields: Object.keys(validatedBody) },
      });
    }

    res.json(user);
  },

  deleteUser: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;
    userIdParamSchema.parse(req.params);
    const deletedUser = await userService.deleteUser(req.params.id);

    if (!deletedUser) {
      throw new AppError('User not found', 404);
    }

    if (authUser) {
      await auditLogService.record({
        actorId: authUser.userId,
        action: 'USER_DELETE',
        targetId: deletedUser.id,
        metadata: { name: deletedUser.name, email: deletedUser.email },
      });
    }

    res.status(204).send();
  },
};
