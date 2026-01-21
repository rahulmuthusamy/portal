import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit {
  userInput = '';
  sessionId = 'session-' + Date.now();
  messages: { role: 'user' | 'bot', text: string }[] = [];

  defaultPrompts = [
    'What type of form are you looking to create?',
    'Need help filling out a form field?',
    'Do you want to update a submitted form?',
    'How to submit a vacation request?',
    'Can I delete a saved form record?'
  ];

  @ViewChild('chatWindow') chatWindow!: ElementRef;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.scrollToBottom();
  }

  usePrompt(prompt: string) {
    this.userInput = prompt;
    this.sendMessage();
  }

  sendMessage() {
    const message = this.userInput.trim();
    if (!message) return;

    this.messages.push({ role: 'user', text: message });
    this.userInput = '';
    this.scrollToBottom();

    this.http.post<any>('http://localhost:3000/api/chat', {
      userMessage: message,
      sessionId: this.sessionId
    }).subscribe({
      next: (res) => {
        this.messages.push({ role: 'bot', text: res.reply });
        this.scrollToBottom();
      },
      error: () => {
        this.messages.push({ role: 'bot', text: 'Error getting response. Try again.' });
        this.scrollToBottom();
      }
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.chatWindow) {
        this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
