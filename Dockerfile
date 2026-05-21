FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["InsideOutSoftware.Web/InsideOutSoftware.Web.csproj", "InsideOutSoftware.Web/"]
RUN dotnet restore "InsideOutSoftware.Web/InsideOutSoftware.Web.csproj"

COPY . .
WORKDIR /src/InsideOutSoftware.Web
RUN dotnet publish "InsideOutSoftware.Web.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "InsideOutSoftware.Web.dll"]
