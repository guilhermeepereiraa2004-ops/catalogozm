import {waitUntil} from '@vercel/functions';
import {createVercelHandler} from '../server/vercel.js';

export default createVercelHandler(process.env, {defer: waitUntil});
