using InsideOutSoftware.Web.Models;

namespace InsideOutSoftware.Web.Services
{
    public class ProjectService
    {
        private readonly List<ProjectModel> _projects;

        public ProjectService()
        {
            _projects = new List<ProjectModel>
            {
                new ProjectModel
                {
                    Id = "pharmacy-app",
                    Title = "Pharmacy App",
                    ImgSrc = "Images/PharmacyApp/pharmacyApp01.png",
                    ImgAlt = "PharmacyApp",
                    Description = "This Pharmacy App is an app built using Xamarin and .NET Maui to allow users to access their prescription history and refill prescriptions as needed.",
                    GalleryImages =
                    [
                        "Images/PharmacyApp/pharmacyApp01.png",
                        "Images/PharmacyApp/pharmacyApp02.png",
                        "Images/PharmacyApp/pharmacyApp03.png",
                        "Images/PharmacyApp/pharmacyApp04.png",
                        "Images/PharmacyApp/pharmacyApp05.png"
                    ],
                    Type = ProjectType.ImageGallery
                },
                new ProjectModel
                {
                    Id = "welldata-mobilert",
                    Title = "WellData™ MobileRT",
                    ImgSrc = "Images/MobileRT/mobilert01.png",
                    ImgAlt = "WellData MobileRT",
                    Description = "WellData™ MobileRT was an app built using Xamarin Forms to monitor drilling rig information in real time.",
                    GalleryImages =
                    [
                        "Images/MobileRT/mobilert01.png",
                        "Images/MobileRT/mobilert02.png",
                        "Images/MobileRT/mobilert03.png",
                        "Images/MobileRT/mobilert04.png",
                        "Images/MobileRT/mobilert05.png"
                    ],
                    Type = ProjectType.ImageGallery
                },
                new ProjectModel
                {
                    Id = "sharp-remote",
                    Title = "Sharp Remote",
                    ImgSrc = "Images/SharpRemote/sharpremote01.png",
                    ImgAlt = "Sharp Remote",
                    Description = "Sharp Remote was a personal project developed after my kids kept losing the TV remote. It uses web sockets to send remote commands to the TV, and a SQL Lite database to store custom buttons the user can set.",
                    GalleryImages =
                    [
                        "Images/SharpRemote/sharpremote01.png",
                        "Images/SharpRemote/sharpremote02.png",
                        "Images/SharpRemote/sharpremote03.png",
                        "Images/SharpRemote/sharpremote04.png",
                        "Images/SharpRemote/sharpremote05.png"
                    ],
                    Border = true,
                    Type = ProjectType.ImageGallery
                },
                new ProjectModel
                {
                    Id = "html-glacier",
                    Title = "Glacier Melt",
                    ImgSrc = "Images/GlacierMelt/glaciermelt01.png",
                    ImgAlt = "Glacier Melt",
                    Description = "An interactive dashboard built with HTML, CSS, and JavaScript that visualizes global glacier retreat and its environmental impact from 1990 to 2024.",
                    Type = ProjectType.HtmlProject,
                    ProjectUrl = "/projects/glacier.html"
                },
                new ProjectModel
                {
                    Id = "html-news",
                    Title = "News Explorer",
                    ImgSrc = "Images/News/news01.png",
                    ImgAlt = "News Explorer",
                    Description = "A responsive news aggregator built with HTML, CSS, and JavaScript that fetches and displays current headlines from multiple sources with filtering and search capabilities.",
                    Type = ProjectType.HtmlProject,
                    ProjectUrl = "/projects/news.html"
                },
                new ProjectModel
                {
                    Id = "html-newsletterarchive",
                    Title = "Newsletter Archive",
                    ImgSrc = "Images/NewsletterArchive/newsletterarchive01.png",
                    ImgAlt = "Newsletter Archive",
                    Description = "A responsive newsletter archive system built with HTML, CSS, and JavaScript that allows users to browse and search through historical newsletters with categorization and filtering options.",
                    Type = ProjectType.HtmlProject,
                    ProjectUrl = "/projects/newsletterarchive.html"
                }
            };
        }

        public IReadOnlyList<ProjectModel> GetAllProjects() => _projects;

        public ProjectModel? GetProjectById(string id) =>
            _projects.FirstOrDefault(p => string.Equals(p.Id, id, StringComparison.OrdinalIgnoreCase));
    }
}
