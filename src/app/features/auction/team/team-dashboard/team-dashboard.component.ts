import { Component, OnInit, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-team-dashboard',
  imports: [CommonModule],
  templateUrl: './team-dashboard.component.html',
  styleUrls: ['./team-dashboard.component.scss']
})
export class TeamDashboardComponent implements OnInit, OnDestroy {
  socket!: Socket;
  progress = 100;
  private maxTime = 30;

  team = {
    id: 1,
    name: 'Team A',
    budget: 20000,
    players: [] as any[]
  };

  currentPlayer: any = null;
  highestBid = 0;
  highestBidTeam = '';
  timer = 30;

  // ✅ Add bidHistory array
  bidHistory: { amount: number; team: string; time: Date }[] = [];

  ngOnInit() {
    this.socket = io('http://localhost:3000/auction-team');

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);

      this.socket.emit('join-session', 1);
      this.socket.emit('join-team-room', this.team.id);
    });

    this.socket.on('currentPlayer', (player: any) => {
      this.currentPlayer = player;
      this.highestBid = player.currentBid;
      this.highestBidTeam = player.highestBidTeam || 'No bids yet';

      // Reset bid history for new player
      this.bidHistory = [];
    });

    this.socket.on('bidUpdate', (data: any) => {
      this.highestBid = data.amount;
      this.highestBidTeam = data.teamName;

      // ✅ Push to bid history
      this.bidHistory.unshift({
        amount: data.amount,
        team: data.teamName,
        time: new Date()
      });
    });

    this.socket.on('timerUpdate', (data: any) => {
      this.timer = data.timeLeft;
      this.progress = (data.timeLeft / this.maxTime) * 100;
    });

    this.socket.on('playerUpdate', (updatedPlayer: any) => {
      if (
        updatedPlayer.status === 'sold' &&
        updatedPlayer.highestBidTeam === this.team.id
      ) {
        this.team.players.push(updatedPlayer);
        this.team.budget -= updatedPlayer.currentBid;
      }
    });

    this.socket.on('bidRejected', (data: any) => {
      alert(data.reason || 'Bid rejected');
    });
  }

  get nextBid(): number {
    return this.currentPlayer ? this.currentPlayer.currentBid + 500 : 0;
  }

  canBid(): boolean {
    return (
      this.currentPlayer &&
      this.currentPlayer.status === 'live' &&
      this.team.budget >= this.nextBid
    );
  }

  placeBid() {
    if (this.canBid()) {
      this.socket.emit('place-bid', {
        teamId: this.team.id,
        playerId: this.currentPlayer.id,
        bidAmount: this.nextBid
      });
    }
  }

  ngOnDestroy() {
    if (this.socket) this.socket.disconnect();
  }
}
