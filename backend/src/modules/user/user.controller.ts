import { Request, Response } from 'express';
import AppError from '../../shared/utils/AppError';
import { userService } from './user.service';
import { createUserSchema, updateUserSchema, userIdParamSchema } from './user.schema';

export const userController = {
  createUser: async (req: Request, res: Response) => {
    const validatedBody = createUserSchema.parse(req.body);
    const user = await userService.createUser(validatedBody);
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
    userIdParamSchema.parse(req.params);
    const validatedBody = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(req.params.id, validatedBody);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json(user);
  },

  deleteUser: async (req: Request, res: Response) => {
    userIdParamSchema.parse(req.params);
    const deletedUser = await userService.deleteUser(req.params.id);

    if (!deletedUser) {
      throw new AppError('User not found', 404);
    }

    res.status(204).send();
  },
};
