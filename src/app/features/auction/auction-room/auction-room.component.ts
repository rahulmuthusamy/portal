import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../services/socket.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Player } from '../models/player.model';
import { Team } from '../models/team.model';


@Component({
  selector: 'app-auction-room',

  imports: [CommonModule, FormsModule],
  templateUrl: './auction-room.component.html',
  styleUrls: ['./auction-room.component.scss']
})
export class AuctionRoomComponent implements OnInit, OnDestroy {
  players: Player[] = [];
  teams: Team[] = [];
  currentPlayer: Player | null = null;
  timer: number = 0;
  highestBid: number = 0;
  highestBidTeamName: string = '';
  loading = true;
  subscriptions: Subscription[] = [];
  maxTime = 30;
  timerProgress = 100;
  bidHistory: { amount: number; team: string; time: Date }[] = [];

  constructor(private socketService: SocketService) { }

  ngOnInit() {
    this.socketService.connect(1);

    this.subscriptions.push(
      this.socketService.on<{ teamName: string; amount: number }>('bidUpdate').subscribe(data => {
        this.highestBid = data.amount;
        this.highestBidTeamName = data.teamName;

        if (this.currentPlayer) {
          this.currentPlayer.currentBid = data.amount;

          const matchedTeam = this.teams.find(t => t.name === data.teamName);
          this.currentPlayer.highestBidTeamId = matchedTeam ? matchedTeam.id : null;
        }
      })
    );


    this.subscriptions.push(
      this.socketService.on<Player[]>('players').subscribe(players => {
        this.players = players;
        this.loading = false;
      }),

      this.socketService.on<Team[]>('teams').subscribe(teams => {
        this.teams = teams;
      }),

      this.socketService.on<Player>('currentPlayer').subscribe(player => {

        this.currentPlayer = player;
        this.updateHighestBidInfo();
        this.bidHistory = [];
      }),

      this.socketService.on<{ timeLeft: number }>('timerUpdate').subscribe(data => {
        this.timer = data.timeLeft;
        this.timerProgress = (this.timer / this.maxTime) * 100;
      }),

      this.socketService.on<Player>('playerUpdate').subscribe(player => {
        const idx = this.players.findIndex(p => p.id === player.id);
        if (idx > -1) this.players[idx] = player;

        if (this.currentPlayer && this.currentPlayer.id === player.id) {
          this.currentPlayer = player;
          this.updateHighestBidInfo();
        }
      }),


      this.socketService.on<Team>('teamUpdate').subscribe(team => {
        const idx = this.teams.findIndex(t => t.id === team.id);
        if (idx > -1) this.teams[idx] = team;
        this.updateHighestBidInfo();
      }),

      this.socketService.on('auctionEnd').subscribe(() => {
        alert('Auction Ended!');
      }),

      this.socketService.on<{ reason: string }>('bidRejected').subscribe(data => {
        alert(`Bid rejected: ${data.reason}`);
      })
    );
  }


  updateHighestBidInfo() {
    if (!this.currentPlayer) return;

    this.highestBid = this.currentPlayer.currentBid ?? this.currentPlayer.basePrice ?? 0;

    if (this.currentPlayer.highestBidTeamId) {
      const team = this.teams.find(t => t.id === this.currentPlayer!.highestBidTeamId);
      this.highestBidTeamName = team ? team.name : '';
    } else {
      this.highestBidTeamName = 'No bids yet';
    }
  }

  placeBid(team: Team) {
    if (!this.currentPlayer) return;

    const minIncrement = 100;
    const currentBid = this.currentPlayer.currentBid ?? this.currentPlayer.basePrice ?? 0;
    const newBid = currentBid + minIncrement;

    if (team.budget < newBid) {
      alert(`${team.name} does not have enough budget to place this bid.`);
      return;
    }

    this.socketService.emit('placeBid', {
      playerId: this.currentPlayer.id,
      teamId: team.id,
      bidAmount: newBid
    });

    // ✅ Push to bid history
    this.bidHistory.unshift({
      amount: newBid,
      team: team.name,
      time: new Date()
    });
  }

  // Auctioneer Controls
  startPlayer() {
    this.socketService.emit('start-player');
  }

  skipPlayer() {
    this.socketService.emit('skip-player');
  }

  sellPlayer() {
    this.socketService.emit('sell-player');
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.socketService.disconnect();
  }
}
