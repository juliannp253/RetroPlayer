namespace RetroSpotify.Server.Services;

public interface ISpotifyAuthService
{
    Task<string> GetAccessTokenAsync(string code);
    Task<string> RefreshAccessTokenAsync(string refreshToken);
}