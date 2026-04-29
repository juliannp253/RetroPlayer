using RetroSpotify.Server.Models;

namespace RetroSpotify.Server.Services;

public interface ISpotifyMusicService
{
    Task<List<TrackDto>> GetUserTopTracksAsync(string accessToken);
    Task<List<PlaylistDto>> GetUserPlaylistsAsync(string accessToken);
    Task<List<TrackDto>> GetPlaylistTracksAsync(string accessToken, string playlistId);
}