import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private sockets: Map<string, Socket> = new Map();

    constructor() { }

    /**
     * Connect to a specific namespace
     */
    connect(namespace: string): Socket {
        if (this.sockets.has(namespace)) {
            return this.sockets.get(namespace)!;
        }

        const url = new URL(environment.apiUrl);

        // Smart LAN detection: If we are accessing via IP (mobile phone), 
        // and the API is configured as localhost, swap it to the current host
        let origin = url.origin;
        if (url.hostname === 'localhost' && window.location.hostname !== 'localhost') {
            origin = `http://${window.location.hostname}:${url.port}`;
        }

        const socketUrl = `${origin}${namespace}`;
        const socket = io(socketUrl, {
            transports: ['websocket'],
            reconnection: true
        });

        this.sockets.set(namespace, socket);
        return socket;
    }

    /**
     * Disconnect from a specific namespace
     */
    disconnect(namespace: string): void {
        const socket = this.sockets.get(namespace);
        if (socket) {
            socket.disconnect();
            this.sockets.delete(namespace);
        }
    }

    /**
     * Listen to an event from a namespace
     */
    on<T>(namespace: string, event: string): Observable<T> {
        const socket = this.connect(namespace);
        return new Observable<T>(observer => {
            socket.on(event, (data: T) => {
                observer.next(data);
            });
            return () => socket.off(event);
        });
    }

    /**
     * Emit an event to a namespace
     */
    emit(namespace: string, event: string, data: any): void {
        const socket = this.connect(namespace);
        socket.emit(event, data);
    }
}
