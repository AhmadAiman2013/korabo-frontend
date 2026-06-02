import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  Injector,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { Badge } from 'primeng/badge';
import { Button } from 'primeng/button';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { InputText } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tooltip } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { ChatMessage, ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  imports: [
    Avatar,
    Badge,
    Button,
    InputGroup,
    InputGroupAddon,
    InputText,
    ReactiveFormsModule,
    Tooltip,
    CommonModule,
    FormsModule,
  ],
  templateUrl: './chat.html',
})
export class Chat {
  @ViewChild('msgWrap') msgWrap!: ElementRef<HTMLDivElement>;

  svc = inject(ChatService);
  inputText = signal('');
  searchQuery = '';
  private _prevMsgCount = 0;

  private injector = inject(Injector);

  constructor() {
    effect(() => {
      this.svc.activeConversation()?.messages.length;
      afterNextRender(() => this.scrollToBottom(), { injector: this.injector });
    });
  }
  filteredConvs = computed(() => {
    const q = this.searchQuery.toLowerCase();
    return this.svc.conversations().filter((c) => c.participants[0].name.toLowerCase().includes(q));
  });

  avatarColor(userId: string): string {
    const colors: Record<string, string> = {
      u1: '#0f766e',
      u2: '#7c3aed',
      u3: '#d97706',
      u4: '#be185d',
      me: '#2563eb',
    };
    return colors[userId] ?? '#475569';
  }

  send() {
    const text = this.inputText();
    if (!text.trim()) return;
    this.svc.sendMessage(text);
    this.inputText.set('');
  }

  shouldShowDate(messages: ChatMessage[], index: number): boolean {
    if (index === 0) return true;
    const cur = messages[index].timestamp;
    const prev = messages[index - 1].timestamp;
    return cur.toDateString() !== prev.toDateString();
  }

  formatDateLabel(date: Date): string {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  formatMsgTime(date: Date): string {
    return date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  ngAfterViewChecked() {
    const conv = this.svc.activeConversation();
    const count = conv?.messages.length ?? 0;
    if (count !== this._prevMsgCount) {
      this._prevMsgCount = count;
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    const el = this.msgWrap?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
