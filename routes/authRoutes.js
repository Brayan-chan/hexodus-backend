import express from 'express';
import { signUp, signIn, signOut, getUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/auth/signup', signUp);
router.post('/auth/signin', signIn);
router.post('/auth/signout', signOut);
router.get('/auth/user', getUser);

export default router;