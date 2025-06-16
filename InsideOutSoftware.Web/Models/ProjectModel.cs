namespace InsideOutSoftware.Web.Models
{
    public class ProjectModel
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string ImgSrc { get; set; }
        public string ImgAlt { get; set; }
        public string ImgFolder { get; set; }
        public string Link { get; set; }
        public bool Border { get; set; }
        public ProjectType Type { get; set; }
        public string ComponentName { get; set; }
        public string ProjectUrl { get; set; }
    }

    public enum ProjectType
    {
        ImageGallery,
        WebComponent,
        HtmlProject
    }
}