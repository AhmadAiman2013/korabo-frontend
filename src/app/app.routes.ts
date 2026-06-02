import { Routes } from '@angular/router';
import { authGuard } from './login/auth.guard';
import { Login } from './login/login';
import { Chat } from './chat/chat';

export const routes: Routes = [
  { path: 'login', component: Login, title: 'Login' },
  { path: '', component: Chat, title: 'Chat App', canActivate: [authGuard] },
  { path: '**', redirectTo: '' }, // catch-all back to guarded root
];
