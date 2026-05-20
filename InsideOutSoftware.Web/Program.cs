using InsideOutSoftware.Web.Components;
using InsideOutSoftware.Web.Services;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorComponents();
builder.Services.AddSingleton<ProjectService>();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor
        | ForwardedHeaders.XForwardedProto
        | ForwardedHeaders.XForwardedHost;

    // Azure Container Apps sits behind a reverse proxy, so trust forwarded
    // headers from the ingress layer when reconstructing the public URL.
    #pragma warning disable ASPDEPR005
    options.KnownNetworks.Clear();
    #pragma warning restore ASPDEPR005
    options.KnownProxies.Clear();
});

var app = builder.Build();

app.UseForwardedHeaders();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseHttpsRedirection();

app.Use(async (context, next) =>
{
    var host = context.Request.Host.Host;

    if (host.StartsWith("www.", StringComparison.OrdinalIgnoreCase))
    {
        var newUrl = $"https://{host[4..]}{context.Request.Path}{context.Request.QueryString}";

        context.Response.Redirect(newUrl, permanent: true);

        return;
    }

    await next();
});


app.UseStaticFiles();
app.UseAntiforgery();

app.MapStaticAssets();
app.MapRazorComponents<App>();

app.Run();
