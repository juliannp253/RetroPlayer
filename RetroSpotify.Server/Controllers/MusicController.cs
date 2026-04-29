using Microsoft.AspNetCore.Mvc;
using RetroSpotify.Server.Services;

namespace RetroSpotify.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MusicController : ControllerBase
{
    private readonly ISpotifyMusicService _musicService;

    public MusicController(ISpotifyMusicService musicService)
    {
        _musicService = musicService;
    }

    [HttpGet("playlists")]
    public async Task<IActionResult> GetPlaylists()
    {
        var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        try
        {
            var playlists = await _musicService.GetUserPlaylistsAsync(token);
            if (playlists == null || !playlists.Any() && string.IsNullOrEmpty(token))
                return Unauthorized();

            return Ok(playlists);
        }
        catch (Exception) 
        {
            return Unauthorized(); 
        }
    }

    [HttpGet("playlists/{id}")]
    public async Task<IActionResult> GetPlaylistTracks(string id)
    {
        var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        var tracks = await _musicService.GetPlaylistTracksAsync(token, id);
        return Ok(tracks);
    }

    [HttpGet("top-tracks")]
    public async Task<IActionResult> GetTopTracks()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        var token = authHeader.Replace("Bearer ", "");

        if (string.IsNullOrEmpty(token)) return Unauthorized();

        var tracks = await _musicService.GetUserTopTracksAsync(token);
        return Ok(tracks);
    }
}