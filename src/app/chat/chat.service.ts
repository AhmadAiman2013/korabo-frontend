import { Injectable, signal, computed } from '@angular/core';

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  isTyping?: boolean;
}

export interface Conversation {
  id: string;
  participants: ChatUser[];
  messages: ChatMessage[];
  unread: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  readonly currentUser: ChatUser = {
    id: 'me',
    name: 'You',
    avatar: 'Y',
    status: 'online',
  };

  readonly users: ChatUser[] = [
    { id: 'u1', name: 'Aiman Hakim', avatar: 'AH', status: 'online' },
    { id: 'u2', name: 'Sarah Chen', avatar: 'SC', status: 'online' },
    { id: 'u3', name: 'Dev Bot', avatar: 'DB', status: 'away' },
    { id: 'u4', name: 'Raj Patel', avatar: 'RP', status: 'offline', lastSeen: '2h ago' },
  ];

  private _conversations = signal<Conversation[]>([
    {
      id: 'c1',
      participants: [this.users[0]],
      unread: 2,
      messages: [
        {
          id: 'm1',
          senderId: 'u1',
          text: 'Hey! Checked the new PrimeNG v21 release?',
          timestamp: new Date(Date.now() - 3600000 * 2),
          status: 'read',
        },
        {
          id: 'm2',
          senderId: 'me',
          text: 'Just installing it now actually 🔥',
          timestamp: new Date(Date.now() - 3600000 * 1.9),
          status: 'read',
        },
        {
          id: 'm3',
          senderId: 'u1',
          text: 'The new theming system with @primeuix is a game changer',
          timestamp: new Date(Date.now() - 3600000 * 1.5),
          status: 'read',
        },
        {
          id: 'm4',
          senderId: 'me',
          text: 'Agreed — way cleaner than the old SCSS overrides',
          timestamp: new Date(Date.now() - 3600000),
          status: 'delivered',
        },
        {
          id: 'm5',
          senderId: 'u1',
          text: 'BTW congrats on the XR offer! Big move 🎉',
          timestamp: new Date(Date.now() - 600000),
          status: 'read',
        },
        {
          id: 'm6',
          senderId: 'u1',
          text: 'Adtech infra is going to be super interesting',
          timestamp: new Date(Date.now() - 300000),
          status: 'read',
        },
      ],
    },
    {
      id: 'c2',
      participants: [this.users[1]],
      unread: 0,
      messages: [
        {
          id: 'm7',
          senderId: 'u2',
          text: 'K3s cluster looking stable this week?',
          timestamp: new Date(Date.now() - 86400000),
          status: 'read',
        },
        {
          id: 'm8',
          senderId: 'me',
          text: 'Yep! Sorted the R2 bucket alias issue finally',
          timestamp: new Date(Date.now() - 82800000),
          status: 'read',
        },
        {
          id: 'm9',
          senderId: 'u2',
          text: 'Nice, ente photos self-hosted is so worth it',
          timestamp: new Date(Date.now() - 79200000),
          status: 'read',
        },
      ],
    },
    {
      id: 'c3',
      participants: [this.users[2]],
      unread: 5,
      messages: [
        {
          id: 'm10',
          senderId: 'u3',
          text: 'CI pipeline completed. Build #47 — all checks passed ✅',
          timestamp: new Date(Date.now() - 7200000),
          status: 'read',
        },
        {
          id: 'm11',
          senderId: 'u3',
          text: 'Lint: OK | Tests: 142 passed | Coverage: 87%',
          timestamp: new Date(Date.now() - 7199000),
          status: 'read',
        },
        {
          id: 'm12',
          senderId: 'u3',
          text: 'Build #48 started. Running golangci-lint v2...',
          timestamp: new Date(Date.now() - 900000),
          status: 'read',
        },
        {
          id: 'm13',
          senderId: 'u3',
          text: '⚠️  warning: unused import in kafka/producer.go:14',
          timestamp: new Date(Date.now() - 850000),
          status: 'read',
        },
        {
          id: 'm14',
          senderId: 'u3',
          text: 'Build #48 — FAILED. 1 lint error.',
          timestamp: new Date(Date.now() - 800000),
          status: 'read',
        },
      ],
    },
    {
      id: 'c4',
      participants: [this.users[3]],
      unread: 0,
      messages: [
        {
          id: 'm15',
          senderId: 'u4',
          text: 'Diploma final project coming along?',
          timestamp: new Date(Date.now() - 172800000),
          status: 'read',
        },
        {
          id: 'm16',
          senderId: 'me',
          text: 'Auth service done! Working on study groups feature next',
          timestamp: new Date(Date.now() - 169200000),
          status: 'read',
        },
        {
          id: 'm17',
          senderId: 'u4',
          text: 'August deadline will be tight. Good luck man 💪',
          timestamp: new Date(Date.now() - 165600000),
          status: 'read',
        },
      ],
    },
  ]);

  readonly activeConvId = signal<string>('c1');

  readonly conversations = computed(() => this._conversations());

  readonly activeConversation = computed(
    () => this._conversations().find((c) => c.id === this.activeConvId())!,
  );

  setActiveConversation(id: string) {
    this.activeConvId.set(id);
    this._conversations.update((convs) =>
      convs.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    );
  }

  sendMessage(text: string) {
    const conv = this.activeConversation();
    if (!conv || !text.trim()) return;

    const newMsg: ChatMessage = {
      id: `m${Date.now()}`,
      senderId: 'me',
      text: text.trim(),
      timestamp: new Date(),
      status: 'sent',
    };

    this._conversations.update((convs) =>
      convs.map((c) => (c.id === conv.id ? { ...c, messages: [...c.messages, newMsg] } : c)),
    );

    // Simulate reply after delay
    const peer = conv.participants[0];
    const replies = [
      'Got it! 👍',
      'Makes sense, let me check on that.',
      'Interesting point...',
      'Will do, thanks!',
      'Roger that 🚀',
      'Sounds good to me!',
    ];
    const delay = 1200 + Math.random() * 2000;

    setTimeout(() => {
      // Add typing indicator
      const typingMsg: ChatMessage = {
        id: `typing-${Date.now()}`,
        senderId: peer.id,
        text: '',
        timestamp: new Date(),
        status: 'sent',
        isTyping: true,
      };
      this._conversations.update((convs) =>
        convs.map((c) => (c.id === conv.id ? { ...c, messages: [...c.messages, typingMsg] } : c)),
      );

      setTimeout(() => {
        // Remove typing, add real reply
        const replyText = replies[Math.floor(Math.random() * replies.length)];
        this._conversations.update((convs) =>
          convs.map((c) =>
            c.id === conv.id
              ? {
                  ...c,
                  messages: [
                    ...c.messages.filter((m) => !m.isTyping),
                    {
                      id: `r${Date.now()}`,
                      senderId: peer.id,
                      text: replyText,
                      timestamp: new Date(),
                      status: 'delivered',
                    },
                  ],
                }
              : c,
          ),
        );
      }, 1200);
    }, delay);
  }

  getLastMessage(conv: Conversation): string {
    const last = conv.messages[conv.messages.length - 1];
    if (!last) return '';
    if (last.isTyping) return 'typing...';
    const prefix = last.senderId === 'me' ? 'You: ' : '';
    return prefix + (last.text.length > 35 ? last.text.slice(0, 35) + '…' : last.text);
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-MY', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-MY', { day: '2-digit', month: 'short' });
    }
  }
}
