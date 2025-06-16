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
                    Id = "html-glacier",
                    Title = "Glacier Melt",
                    ImgSrc = "Images/GlacierMelt/glaciermelt01.png",
                    ImgAlt = "Glacier Melt",
                    Description = "An interactive dashboard built with HTML, CSS, and JavaScript that visualizes global glacier retreat and its environmental impact from 1990 to 2024.",
                    Type = ProjectType.HtmlProject,
                    ProjectUrl = "/projects/glacier/glacier.html"
                },
                new ProjectModel
                {
                    Id = "pharmacy-app",
                    Title = "Pharmacy App",
                    ImgSrc = "Images/PharmacyApp/pharmacyApp01.png",
                    ImgAlt = "PharmacyApp",
                    Description = "This Pharmacy App is an app built using Xamarin and .NET Maui to allow users to access their prescription history and refill prescriptions as needed.",
                    ImgFolder = "PharmacyApp",
                    Type = ProjectType.ImageGallery
                },
                new ProjectModel
                {
                    Id = "welldata-mobilert",
                    Title = "WellData™ MobileRT",
                    ImgSrc = "Images/MobileRT/mobilert01.png",
                    ImgAlt = "WellData MobileRT",
                    Description = "WellData™ MobileRT was an app built using Xamarin Forms to monitor drilling rig information in real time.",
                    ImgFolder = "MobileRT",
                    Type = ProjectType.ImageGallery
                },
                new ProjectModel
                {
                    Id = "sharp-remote",
                    Title = "Sharp Remote",
                    ImgSrc = "Images/SharpRemote/sharpremote01.png",
                    ImgAlt = "Sharp Remote",
                    Description = "Sharp Remote was a personal project developed after my kids kept losing the TV remote. It uses web sockets to send remote commands to the TV, and a SQL Lite database to store custom buttons the user can set.",
                    ImgFolder = "SharpRemote",
                    Border = true,
                    Type = ProjectType.ImageGallery
                }
            };
        }

        public List<ProjectModel> GetAllProjects() => _projects;

        public ProjectModel GetProjectById(string id) => _projects.FirstOrDefault(p => p.Id == id);
    }
}