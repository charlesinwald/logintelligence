import { Server as SocketIOServer } from 'socket.io';
import './db/index.js';
declare const app: import("express-serve-static-core").Express;
declare const io: SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { app, io };
//# sourceMappingURL=index.d.ts.map