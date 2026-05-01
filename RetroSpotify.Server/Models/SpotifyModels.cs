using System.Text.Json.Serialization;

namespace RetroSpotify.Server.Models;

public record TrackDto(string Id, string Name, string Artist, string Duration, string AlbumArt, string Uri);
public record PlaylistDto(string Id, string Name, string ImageUrl, int TotalTracks);

public record SpotifyRawResponse(
    [property: JsonPropertyName("items")] List<SpotifyItem> Items
);

public record SpotifyItem(
    [property: JsonPropertyName("track")] SpotifyTrack? Track
);

public record SpotifyPlaylistResponse(
    [property: JsonPropertyName("items")] List<SpotifyPlaylistItems> Items
);

public record SpotifyPlaylistItems(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("images")] List<SpotifyImage>? Images,
    [property: JsonPropertyName("tracks")] SpotifyTracksInfo? Tracks,
    [property: JsonPropertyName("owner")] SpotifyOwner Owner
);

public record SpotifyTracksInfo(
    [property: JsonPropertyName("total")] int Total
);

public record SpotifyPlaylistTracksResponse(
    [property: JsonPropertyName("items")] List<SpotifyItem> Items 
);

public record SpotifyTrack(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("uri")] string Uri,
    [property: JsonPropertyName("artists")] List<SpotifyArtist> Artists,
    [property: JsonPropertyName("duration_ms")] int DurationMs,
    [property: JsonPropertyName("album")] SpotifyAlbum Album 
);

public record SpotifyAlbum(
    [property: JsonPropertyName("images")] List<SpotifyImage> Images
);

public record SpotifyArtist(
    [property: JsonPropertyName("name")] string Name
);

public record SpotifyImage(
    [property: JsonPropertyName("url")] string Url
);

public record SpotifyPlaylistDetailResponse(
    [property: JsonPropertyName("items")] SpotifyPlaylistTracksContainer? Items
);

public record SpotifyPlaylistTracksContainer(
    [property: JsonPropertyName("items")] List<SpotifyPlaylistItem>? Items,
    [property: JsonPropertyName("next")] string? Next,
    [property: JsonPropertyName("total")] int Total
);
public record SpotifyPlaylistItem(
    [property: JsonPropertyName("item")] SpotifyTrack? Track
);

public record SpotifyOwner(
    [property: JsonPropertyName("id")] string Id
);

public record SpotifyUserResponse(
    [property: JsonPropertyName("id")] string Id
);