import { Component, OnInit, OnDestroy, signal, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SocketService } from '@core/services/socket.service';

@Component({
    selector: 'app-camera-source',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './camera-source.component.html',
    styleUrl: './camera-source.component.scss'
})
export class CameraSourceComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private socketService = inject(SocketService);

    @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;

    matchId = signal<number | null>(null);
    cameraLabel = signal('Front Camera');
    isStreaming = signal(false);
    isConnected = signal(false);
    errorMessage = signal<string | null>(null);
    useRearCamera = signal(true);

    // Camera settings
    videoQuality = signal<'low' | 'medium' | 'high'>('medium');

    private localStream: MediaStream | null = null;
    private peerConnections: Map<string, RTCPeerConnection> = new Map();

    // STUN servers for NAT traversal
    private rtcConfig: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
    };

    private iceCandidateQueue: Map<string, RTCIceCandidateInit[]> = new Map();

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.matchId.set(+params['id']);
        });

        // Read query params for label
        this.route.queryParams.subscribe(params => {
            if (params['label']) {
                this.cameraLabel.set(params['label']);
            }
            if (params['cam'] === 'front') {
                this.useRearCamera.set(false);
            }
        });
    }

    ngOnDestroy(): void {
        this.stopStream();
        this.socketService.disconnect('/broadcast');
    }

    async startCamera(): Promise<void> {
        try {
            this.errorMessage.set(null);

            // Check if mediaDevices is supported (only available in Secure Contexts: HTTPS or localhost)
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                const isNotSecure = window.location.protocol !== 'https:' && window.location.hostname !== 'localhost';
                if (isNotSecure) {
                    this.errorMessage.set('Security Error: Mobile browsers block camera on HTTP. \n\n' +
                        'Chrome Android fix: Open chrome://flags/#unsafely-treat-insecure-origin-as-secure, ' +
                        'enable it, and add "http://' + window.location.host + '" to the list.');
                } else {
                    this.errorMessage.set('Your browser does not support camera features.');
                }
                return;
            }

            const quality = this.getQualityConstraints();

            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: this.useRearCamera() ? 'environment' : 'user',
                    ...quality
                },
                audio: true
            });

            // Show local preview
            if (this.localVideoRef?.nativeElement) {
                this.localVideoRef.nativeElement.srcObject = this.localStream;
            }

            this.isStreaming.set(true);

            // Connect to signaling server
            this.connectSocket();

        } catch (err: any) {
            console.error('Camera error:', err);
            if (err.name === 'NotAllowedError') {
                this.errorMessage.set('Camera permission denied. Please allow camera access and try again.');
            } else if (err.name === 'NotFoundError') {
                this.errorMessage.set('No camera found on this device.');
            } else {
                this.errorMessage.set(`Camera error: ${err.message}`);
            }
        }
    }

    private getQualityConstraints(): any {
        switch (this.videoQuality()) {
            case 'low': return { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 15 } };
            case 'high': return { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } };
            default: return { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24 } };
        }
    }

    public connectSocket(): void {
        const id = this.matchId();
        if (!id) return;

        this.socketService.connect('/broadcast');
        this.socketService.emit('/broadcast', 'join-match', {
            matchId: id,
            role: 'camera',
            label: this.cameraLabel()
        });

        this.isConnected.set(true);

        // When a director requests our stream, create a peer connection
        this.socketService.on('/broadcast', 'create-offer').subscribe((data: any) => {
            console.log('📹 Director requested stream:', data.directorSocketId);
            this.createPeerConnection(data.directorSocketId);
        });

        // Handle answer from director
        this.socketService.on('/broadcast', 'webrtc-answer').subscribe(async (data: any) => {
            const pc = this.peerConnections.get(data.fromSocketId);
            if (pc) {
                console.log('📹 Received answer from director');
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

                // Process queued candidates
                const queue = this.iceCandidateQueue.get(data.fromSocketId) || [];
                while (queue.length > 0) {
                    const candidate = queue.shift();
                    if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
                this.iceCandidateQueue.delete(data.fromSocketId);
            }
        });

        // Handle ICE candidates from director
        this.socketService.on('/broadcast', 'webrtc-ice-candidate').subscribe(async (data: any) => {
            const pc = this.peerConnections.get(data.fromSocketId);
            if (pc && data.candidate) {
                if (pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } else {
                    const queue = this.iceCandidateQueue.get(data.fromSocketId) || [];
                    queue.push(data.candidate);
                    this.iceCandidateQueue.set(data.fromSocketId, queue);
                }
            }
        });
    }

    private async createPeerConnection(directorSocketId: string): Promise<void> {
        // Clean up existing connection to this director if any
        if (this.peerConnections.has(directorSocketId)) {
            this.peerConnections.get(directorSocketId)?.close();
        }

        // Safety check for WebRTC support
        if (typeof RTCPeerConnection === 'undefined') {
            this.errorMessage.set('WebRTC is not supported in this browser or environment (needs HTTPS).');
            return;
        }

        const pc = new RTCPeerConnection(this.rtcConfig);
        this.peerConnections.set(directorSocketId, pc);

        // Add local stream tracks to the connection
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream!);
            });
        }

        // Send ICE candidates to the director
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.socketService.emit('/broadcast', 'webrtc-ice-candidate', {
                    targetSocketId: directorSocketId,
                    candidate: event.candidate
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`📹 Connection state: ${pc.connectionState}`);
        };

        // Create offer and send to director
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            this.socketService.emit('/broadcast', 'webrtc-offer', {
                targetSocketId: directorSocketId,
                offer: pc.localDescription
            });
        } catch (err) {
            console.error('Failed to create offer:', err);
        }
    }

    stopStream(): void {
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Close all peer connections
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();

        this.isStreaming.set(false);
        this.isConnected.set(false);
    }

    toggleCamera(): void {
        this.useRearCamera.set(!this.useRearCamera());
        if (this.isStreaming()) {
            this.stopStream();
            this.startCamera();
        }
    }

    updateLabel(): void {
        this.socketService.emit('/broadcast', 'update-label', {
            label: this.cameraLabel()
        });
    }
}
