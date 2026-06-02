import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Chat } from './chat/chat';
import { authGuard } from './login/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login, title: 'Login' },
  { path: '', component: Chat, title: 'Chat App', canActivate: [authGuard] },
  { path: '**', redirectTo: '' }, // catch-all back to guarded root
];
