using System.Net.Http.Headers;
using RetroSpotify.Server.Models;

namespace RetroSpotify.Server.Services;

public class SpotifyMusicService : ISpotifyMusicService
{
    private readonly HttpClient _httpClient;

    public SpotifyMusicService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<TrackDto>> GetUserTopTracksAsync(string accessToken)
    {
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _httpClient.GetAsync("https://api.spotify.com/v1/me/player/recently-played?limit=10");
        if (!response.IsSuccessStatusCode) return new List<TrackDto>();

        var data = await response.Content.ReadFromJsonAsync<SpotifyRawResponse>();

        return data?.Items.Select(i => new TrackDto(
            i.Track.Id,                                          
            i.Track.Name,                                        
            i.Track.Artists.FirstOrDefault()?.Name ?? "Unknown", 
            FormatDuration(i.Track.DurationMs),                  
            i.Track.Album.Images.FirstOrDefault()?.Url ?? "",
            i.Track.Uri
        ))
        .DistinctBy(t => t.Id)
        .Take(10)
        .ToList() ?? new List<TrackDto>();
    }

    public async Task<List<PlaylistDto>> GetUserPlaylistsAsync(string accessToken)
    {
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var userResponse = await _httpClient.GetAsync("https://api.spotify.com/v1/me");
        if (!userResponse.IsSuccessStatusCode) return new List<PlaylistDto>();
        var userData = await userResponse.Content.ReadFromJsonAsync<SpotifyUserResponse>();
        var myId = userData?.Id;

        var response = await _httpClient.GetAsync("https://api.spotify.com/v1/me/playlists");
        if (!response.IsSuccessStatusCode) return new List<PlaylistDto>();

        var data = await response.Content.ReadFromJsonAsync<SpotifyPlaylistResponse>();

        return data?.Items
            .Where(p => p.Owner.Id == myId)
            .Select(p => new PlaylistDto(
                p.Id,
                p.Name,
                p.Images?.FirstOrDefault()?.Url ?? "",
                p.Tracks?.Total ?? 0
            )).ToList() ?? new List<PlaylistDto>();
    }

    public async Task<List<TrackDto>> GetPlaylistTracksAsync(string accessToken, string playlistId)
    {
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var allTracks = new List<TrackDto>();

        var response = await _httpClient.GetAsync($"https://api.spotify.com/v1/playlists/{playlistId}?limit=100");
        if (!response.IsSuccessStatusCode) return allTracks;

        var data = await response.Content.ReadFromJsonAsync<SpotifyPlaylistDetailResponse>();

        if (data?.Items?.Items != null)
            allTracks.AddRange(MapItems(data.Items.Items));

        var nextUrl = data?.Items?.Next;

        while (!string.IsNullOrEmpty(nextUrl))
        {
            var pageResponse = await _httpClient.GetAsync(nextUrl);
            if (!pageResponse.IsSuccessStatusCode) break;

            var pageData = await pageResponse.Content.ReadFromJsonAsync<SpotifyPlaylistTracksContainer>();

            if (pageData?.Items != null)
                allTracks.AddRange(MapItems(pageData.Items));

            nextUrl = pageData?.Next;
        }

        return allTracks;
    }

    private string FormatDuration(int ms)
    {
        var t = TimeSpan.FromMilliseconds(ms);
        return $"{t.Minutes:D2}:{t.Seconds:D2}";
    }

    private IEnumerable<TrackDto> MapItems(List<SpotifyPlaylistItem> items) =>
    items
        .Where(i => i.Track != null)
        .Select(i => new TrackDto(
            i.Track!.Id,
            i.Track.Name,
            i.Track.Artists?.FirstOrDefault()?.Name ?? "Unknown Artist",
            FormatDuration(i.Track.DurationMs),
            i.Track.Album?.Images?.FirstOrDefault()?.Url ?? "",
            i.Track.Uri
        ));
}