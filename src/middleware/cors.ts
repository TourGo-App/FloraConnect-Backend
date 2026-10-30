import cors from 'cors';
import { allowedOrigins } from '../config/env.js';

export const frontendCors = cors({ origin: allowedOrigins });
