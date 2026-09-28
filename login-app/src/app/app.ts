import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

export type AuthTab = 'login' | 'register';

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private fb = inject(FormBuilder);

  // App Title
  readonly title = signal('login-app');

  // Active View State
  readonly activeTab = signal<AuthTab>('login');
  readonly isLoading = signal(false);
  readonly isLoggedIn = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  // Toast & Modal States
  readonly toast = signal<ToastInfo | null>(null);
  readonly showForgotModal = signal(false);
  readonly forgotEmail = signal('');
  readonly forgotSuccess = signal(false);

  // Authenticated User Profile
  readonly currentUser = signal<UserProfile | null>(null);

  // Password Strength State
  readonly registerPassword = signal('');
  readonly passwordStrength = computed(() => {
    const pwd = this.registerPassword();
    if (!pwd) return { score: 0, label: '', color: '#94a3b8', percent: 0 };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: '#f43f5e', percent: 25 };
      case 2:
        return { score: 2, label: 'Fair', color: '#fb923c', percent: 50 };
      case 3:
        return { score: 3, label: 'Good', color: '#38bdf8', percent: 75 };
      case 4:
        return { score: 4, label: 'Strong', color: '#10b981', percent: 100 };
      default:
        return { score: 0, label: 'Too short', color: '#94a3b8', percent: 15 };
    }
  });

  // Forms
  readonly loginForm: FormGroup = this.fb.group({
    email: ['alex.morgan@aura.tech', [Validators.required, Validators.email]],
    password: ['Master@Pass2026', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true],
  });

  readonly registerForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    agreeTerms: [false, [Validators.requiredTrue]],
  });

  // Clean form getters for template
  get loginEmail() { return this.loginForm.get('email'); }
  get loginPassword() { return this.loginForm.get('password'); }
  get regFullName() { return this.registerForm.get('fullName'); }
  get regEmail() { return this.registerForm.get('email'); }
  get regPassword() { return this.registerForm.get('password'); }
  get regConfirmPassword() { return this.registerForm.get('confirmPassword'); }
  get regAgreeTerms() { return this.registerForm.get('agreeTerms'); }

  constructor() {
    // Sync register password with strength calculator signal
    this.registerPasswordCtrl?.valueChanges.subscribe((val) => {
      this.registerPassword.set(val || '');
    });
  }

  private get registerPasswordCtrl() {
    return this.registerForm.get('password');
  }

  setTab(tab: AuthTab) {
    this.activeTab.set(tab);
    this.toast.set(null);
  }

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((v) => !v);
  }

  prevent(e: Event) {
    e.preventDefault();
  }

  onForgotEmailInput(val: string) {
    this.forgotEmail.set(val);
  }

  // Quick fill demo helper
  fillDemo(type: 'admin' | 'designer') {
    if (type === 'admin') {
      this.loginForm.patchValue({
        email: 'alex.morgan@aura.tech',
        password: 'SecureAdminPassword!9',
        rememberMe: true,
      });
      this.showToast('Demo Admin credentials filled!', 'info');
    } else {
      this.loginForm.patchValue({
        email: 'sarah.connor@nexus.design',
        password: 'CreativePassword#24',
        rememberMe: false,
      });
      this.showToast('Demo Designer credentials filled!', 'info');
    }
  }

  // Login Submit Handler
  onLoginSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.showToast('Please check the form for invalid fields.', 'error');
      return;
    }

    this.isLoading.set(true);

    setTimeout(() => {
      this.isLoading.set(false);
      const email = this.loginForm.value.email || 'user@aura.io';
      const cleanName = email.split('@')[0].replace(/[._-]/g, ' ');
      const displayName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

      this.currentUser.set({
        name: displayName,
        email: email,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'Enterprise Administrator',
      });

      this.isLoggedIn.set(true);
      this.showToast(`Welcome back, ${displayName}! Access authorized.`, 'success');
    }, 1100);
  }

  // Register Submit Handler
  onRegisterSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.showToast('Please fill out all required registration fields.', 'error');
      return;
    }

    const { fullName, email, password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.showToast('Passwords do not match. Please verify.', 'error');
      return;
    }

    this.isLoading.set(true);

    setTimeout(() => {
      this.isLoading.set(false);
      this.currentUser.set({
        name: fullName || 'New User',
        email: email,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'Lead Cloud Architect',
      });

      this.isLoggedIn.set(true);
      this.showToast(`Account created successfully! Welcome to Aura, ${fullName}.`, 'success');
    }, 1300);
  }

  // Social Login Handler
  handleSocialLogin(provider: string) {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.currentUser.set({
        name: `${provider} Authenticated User`,
        email: `member@${provider.toLowerCase()}.com`,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        role: `${provider} SSO Member`,
      });
      this.isLoggedIn.set(true);
      this.showToast(`Signed in securely via ${provider}!`, 'success');
    }, 900);
  }

  // Logout Handler
  logout() {
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.activeTab.set('login');
    this.showToast('You have signed out securely.', 'info');
  }

  // Forgot Password Dialog
  openForgotModal() {
    this.forgotEmail.set(this.loginForm.value.email || '');
    this.forgotSuccess.set(false);
    this.showForgotModal.set(true);
  }

  closeForgotModal() {
    this.showForgotModal.set(false);
  }

  sendPasswordReset() {
    const email = this.forgotEmail();
    if (!email || !email.includes('@')) {
      this.showToast('Please provide a valid email address.', 'error');
      return;
    }
    this.forgotSuccess.set(true);
    this.showToast(`Encrypted reset link sent to ${email}`, 'success');
    setTimeout(() => {
      this.closeForgotModal();
    }, 2000);
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toast.set({ message, type });
    setTimeout(() => {
      if (this.toast()?.message === message) {
        this.toast.set(null);
      }
    }, 4500);
  }
}
