// import { Adapter, BroadcastOptions, Room, SocketId } from "socket.io-adapter";
// import { Redis } from '@upstash/redis';
// import { createClient } from 'redis'

// export class UpstashAdapter extends Adapter {
//     private readonly pubClient: Redis;
//     private readonly subClient: Redis;
//     private readonly channel: string;

//     constructor(nsp: any) {
//         super(nsp);
//         this.channel = `socket.io#${nsp.name}#`;
//         this.pubClient = new Redis({
//             url: process.env.UPSTASH_ccccREDIS_REST_URL,
//             token: process.env.UPSTASH_REDIS_REST_TOKEN,
//         });

//         this.subClient = this.pubClient.duplicate();

//         this.subClient.subscribe(this.channel, (err, count) => {
//             if (err) {
//                 console.error("Failed to subscribe: %s", err.message);
//             } else {
//                 console.log(`Subscribed successfully! This client is currently subscribed to ${count} channels.`);
//             }
//         });

//         this.subClient.on("message", (channel, message) => {
//             if (channel.startsWith(this.channel)) {
//                 this.onMessage(JSON.parse(message));
//             }
//         });
//     }

//     async broadcast(packet: any, opts: BroadcastOptions) {
//         const onlyLocal = opts && opts.flags && opts.flags.local;

//         if (!onlyLocal) {
//             const msg = JSON.stringify([packet, opts]);
//             if (opts.rooms && opts.rooms.size > 0) {
//                 for (const room of opts.rooms) {
//                     await this.pubClient.publish(`${this.channel}${room}`, msg);
//                 }
//             } else {
//                 await this.pubClient.publish(this.channel, msg);
//             }
//         }

//         super.broadcast(packet, opts);
//     }

//     async addAll(id: SocketId, rooms: Set<Room>) {
//         await super.addAll(id, rooms);
//         for (const room of rooms) {
//             await this.subClient.subscribe(`${this.channel}${room}`);
//         }
//     }

//     async del(id: SocketId, room: Room) {
//         await super.del(id, room);
//         if (this.rooms.get(room)?.size === 0) {
//             await this.subClient.unsubscribe(`${this.channel}${room}`);
//         }
//     }

//     private onMessage(args: [any, BroadcastOptions]) {
//         const packet = args[0];
//         const opts = args[1];
//         const isTransmission = opts.flags && opts.flags.transmission;

//         if (isTransmission) {
//             super.broadcast(packet, opts);
//         }
//     }
// }