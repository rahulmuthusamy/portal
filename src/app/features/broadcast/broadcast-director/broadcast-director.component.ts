import { Component, OnInit, OnDestroy, signal, inject, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatchService } from '@features/matches/services/match.service';
import { SocketService } from '@core/services/socket.service';

interface CameraFeed {
    socketId: string;
    label: string;
    stream: MediaStream | null;
    peerConnection: RTCPeerConnection | null;
    isConnected: boolean;
    connectionState: string; // New: track RTC states
    replayChunks: Blob[];
    mediaRecorder: MediaRecorder | null;
}

@Component({
    selector: 'app-broadcast-director',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, RouterModule],
    templateUrl: './broadcast-director.component.html',
    styleUrl: './broadcast-director.component.scss'
})
export class BroadcastDirectorComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private matchService = inject(MatchService);
    private socketService = inject(SocketService);

    @ViewChild('programOutput') programOutputRef!: ElementRef<HTMLVideoElement>;
    @ViewChild('replayVideo') replayVideoRef!: ElementRef<HTMLVideoElement>;

    matchId = signal<number | null>(null);
    match = signal<any>(null);
    currentInnings = signal<any>(null);
    allInnings = signal<any[]>([]);

    // Camera feeds
    cameras = signal<CameraFeed[]>([]);
    activeCameraId = signal<string | null>(null);

    // Program output state
    isProgramLive = signal(false);

    // Replay
    isReplayMode = signal(false);
    replaySpeed = signal(0.5);
    replayAvailable = signal(false);

    // Overlay toggle
    showScoreOverlay = signal(true);
    graphicMode = signal<'compact' | 'full'>('compact');

    // Layout mode: 'single' | 'pip' | 'sideBySide'
    layoutMode = signal<'single' | 'pip' | 'sideBySide'>('single');

    // PIP settings
    pipCameraId = signal<string | null>(null);

    // Score data
    striker = signal<any>(null);
    nonStriker = signal<any>(null);
    currentBowler = signal<any>(null);
    recentBalls = signal<string[]>([]);

    // Recording
    isRecording = signal(false);
    private outputRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];

    // Event animation
    eventType = signal<'FOUR' | 'SIX' | 'WICKET' | null>(null);
    showEvent = signal(false);

    // Computed
    score = computed(() => {
        const inn = this.currentInnings();
        if (!inn) return '0/0';
        return `${inn.TotalRuns || 0}/${inn.TotalWickets || 0}`;
    });

    overs = computed(() => {
        const inn = this.currentInnings();
        if (!inn) return '0.0';
        return inn.TotalOvers || '0.0';
    });

    battingTeamName = computed(() => {
        const inn = this.currentInnings();
        const m = this.match();
        if (!inn || !m) return '';
        if (inn.BattingTeamID === m.TeamA_ID) return m.TeamA?.ShortName || m.TeamA?.Name || 'Team A';
        return m.TeamB?.ShortName || m.TeamB?.Name || 'Team B';
    });

    target = computed(() => {
        const inn = this.currentInnings();
        if (!inn || inn.InningsNumber !== 2) return null;
        const first = this.allInnings().find((i: any) => i.InningsNumber === 1);
        if (!first) return null;
        const t = (first.TotalRuns || 0) + 1;
        return { target: t, remaining: Math.max(0, t - (inn.TotalRuns || 0)) };
    });

    runRate = computed(() => this.currentInnings()?.RunRate || '0.00');

    // RTC Config
    private rtcConfig: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
    };

    private iceCandidateQueues: Map<string, RTCIceCandidateInit[]> = new Map();

    // Replay buffer config (30 seconds)
    private REPLAY_BUFFER_MS = 30000;

    private getSupportedMimeType(): string {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4;codecs=avc1',
            'video/mp4'
        ];
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) return type;
        }
        return '';
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const id = +params['id'];
            this.matchId.set(id);
            this.loadMatchData();
            this.connectBroadcastSocket(id);
            this.connectScoringSocket(id);
        });
    }

    ngOnDestroy(): void {
        this.cameras().forEach(cam => {
            cam.peerConnection?.close();
            cam.mediaRecorder?.stop();
        });
        this.socketService.disconnect('/broadcast');
        this.socketService.disconnect('/live-scoring');
    }

    // ═══════════════════════════════════════════════════════════════
    // MATCH DATA (for scorecard overlay)
    // ═══════════════════════════════════════════════════════════════
    loadMatchData(): void {
        const id = this.matchId();
        if (!id) return;

        this.matchService.generateScorecard(id).subscribe({
            next: (res: any) => {
                const data = res.data;
                this.match.set(data.match);
                const scorecards = data.scorecards || [];
                this.allInnings.set(scorecards);
                const active = scorecards.find((i: any) => i.Status === 'InProgress') || scorecards[scorecards.length - 1];
                this.currentInnings.set(active);

                if (active) {
                    const batting = active.batting || active.battingStats || [];
                    this.striker.set(batting.find((p: any) => p.PlayerID === active.currentStrikerID) || null);
                    this.nonStriker.set(batting.find((p: any) => p.PlayerID === active.currentNonStrikerID) || null);
                    const bowling = active.bowling || active.bowlingStats || [];
                    this.currentBowler.set(bowling.find((p: any) => p.PlayerID === active.currentBowlerID) || null);
                    this.recentBalls.set(active.recentBalls || []);
                }
                console.log('📊 Match scorecard updated successfully');
            },
            error: (err) => {
                console.error('❌ Failed to load match data. Check CORS or API connection.', err);
            }
        });
    }

    connectScoringSocket(id: number): void {
        this.socketService.connect('/live-scoring');
        this.socketService.emit('/live-scoring', 'join-match', id);

        this.socketService.on('/live-scoring', 'ball-scored').subscribe((data: any) => {
            console.log('🏏 Real-time ball received!', data);
            this.loadMatchData();

            // Trigger visual effects
            if (data.ball?.IsWicket) {
                this.triggerEvent('WICKET');
            } else if (data.ball?.RunsScored === 6 && !data.ball?.ExtraType) {
                this.triggerEvent('SIX');
            } else if (data.ball?.RunsScored === 4 && !data.ball?.ExtraType) {
                this.triggerEvent('FOUR');
            }
        });

        this.socketService.on('/live-scoring', 'wicket').subscribe((data: any) => {
            console.log('☝️ Wicket event received!');
            this.loadMatchData();
            this.triggerEvent('WICKET');
        });

        this.socketService.on('/live-scoring', 'ball-recorded').subscribe(() => {
            console.log('✅ Ball confirmation received');
            this.loadMatchData();
        });
    }

    triggerEvent(type: 'FOUR' | 'SIX' | 'WICKET'): void {
        this.eventType.set(type);
        this.showEvent.set(true);
        setTimeout(() => {
            this.showEvent.set(false);
            this.eventType.set(null);
        }, 3500);
    }

    setGraphicMode(mode: 'compact' | 'full'): void {
        this.graphicMode.set(mode);
        this.socketService.emit('/broadcast', 'update-overlay-mode', {
            matchId: this.matchId(),
            mode
        });
        console.log('📡 Switched graphic mode to:', mode);
    }

    // ═══════════════════════════════════════════════════════════════
    // BROADCAST SOCKET (WebRTC signaling)
    // ═══════════════════════════════════════════════════════════════
    connectBroadcastSocket(matchId: number): void {
        this.socketService.connect('/broadcast');
        this.socketService.emit('/broadcast', 'join-match', {
            matchId,
            role: 'director',
            label: 'Director'
        });

        // Receive camera list
        this.socketService.on('/broadcast', 'camera-list').subscribe((data: any) => {
            data.cameras.forEach((cam: any) => this.addCameraFeed(cam));
        });

        // New camera joined
        this.socketService.on('/broadcast', 'camera-joined').subscribe((data: any) => {
            this.addCameraFeed(data.newCamera);
        });

        // Camera left
        this.socketService.on('/broadcast', 'camera-left').subscribe((data: any) => {
            this.removeCameraFeed(data.leftSocketId);
        });

        // Receive WebRTC offer from camera
        this.socketService.on('/broadcast', 'webrtc-offer').subscribe((data: any) => {
            this.handleOffer(data.fromSocketId, data.offer, data.label);
        });

        // Receive ICE candidate from camera
        this.socketService.on('/broadcast', 'webrtc-ice-candidate').subscribe(async (data: any) => {
            const cam = this.cameras().find(c => c.socketId === data.fromSocketId);
            if (cam?.peerConnection && data.candidate) {
                const pc = cam.peerConnection;
                if (pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } else {
                    const queue = this.iceCandidateQueues.get(data.fromSocketId) || [];
                    queue.push(data.candidate);
                    this.iceCandidateQueues.set(data.fromSocketId, queue);
                }
            }
        });

        // Camera label updated
        this.socketService.on('/broadcast', 'camera-updated').subscribe((data: any) => {
            const cams = this.cameras();
            data.cameras.forEach((serverCam: any) => {
                const existing = cams.find(c => c.socketId === serverCam.socketId);
                if (existing) {
                    existing.label = serverCam.label;
                }
            });
            this.cameras.set([...cams]);
        });
    }

    addCameraFeed(camInfo: any): void {
        const existing = this.cameras().find(c => c.socketId === camInfo.socketId);
        if (existing) return;

        const feed: CameraFeed = {
            socketId: camInfo.socketId,
            label: camInfo.label,
            stream: null,
            peerConnection: null,
            isConnected: false,
            connectionState: 'new',
            replayChunks: [],
            mediaRecorder: null
        };

        this.cameras.update(cams => [...cams, feed]);

        // Small delay to ensure state is updated before requesting
        setTimeout(() => {
            console.log(`📹 Requesting stream from ${camInfo.label}...`);
            this.socketService.emit('/broadcast', 'request-camera', {
                cameraSocketId: camInfo.socketId
            });
        }, 500);
    }

    refreshConnections(): void {
        console.log('🔄 Refreshing all camera connections...');
        this.cameras().forEach(cam => {
            cam.peerConnection?.close();
            cam.stream = null;
            cam.isConnected = false;

            this.socketService.emit('/broadcast', 'request-camera', {
                cameraSocketId: cam.socketId
            });
        });
        this.cameras.set([...this.cameras()]);
    }

    removeCameraFeed(socketId: string): void {
        const cam = this.cameras().find(c => c.socketId === socketId);
        if (cam) {
            cam.peerConnection?.close();
            cam.mediaRecorder?.stop();
        }
        this.cameras.update(cams => cams.filter(c => c.socketId !== socketId));

        if (this.activeCameraId() === socketId) {
            this.activeCameraId.set(null);
        }
        if (this.pipCameraId() === socketId) {
            this.pipCameraId.set(null);
        }
    }

    async handleOffer(fromSocketId: string, offer: RTCSessionDescriptionInit, label: string): Promise<void> {
        const cam = this.cameras().find(c => c.socketId === fromSocketId);
        if (!cam) return;

        const pc = new RTCPeerConnection(this.rtcConfig);
        cam.peerConnection = pc;

        // Receive remote stream
        pc.ontrack = (event) => {
            console.log('📹 Director received track from', label);
            cam.stream = event.streams[0];
            cam.isConnected = true;
            this.cameras.set([...this.cameras()]);

            // Start recording for replay buffer
            this.startReplayBuffer(cam);

            // Auto-select first camera as active
            if (!this.activeCameraId()) {
                this.activeCameraId.set(cam.socketId);
                this.isProgramLive.set(true);
            }
        };

        // Send ICE candidates back to camera
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.socketService.emit('/broadcast', 'webrtc-ice-candidate', {
                    targetSocketId: fromSocketId,
                    candidate: event.candidate
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`📹 PC state for ${label}: ${pc.connectionState}`);
            cam.connectionState = pc.connectionState;
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                cam.isConnected = false;
            }
            this.cameras.set([...this.cameras()]);
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`📹 ICE state for ${label}: ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === 'connected') {
                cam.isConnected = true;
                this.cameras.set([...this.cameras()]);
            }
        };

        // Set remote description and create answer
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Process queued ice candidates
        const queue = this.iceCandidateQueues.get(fromSocketId) || [];
        while (queue.length > 0) {
            const candidate = queue.shift();
            if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        this.iceCandidateQueues.delete(fromSocketId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.socketService.emit('/broadcast', 'webrtc-answer', {
            targetSocketId: fromSocketId,
            answer: pc.localDescription
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // REPLAY SYSTEM
    // ═══════════════════════════════════════════════════════════════
    startReplayBuffer(cam: CameraFeed): void {
        if (!cam.stream) return;

        try {
            const mimeType = this.getSupportedMimeType();
            if (!mimeType) {
                console.warn('MediaRecorder not supported on this browser');
                return;
            }

            const recorder = new MediaRecorder(cam.stream, {
                mimeType: mimeType,
                videoBitsPerSecond: 2500000
            });

            cam.mediaRecorder = recorder;
            cam.replayChunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    cam.replayChunks.push(event.data);

                    // Keep buffer manageable (approx 3 mins @ 500ms chunks)
                    // CRITICAL: We MUST keep the first chunk (index 0) because it contains the WebM/MP4 headers
                    // If we shift index 0, the video becomes unplayable.
                    if (cam.replayChunks.length > 400) {
                        // Remove second chunk, keeping index 0
                        cam.replayChunks.splice(1, 1);
                    }
                    this.replayAvailable.set(true);
                }
            };

            recorder.start(1000); // Capture in 1-second chunks
        } catch (err) {
            console.warn('MediaRecorder not supported for replay:', err);
        }
    }

    triggerReplay(): void {
        const activeCam = this.cameras().find(c => c.socketId === this.activeCameraId());
        if (!activeCam || activeCam.replayChunks.length === 0) return;

        // Create replay blob from last N chunks
        const blob = new Blob(activeCam.replayChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        this.isReplayMode.set(true);

        // Play replay in a separate video element
        setTimeout(() => {
            if (this.replayVideoRef?.nativeElement) {
                const video = this.replayVideoRef.nativeElement;
                video.src = url;
                video.playbackRate = this.replaySpeed();
                video.play();

                video.onended = () => {
                    this.isReplayMode.set(false);
                    URL.revokeObjectURL(url);
                };
            }
        }, 100);
    }

    exitReplay(): void {
        this.isReplayMode.set(false);
        if (this.replayVideoRef?.nativeElement) {
            this.replayVideoRef.nativeElement.pause();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CAMERA SWITCHING
    // ═══════════════════════════════════════════════════════════════
    switchToCamera(socketId: string): void {
        this.activeCameraId.set(socketId);
        this.exitReplay();
    }

    setPipCamera(socketId: string): void {
        if (socketId === this.activeCameraId()) return;
        this.pipCameraId.set(socketId);
        this.layoutMode.set('pip');
    }

    setLayout(mode: 'single' | 'pip' | 'sideBySide'): void {
        this.layoutMode.set(mode);
        if (mode === 'single') {
            this.pipCameraId.set(null);
        } else if (mode === 'sideBySide' || mode === 'pip') {
            // Auto-select second camera for PIP/side-by-side if not set
            if (!this.pipCameraId()) {
                const otherCam = this.cameras().find(c => c.socketId !== this.activeCameraId() && c.isConnected);
                if (otherCam) {
                    this.pipCameraId.set(otherCam.socketId);
                }
            }
        }
    }

    getActiveStream(): MediaStream | null {
        return this.cameras().find(c => c.socketId === this.activeCameraId())?.stream || null;
    }

    getPipStream(): MediaStream | null {
        return this.cameras().find(c => c.socketId === this.pipCameraId())?.stream || null;
    }

    // ═══════════════════════════════════════════════════════════════
    // RECORDING (Save broadcast)
    // ═══════════════════════════════════════════════════════════════
    async toggleRecording(): Promise<void> {
        if (this.isRecording()) {
            this.outputRecorder?.stop();
            this.isRecording.set(false);
        } else {
            const activeCam = this.cameras().find(c => c.socketId === this.activeCameraId());
            if (!activeCam?.stream) return;

            try {
                this.outputRecorder = new MediaRecorder(activeCam.stream, {
                    mimeType: 'video/webm;codecs=vp9'
                });
                this.recordedChunks = [];

                this.outputRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) this.recordedChunks.push(e.data);
                };

                this.outputRecorder.onstop = () => {
                    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `match-${this.matchId()}-recording-${Date.now()}.webm`;
                    a.click();
                    URL.revokeObjectURL(url);
                };

                this.outputRecorder.start(1000);
                this.isRecording.set(true);
            } catch (err) {
                console.error('Recording failed:', err);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════
    getPlayerName(player: any): string {
        if (!player) return '-';
        return player.Name || player.PlayerName || `${player.FirstName || ''} ${player.LastName || ''}`.trim() || '-';
    }

    getOverlayUrl(): string {
        return `/overlay/${this.matchId()}`;
    }
}
