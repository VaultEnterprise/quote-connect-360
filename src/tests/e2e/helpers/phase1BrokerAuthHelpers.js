/**
 * Phase 1 Authentication Helpers
 * Manages login/logout for broker, admin, and MGA personas
 */

export class Phase1AuthHelpers {
  constructor(page) {
    this.page = page;
  }

  async loginAsAdmin(email, password) {
    await this.page.goto('/login');
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/', { timeout: 10000 });
    return true;
  }

  async loginAsMGAUser(email, password) {
    await this.page.goto('/login');
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(/\/mga|\/dashboard/, { timeout: 10000 });
    return true;
  }

  async loginAsBroker(email, password) {
    await this.page.goto('/login');
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(/\/broker|\/dashboard/, { timeout: 10000 });
    return true;
  }

  async logout() {
    await this.page.goto('/logout');
    await this.page.waitForURL('/login', { timeout: 5000 });
    return true;
  }

  async isLoggedIn() {
    try {
      const response = await this.page.evaluate(() => {
        return localStorage.getItem('auth_token') ? true : false;
      });
      return response;
    } catch (err) {
      return false;
    }
  }

  async getCurrentUserEmail() {
    try {
      const email = await this.page.evaluate(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.email || null;
      });
      return email;
    } catch (err) {
      return null;
    }
  }

  async getCurrentUserRole() {
    try {
      const role = await this.page.evaluate(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.role || null;
      });
      return role;
    } catch (err) {
      return null;
    }
  }
}