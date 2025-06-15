import axios from 'axios';

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
  email?: string;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

class DiscordService {
  private clientId = '1383812613640556679';
  private clientSecret = 'mBj7gItCTA3DOqDmls0VNqXC4zqPDmWJ';
  private redirectUri = process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.replit.app/api/auth/discord/callback'
    : 'http://localhost:5000/api/auth/discord/callback';

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'identify email',
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<DiscordTokenResponse> {
    const response = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  }

  async getUserInfo(accessToken: string): Promise<DiscordUser> {
    const response = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }
}

export const discordService = new DiscordService();