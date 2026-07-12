import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private sockets: Map<string, Socket> = new Map();

    constructor(private auth: AuthService) { }

    connect(namespace: string): Socket {
        if (this.sockets.has(namespace)) {
            return this.sockets.get(namespace)!;
        }

        const url = new URL(environment.apiUrl);
        let origin = url.origin;
        if (url.hostname === 'localhost' && window.location.hostname !== 'localhost') {
            origin = `http://${window.location.hostname}:${url.port}`;
        }

        const socketUrl = `${origin}${namespace}`;
        const token = this.auth.getToken();
        const socket = io(socketUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            auth: { token }
        });

        socket.on('connect', () => {
            console.log(`✅ Socket connected to ${namespace} (id=${socket.id})`);
        });

        socket.on('connect_error', (err) => {
            console.error(`❌ Socket connect_error on ${namespace}:`, err.message);
        });

        socket.on('disconnect', (reason) => {
            console.warn(`⚠️ Socket disconnected from ${namespace}: ${reason}`);
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

    emit(namespace: string, event: string, data?: any): void {
        const socket = this.connect(namespace);
        // Socket.IO natively buffers emit calls until connected!
        socket.emit(event, data);
    }

    /**
     * Returns an observable that fires once when the socket connects.
     */
    onConnect(namespace: string): Observable<void> {
        const socket = this.connect(namespace);
        return new Observable<void>(observer => {
            if (socket.connected) {
                observer.next();
            } else {
                socket.once('connect', () => observer.next());
            }
        });
    }

    /**
     * Returns an observable for connection errors.
     */
    onConnectError(namespace: string): Observable<Error> {
        const socket = this.connect(namespace);
        return new Observable<Error>(observer => {
            socket.on('connect_error', (err: Error) => observer.next(err));
            return () => socket.off('connect_error');
        });
    }
}
