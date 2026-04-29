using Microsoft.Extensions.Options;
using RetroSpotify.Server.Models;
using System.Net.Http.Headers;

namespace RetroSpotify.Server.Services;

public class SpotifyAuthService : ISpotifyAuthService
{
    private readonly HttpClient _httpClient;
    private readonly SpotifySettings _settings;

    public SpotifyAuthService(HttpClient httpClient, IOptions<SpotifySettings> settings)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
    }

    public async Task<string> GetAccessTokenAsync(string code)
    {
        var authHeader = Convert.ToBase64String(
            System.Text.Encoding.UTF8.GetBytes($"{_settings.ClientId}:{_settings.ClientSecret}"));

        var requestContent = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("grant_type", "authorization_code"),
            new KeyValuePair<string, string>("code", code),
            new KeyValuePair<string, string>("redirect_uri", _settings.RedirectUri),
            new KeyValuePair<string, string>("client_id", _settings.ClientId),
            new KeyValuePair<string, string>("client_secret", _settings.ClientSecret)
        });

        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", authHeader);

        var response = await _httpClient.PostAsync("https://accounts.spotify.com/api/token", requestContent);

        return await response.Content.ReadAsStringAsync();
    }

    public async Task<string> RefreshAccessTokenAsync(string refreshToken)
    {
        var authHeader = Convert.ToBase64String(
            System.Text.Encoding.UTF8.GetBytes($"{_settings.ClientId}:{_settings.ClientSecret}"));
        var requestContent = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("grant_type", "refresh_token"),
            new KeyValuePair<string, string>("refresh_token", refreshToken),
            new KeyValuePair<string, string>("client_id", _settings.ClientId),
            new KeyValuePair<string, string>("client_secret", _settings.ClientSecret)
        });
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", authHeader);
        var response = await _httpClient.PostAsync("https://accounts.spotify.com/api/token", requestContent);
        return await response.Content.ReadAsStringAsync();
    }
}