using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using RetroSpotify.Server.Models;
using RetroSpotify.Server.Services;
using System.Web;

namespace RetroSpotify.Server.Controllers;

[ApiController]
[Route("api/[controller]")] 
public class AuthController : ControllerBase
{
    private readonly SpotifySettings _settings;
    private readonly ISpotifyAuthService _spotifyAuthService;

    public AuthController(IOptions<SpotifySettings> settings, ISpotifyAuthService authService)
    {
        _settings = settings.Value;
        _spotifyAuthService = authService;
    }

    [HttpGet("login")]
    public IActionResult Login()
    {
        var scopes = "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state user-top-read user-read-recently-played playlist-read-private playlist-read-collaborative";

        var baseUrl = "https://accounts.spotify.com/authorize";

        var queryParams = HttpUtility.ParseQueryString(string.Empty);
        queryParams["client_id"] = _settings.ClientId;
        queryParams["response_type"] = "code";
        queryParams["redirect_uri"] = _settings.RedirectUri;
        queryParams["scope"] = scopes;
        queryParams["show_dialog"] = "true"; 

        var loginUrl = $"{baseUrl}?{queryParams}";

        return Redirect(loginUrl);
    }

    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string code)
    {
        if (string.IsNullOrEmpty(code))
        {
            return BadRequest("No se proporcionó un código de Spotify.");
        }

        try
        {
            var tokenResponse = await _spotifyAuthService.GetAccessTokenAsync(code);
            return Content(tokenResponse, "application/json");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al intercambiar el token: {ex.Message}");
        }
    }

    [HttpGet("refresh")]
    public async Task<IActionResult> Refresh([FromQuery] string refreshToken)
    {
        if (string.IsNullOrEmpty(refreshToken))
        {
            return BadRequest("No se proporcionó un refresh token.");
        }

        try
        {
            var newTokenResponse = await _spotifyAuthService.RefreshAccessTokenAsync(refreshToken);
            return Content(newTokenResponse, "application/json");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al refrescar el token: {ex.Message}");
        }
    }
}