namespace InsideOutSoftware.Web.Models
{
    public sealed class ProjectModel
    {
        public string Id { get; init; } = string.Empty;
        public string Title { get; init; } = string.Empty;
        public string Description { get; init; } = string.Empty;
        public string ImgSrc { get; init; } = string.Empty;
        public string ImgAlt { get; init; } = string.Empty;
        public IReadOnlyList<string> GalleryImages { get; init; } = [];
        public string? Link { get; init; }
        public bool Border { get; init; }
        public ProjectType Type { get; init; }
        public string? ComponentName { get; init; }
        public string? ProjectUrl { get; init; }
    }

    public enum ProjectType
    {
        ImageGallery,
        WebComponent,
        HtmlProject
    }
}
